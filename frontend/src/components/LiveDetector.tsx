import { useEffect, useRef, useState } from 'react';
import { streamUrl } from '../lib/api';
import { drawTrace, fitCanvas } from '../lib/signal';
import type { StreamPrediction } from '../types';

/**
 * Live engine UI. The audio graph and WebSocket contract are ported unchanged from the
 * original LiveDetection component and must stay that way (see CLAUDE.md § DO NOT BREAK):
 *   16 kHz mono AudioContext → analyser (fftSize 128) + ScriptProcessor(4096)
 *   → 24 000-sample (1.5 s) chunks sent as raw binary Float32, advancing 16 000 samples.
 * Only change: the processor now drains into a zero-gain node instead of straight into
 * the speakers, which keeps it firing without routing the microphone back out loud.
 */
export function LiveDetector({ isMock }: { isMock: boolean }) {
  const [listening, setListening] = useState(false);
  const [prediction, setPrediction] = useState<StreamPrediction | null>(null);
  const [history, setHistory] = useState<StreamPrediction[]>([]);
  const [wsStatus, setWsStatus] = useState<'disconnected' | 'connecting' | 'connected'>(
    'disconnected',
  );
  const [error, setError] = useState<string | null>(null);
  const [level, setLevel] = useState(0);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sinkRef = useRef<GainNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const pcmRef = useRef<number[]>([]);
  const waveBufRef = useRef<number[]>(new Array(220).fill(0));
  const specCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const waveCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const resizeHandlerRef = useRef<(() => void) | null>(null);

  useEffect(() => stop, []);

  const connect = (): Promise<WebSocket> =>
    new Promise((resolve, reject) => {
      setWsStatus('connecting');
      const ws = new WebSocket(streamUrl());
      ws.binaryType = 'arraybuffer';

      ws.onopen = () => {
        setWsStatus('connected');
        wsRef.current = ws;
        resolve(ws);
      };
      ws.onmessage = (event) => {
        try {
          const data: StreamPrediction = JSON.parse(event.data);
          setPrediction(data);
          setHistory((h) => [data, ...h].slice(0, 24));
        } catch {
          /* ignore malformed frame */
        }
      };
      ws.onerror = () => {
        setWsStatus('disconnected');
        reject(new Error('Could not reach the detection service on port 8000.'));
      };
      ws.onclose = () => setWsStatus('disconnected');
    });

  async function start() {
    setError(null);
    try {
      let ws = wsRef.current;
      if (!ws || ws.readyState !== WebSocket.OPEN) ws = await connect();

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: false,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;

      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx({ sampleRate: 16000 });
      audioCtxRef.current = ctx;

      const source = ctx.createMediaStreamSource(stream);

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 128;
      analyser.smoothingTimeConstant = 0.8;
      analyserRef.current = analyser;
      source.connect(analyser);

      const targetChunkSamples = 24000; // 1.5 s at 16 kHz
      pcmRef.current = [];
      waveBufRef.current = new Array(220).fill(0);

      const processor = ctx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;
      processor.onaudioprocess = (e) => {
        const input = e.inputBuffer.getChannelData(0);

        let sumSq = 0;
        for (let i = 0; i < input.length; i++) {
          sumSq += input[i] * input[i];
          pcmRef.current.push(input[i]);
        }
        setLevel(Math.min(1, Math.sqrt(sumSq / input.length) * 5));

        const step = Math.max(1, Math.floor(input.length / 8));
        for (let i = 0; i < input.length; i += step) {
          waveBufRef.current.push(Math.abs(input[i]));
          if (waveBufRef.current.length > 220) waveBufRef.current.shift();
        }

        if (pcmRef.current.length >= targetChunkSamples) {
          const chunk = new Float32Array(pcmRef.current.slice(0, targetChunkSamples));
          pcmRef.current = pcmRef.current.slice(16000); // 1.0 s stride
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(chunk.buffer);
          }
        }
      };

      // Silent sink: keeps the processor scheduled without audible monitoring.
      const sink = ctx.createGain();
      sink.gain.value = 0;
      sinkRef.current = sink;
      source.connect(processor);
      processor.connect(sink);
      sink.connect(ctx.destination);

      setListening(true);
      startVisualizer();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Microphone access denied or connection failed.';
      setError(message);
      stop();
    }
  }

  function stop() {
    setListening(false);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;

    if (resizeHandlerRef.current) {
      window.removeEventListener('resize', resizeHandlerRef.current);
      resizeHandlerRef.current = null;
    }

    if (processorRef.current) {
      processorRef.current.onaudioprocess = null;
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    sinkRef.current?.disconnect();
    sinkRef.current = null;

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setWsStatus('disconnected');
    setLevel(0);
  }

  function startVisualizer() {
    const spec = specCanvasRef.current;
    const wave = waveCanvasRef.current;
    const analyser = analyserRef.current;
    if (!spec || !wave || !analyser) return;

    const specCtx = spec.getContext('2d');
    const waveCtx = wave.getContext('2d');
    if (!specCtx || !waveCtx) return;

    let specSize = fitCanvas(spec);
    let waveSize = fitCanvas(wave);
    const bins = analyser.frequencyBinCount;
    const freq = new Uint8Array(bins);

    const onResize = () => {
      specSize = fitCanvas(spec);
      waveSize = fitCanvas(wave);
    };
    window.addEventListener('resize', onResize);
    resizeHandlerRef.current = onResize;

    const loop = () => {
      analyser.getByteFrequencyData(freq);

      specCtx.clearRect(0, 0, specSize.w, specSize.h);
      const step = specSize.w / bins;
      specCtx.fillStyle = '#2fb6c9';
      for (let i = 0; i < bins; i++) {
        const h = (freq[i] / 255) * (specSize.h - 2);
        specCtx.fillRect(i * step, specSize.h - h, Math.max(1, step - 2), Math.max(1, h));
      }

      drawTrace(waveCtx, waveBufRef.current, waveSize.w, waveSize.h, '#e8ecec', 2, 2);

      rafRef.current = requestAnimationFrame(loop);
    };
    loop();
  }

  const isReal = prediction?.label === 'REAL';
  const verdictClass = prediction ? (isReal ? 'verdict--real' : 'verdict--fake') : '';
  const confidence = prediction ? Math.round(prediction.confidence * 100) : null;

  return (
    <section className="band band--dark" id="detector">
      <div className="shell">
        <div className="grid12" style={{ rowGap: 'clamp(2rem, 4vw, 3rem)' }}>
          <div className="col-lead">
            <h2 className="h2">Listen. Analyse. Decide.</h2>
          </div>
          <div className="col-wide">
            <p className="prose">
              Start the microphone and VoiceGuard scores a 1.5-second window every second.
              Nothing is stored: each window is sent, scored, and discarded. The verdict below is
              whatever the model last returned{isMock ? ' from the fallback engine' : ''}.
            </p>
          </div>
        </div>

        <div className="scope" style={{ marginTop: 'clamp(2rem, 4vw, 3rem)' }}>
          <div className="scope__bar">
            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <span className="tag">
                <span
                  className={`led ${wsStatus === 'connected' ? 'led--on' : ''}`}
                  style={{ marginRight: '0.45rem' }}
                />
                {wsStatus === 'connected'
                  ? 'stream active'
                  : wsStatus === 'connecting'
                    ? 'connecting'
                    : 'stream idle'}
              </span>
              <span className="tag">16 kHz mono</span>
              <span className="tag">{isMock ? 'fallback engine' : 'neural weights'}</span>
            </div>
            <span className="tag">{history.length} windows scored</span>
          </div>

          <div className="scope__body">
            <div className="scope__grid" />
            <div
              style={{
                display: 'grid',
                gap: 'clamp(1.25rem, 3vw, 2.5rem)',
                gridTemplateColumns: 'minmax(0, 1fr)',
                position: 'relative',
              }}
            >
              <div className="split" style={{ gap: 'clamp(1.5rem, 3vw, 2.5rem)' }}>
                {/* verdict column */}
                <div className={`stack-m ${verdictClass}`}>
                  <div>
                    <span className="tag">Voice status</span>
                    <div className="verdict__label">{prediction ? prediction.label : 'IDLE'}</div>
                    {prediction ? (
                      <>
                        <div className="mono" style={{ marginTop: '0.35rem' }}>
                          {confidence}% confidence · p(real) {prediction.prob_real.toFixed(3)}
                        </div>
                        <div className="bar" style={{ marginTop: '0.75rem', maxWidth: '260px' }}>
                          <div
                            className={`bar__fill ${isReal ? 'bar__fill--real' : 'bar__fill--fake'}`}
                            style={{ width: `${confidence}%` }}
                          />
                        </div>
                        {!isReal && (
                          <p className="note" style={{ marginTop: '0.75rem' }}>
                            Possible synthetic speech. Treat the caller&rsquo;s identity as
                            unverified.
                          </p>
                        )}
                      </>
                    ) : (
                      <p className="note" style={{ marginTop: '0.5rem' }}>
                        No audio yet. Start the microphone to score a window.
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    className="mic"
                    data-live={listening}
                    onClick={() => (listening ? stop() : start())}
                  >
                    <span className={`led ${listening ? 'led--fake' : 'led--on'}`} />
                    {listening ? 'Stop listening' : 'Start listening'}
                  </button>

                  {error && <p className="alert">{error}</p>}

                  <div style={{ display: 'flex', gap: '2.5rem', flexWrap: 'wrap' }}>
                    <div className="readout">
                      <span className="tag">Latency</span>
                      <span className="readout__value">
                        {prediction ? `${prediction.latency_ms.toFixed(1)} ms` : '—'}
                      </span>
                    </div>
                    <div className="readout">
                      <span className="tag">Input level</span>
                      <span className="readout__value">{(level * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                </div>

                {/* signal column */}
                <div className="stack-m">
                  <div>
                    <span className="tag">Waveform</span>
                    <canvas
                      ref={waveCanvasRef}
                      style={{ width: '100%', height: '84px', marginTop: '0.5rem' }}
                      role="img"
                      aria-label="Rolling microphone waveform"
                    />
                  </div>
                  <div>
                    <span className="tag">Spectrum · 0–8 kHz</span>
                    <canvas
                      ref={specCanvasRef}
                      style={{ width: '100%', height: '84px', marginTop: '0.5rem' }}
                      role="img"
                      aria-label="Live frequency spectrum"
                    />
                  </div>
                  <div>
                    <span className="tag">Inference timeline</span>
                    <ul className="timeline" style={{ marginTop: '0.5rem' }}>
                      {history.length === 0 && (
                        <li style={{ gridTemplateColumns: '1fr' }}>waiting for first window</li>
                      )}
                      {history.map((h, i) => (
                        <li key={`${h.timestamp}-${i}`}>
                          <span className={`led ${h.label === 'REAL' ? 'led--real' : 'led--fake'}`} />
                          <span>{h.label}</span>
                          <span>{Math.round(h.confidence * 100)}%</span>
                          <span>{h.latency_ms.toFixed(0)} ms</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
