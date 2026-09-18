import { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { postPredict } from '../lib/api';
import { authenticSample, syntheticSample } from '../lib/signal';
import type { PredictionResponse } from '../types';

/**
 * Forensic engine UI. POST /predict contract, WaveSurfer create/destroy lifecycle,
 * the hidden <audio> fallback, the mel-spectrogram canvas and the two synthesised demo
 * presets are all ported from the original UploadAnalyze component — see CLAUDE.md
 * § DO NOT BREAK. The presets build real WAV input and go through the real endpoint.
 */
export function ForensicAnalyzer({
  isMock,
  onResult,
}: {
  isMock: boolean;
  onResult?: (r: PredictionResponse) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<PredictionResponse | null>(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const wsRef = useRef<WaveSurfer | null>(null);
  const waveHostRef = useRef<HTMLDivElement | null>(null);
  const melRef = useRef<HTMLCanvasElement | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  /* ---- WaveSurfer lifecycle (unchanged behaviour) ---- */
  useEffect(() => {
    if (!waveHostRef.current || !audioUrl) return;

    if (wsRef.current) {
      try {
        wsRef.current.destroy();
      } catch {
        /* already gone */
      }
      wsRef.current = null;
    }

    try {
      const ws = WaveSurfer.create({
        container: waveHostRef.current,
        url: audioUrl,
        height: 88,
        waveColor: '#8b9498',
        progressColor: '#2fb6c9',
        cursorColor: '#e8ecec',
        cursorWidth: 1,
        barWidth: 2,
        barGap: 2,
        barRadius: 0,
        normalize: true,
      });
      ws.on('ready', () => setDuration(ws.getDuration()));
      ws.on('audioprocess', (t: number) => setTime(t));
      ws.on('play', () => setPlaying(true));
      ws.on('pause', () => setPlaying(false));
      ws.on('finish', () => setPlaying(false));
      wsRef.current = ws;
    } catch (err) {
      console.error('WaveSurfer unavailable, using audio element fallback:', err);
    }

    return () => {
      if (wsRef.current) {
        try {
          wsRef.current.destroy();
        } catch {
          /* already gone */
        }
        wsRef.current = null;
      }
    };
  }, [audioUrl]);

  /* ---- mel spectrogram ---- */
  useEffect(() => {
    if (!result?.mel_spectrogram || !melRef.current) return;
    const canvas = melRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const mel = result.mel_spectrogram;
    const rows = mel.length;
    const cols = mel[0]?.length ?? 0;
    if (!rows || !cols) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    let min = Infinity;
    let max = -Infinity;
    for (const row of mel)
      for (const v of row) {
        if (v < min) min = v;
        if (v > max) max = v;
      }
    const range = max - min || 1;

    const cellW = rect.width / cols;
    const cellH = rect.height / rows;

    for (let r = 0; r < rows; r++) {
      const y = rect.height - (r + 1) * cellH; // low mel bands at the bottom
      for (let c = 0; c < cols; c++) {
        const norm = Math.max(0, Math.min(1, (mel[r][c] - min) / range));
        ctx.fillStyle = melColor(norm);
        ctx.fillRect(c * cellW, y, Math.ceil(cellW) + 0.5, Math.ceil(cellH) + 0.5);
      }
    }
  }, [result]);

  /* ---- upload ---- */
  async function analyse(selected: File) {
    setFile(selected);
    setError(null);
    setBusy(true);
    setPlaying(false);
    setTime(0);
    setResult(null);
    setAudioUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(selected);
    });

    try {
      const data = await postPredict(selected);
      setResult(data);
      onResult?.(data);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'Analysis failed. Check that the detection service is running.',
      );
    } finally {
      setBusy(false);
    }
  }

  function togglePlay() {
    if (wsRef.current) {
      wsRef.current.playPause();
    } else if (audioElRef.current) {
      if (audioElRef.current.paused) {
        audioElRef.current.play().catch(() => {});
        setPlaying(true);
      } else {
        audioElRef.current.pause();
        setPlaying(false);
      }
    }
  }

  function restart() {
    if (wsRef.current) {
      wsRef.current.setTime(0);
      wsRef.current.play();
    } else if (audioElRef.current) {
      audioElRef.current.currentTime = 0;
      audioElRef.current.play().catch(() => {});
      setPlaying(true);
    }
  }

  /* ---- synthesised demo input (real WAV, real endpoint) ---- */
  function loadPreset(kind: 'authentic' | 'synthetic') {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioCtx({ sampleRate: 16000 });
    const sampleRate = 16000;
    const durationSec = 3;
    const n = sampleRate * durationSec;
    const buffer = ctx.createBuffer(1, n, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < n; i++) {
      const t = i / sampleRate;
      const base = kind === 'authentic' ? authenticSample(t, durationSec) : syntheticSample(t);
      data[i] = base + (Math.random() - 0.5) * (kind === 'authentic' ? 0.02 : 0.1);
    }

    const name =
      kind === 'authentic' ? 'reference_authentic_speech.wav' : 'reference_synthetic_speech.wav';
    analyse(new File([wavBlob(buffer)], name, { type: 'audio/wav' }));
    ctx.close().catch(() => {});
  }

  const isReal = result?.label === 'REAL';
  const confidence = result ? Math.round(result.confidence * 100) : 0;

  return (
    <section className="band" id="forensics">
      <div className="shell">
        <div className="grid12">
          <div className="col-lead">
            <h2 className="h2">Go deeper when the call is over.</h2>
          </div>
          <div className="col-wide">
            <p className="prose">
              Upload a recording and the ensemble path runs: a fold vote for the verdict, a
              64-band log-mel representation of the whole clip, and the five acoustic descriptors.
              Nothing leaves your machine except the audio you choose to send to your own
              backend.
            </p>
          </div>
        </div>

        {/* input row */}
        <div
          className="grid12"
          style={{ marginTop: 'clamp(2.5rem, 5vw, 3.5rem)', alignItems: 'start' }}
        >
          <div className="col-half">
            <div
              className="dropzone"
              data-over={dragOver}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                const dropped = e.dataTransfer.files?.[0];
                if (dropped) analyse(dropped);
              }}
            >
              <div className="stack-s">
                <h3 className="h3">Analyse a recording</h3>
                <p className="note">
                  Drop a .wav or .mp3 here, up to 30 MB. Clips are truncated or padded to 3
                  seconds for the model.
                </p>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                  <button type="button" className="btn" onClick={() => inputRef.current?.click()}>
                    Choose a file
                  </button>
                  <input
                    ref={inputRef}
                    type="file"
                    accept=".wav,.mp3,audio/*"
                    className="sr"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) analyse(f);
                    }}
                  />
                </div>
                {file && (
                  <p className="mono" style={{ color: 'var(--ink-soft)' }}>
                    {file.name} · {(file.size / 1024).toFixed(0)} KB
                  </p>
                )}
                {error && <p className="alert">{error}</p>}
              </div>
            </div>
          </div>

          <div className="col-half">
            <span className="tag">No recording to hand</span>
            <p className="prose prose--tight" style={{ marginTop: '0.5rem' }}>
              These two presets are generated in your browser as real 16 kHz WAV files and sent
              through the same endpoint as any upload. They are synthesised test signals, not
              human recordings.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '1.25rem' }}>
              <button
                type="button"
                className="btn btn--ghost"
                disabled={busy}
                onClick={() => loadPreset('authentic')}
              >
                Harmonic reference
              </button>
              <button
                type="button"
                className="btn btn--ghost"
                disabled={busy}
                onClick={() => loadPreset('synthetic')}
              >
                Vocoder reference
              </button>
            </div>
          </div>
        </div>

        {/* hidden fallback player */}
        {audioUrl && (
          <audio
            ref={audioElRef}
            src={audioUrl}
            className="sr"
            onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
            onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
            onEnded={() => setPlaying(false)}
          />
        )}

        {busy && (
          <p className="mono" style={{ marginTop: '2rem', color: 'var(--ink-soft)' }}>
            analysing…
          </p>
        )}

        {result && (
          <div style={{ marginTop: 'clamp(2.5rem, 5vw, 4rem)' }}>
            {/* verdict line — paper surface, restrained colour */}
            <div className="grid12" style={{ rowGap: '1.5rem', alignItems: 'end' }}>
              <div className="col-narrow">
                <span className="tag">Verdict</span>
                <div
                  className={`figure ${isReal ? 'verdict-paper--real' : 'verdict-paper--fake'}`}
                  style={{ marginTop: '0.25rem' }}
                >
                  {result.label}
                </div>
              </div>
              <div style={{ gridColumn: 'span 12' }}>
                <ul className="specs">
                  <li>
                    <span>Confidence</span>
                    <span>{confidence}%</span>
                  </li>
                  <li>
                    <span>p(real)</span>
                    <span>{result.prob_real.toFixed(3)}</span>
                  </li>
                  <li>
                    <span>Inference latency</span>
                    <span>{result.latency_ms.toFixed(1)} ms</span>
                  </li>
                  <li>
                    <span>Model</span>
                    <span>
                      {result.is_mock ?? isMock
                        ? 'fallback engine'
                        : result.model_type || 'ensemble'}
                    </span>
                  </li>
                  <li>
                    <span>Clip duration</span>
                    <span>
                      {(result.audio_duration_sec ?? duration).toFixed(2)} s
                    </span>
                  </li>
                </ul>
              </div>
            </div>

            {/* spectrogram centrepiece */}
            <div className="scope" style={{ marginTop: 'clamp(2rem, 4vw, 3rem)' }}>
              <div className="scope__bar">
                <span className="tag">Log-mel spectrogram · 64 bands · 0–8 kHz</span>
                <span className="tag">
                  {result.mel_spectrogram?.[0]?.length ?? 0} frames
                </span>
              </div>
              <div className="scope__body" style={{ padding: 0 }}>
                <canvas
                  ref={melRef}
                  style={{ width: '100%', height: 'clamp(200px, 34vh, 340px)' }}
                  role="img"
                  aria-label="Log-mel spectrogram of the analysed recording"
                />
              </div>
              <div className="scope__foot">
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <button type="button" className="btn btn--onscope" onClick={togglePlay}>
                    {playing ? 'Pause' : 'Play'}
                  </button>
                  <button type="button" className="btn btn--scopeghost" onClick={restart}>
                    Restart
                  </button>
                </div>
                <span className="mono" style={{ color: 'var(--scope-mute)' }}>
                  {fmt(time)} / {fmt(result.audio_duration_sec ?? duration)}
                </span>
              </div>
              <div className="scope__body" style={{ paddingTop: 0 }}>
                <div ref={waveHostRef} />
              </div>
            </div>

            {/* measured descriptors */}
            <div className="grid12" style={{ marginTop: 'clamp(2rem, 4vw, 3rem)' }}>
              <div className="col-narrow">
                <span className="tag">Measured descriptors</span>
              </div>
              <div style={{ gridColumn: 'span 12' }}>
                <ul className="specs">
                  <li>
                    <span>Spectral centroid</span>
                    <span>{result.stats.centroid.toFixed(1)} Hz</span>
                  </li>
                  <li>
                    <span>Spectral bandwidth</span>
                    <span>{result.stats.bandwidth.toFixed(1)} Hz</span>
                  </li>
                  <li>
                    <span>Spectral rolloff</span>
                    <span>{result.stats.rolloff.toFixed(1)} Hz</span>
                  </li>
                  <li>
                    <span>Zero-crossing rate</span>
                    <span>{result.stats.zcr.toFixed(4)}</span>
                  </li>
                  <li>
                    <span>Spectral flatness</span>
                    <span>{result.stats.flatness.toFixed(4)}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

/* dark-surface colormap: deep teal → cyan → warm white */
function melColor(v: number): string {
  if (v < 0.35) {
    const k = v / 0.35;
    return `rgb(${Math.round(10 + k * 8)}, ${Math.round(17 + k * 45)}, ${Math.round(20 + k * 60)})`;
  }
  if (v < 0.72) {
    const k = (v - 0.35) / 0.37;
    return `rgb(${Math.round(18 + k * 29)}, ${Math.round(62 + k * 120)}, ${Math.round(80 + k * 121)})`;
  }
  const k = (v - 0.72) / 0.28;
  return `rgb(${Math.round(47 + k * 200)}, ${Math.round(182 + k * 62)}, ${Math.round(201 + k * 40)})`;
}

const fmt = (s: number) => {
  const total = Number.isFinite(s) ? Math.max(0, s) : 0;
  const m = Math.floor(total / 60);
  const sec = Math.floor(total % 60);
  return `${m}:${sec < 10 ? '0' : ''}${sec}`;
};

/** 16-bit PCM WAV encoder — ported unchanged from the original component. */
function wavBlob(abuffer: AudioBuffer): Blob {
  const chans = abuffer.numberOfChannels;
  const n = abuffer.length;
  const blockAlign = chans * 2;
  const buffer = new ArrayBuffer(44 + n * blockAlign);
  const view = new DataView(buffer);

  const str = (offset: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(offset + i, s.charCodeAt(i));
  };

  str(0, 'RIFF');
  view.setUint32(4, 36 + n * blockAlign, true);
  str(8, 'WAVE');
  str(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, chans, true);
  view.setUint32(24, abuffer.sampleRate, true);
  view.setUint32(28, abuffer.sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true);
  str(36, 'data');
  view.setUint32(40, n * blockAlign, true);

  let offset = 44;
  for (let i = 0; i < n; i++) {
    for (let ch = 0; ch < chans; ch++) {
      const sample = Math.max(-1, Math.min(1, abuffer.getChannelData(ch)[i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
      offset += 2;
    }
  }
  return new Blob([view], { type: 'audio/wav' });
}
