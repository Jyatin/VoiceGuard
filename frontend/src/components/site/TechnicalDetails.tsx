import { apiBase } from '../../lib/api';

export function TechnicalDetails() {
  const base = typeof window !== 'undefined' ? apiBase() : '';

  return (
    <section className="band" id="method">
      <div className="shell">
        <div className="grid12">
          <div className="col-lead">
            <h2 className="h2">Built for real-world audio.</h2>
          </div>
          <div className="col-wide stack-m">
            <p className="prose">
              The two paths differ in what they can afford. Everything below is the system as it
              runs, including where it currently falls back.
            </p>
          </div>
        </div>

        <div className="split split--rule" style={{ marginTop: 'clamp(2.5rem, 5vw, 4rem)' }}>
          <div className="stack-s">
            <h3 className="h3">Real-time path</h3>
            <p className="mono" style={{ color: 'var(--ink-soft)', lineHeight: 1.9 }}>
              microphone → 16 kHz mono PCM → 1.5 s window → WebSocket → lightweight CNN-BiLSTM →
              p(real) → verdict
            </p>
            <p className="note">
              One model pass per window, no fold vote, no spectrogram returned. The window
              advances a second at a time so a verdict never depends on a single frame.
            </p>
          </div>
          <div className="stack-s">
            <h3 className="h3">Forensic path</h3>
            <p className="mono" style={{ color: 'var(--ink-soft)', lineHeight: 1.9 }}>
              upload → decode → trim / pad to 3 s → 64 log-mel + 40 MFCC + spectral statistics →
              ensemble folds → averaged p(real) → verdict
            </p>
            <p className="note">
              Returns the waveform, the mel matrix and the descriptor values alongside the
              verdict, so the result can be re-examined without re-running inference.
            </p>
          </div>
        </div>

        <div className="rulelist" style={{ marginTop: 'clamp(2.5rem, 5vw, 4rem)' }}>
          <details>
            <summary className="h3" style={{ cursor: 'pointer' }}>
              Service interface
            </summary>
            <ul className="specs" style={{ marginTop: '1rem' }}>
              <li>
                <span>POST /predict</span>
                <span>multipart audio → verdict, waveform, mel, stats</span>
              </li>
              <li>
                <span>WS /predict-stream</span>
                <span>binary Float32 window → verdict, latency</span>
              </li>
              <li>
                <span>GET /metrics</span>
                <span>evaluation record</span>
              </li>
              <li>
                <span>GET /health</span>
                <span>engine state, threshold, folds loaded</span>
              </li>
              <li>
                <span>Endpoint in use</span>
                <span>{base}</span>
              </li>
            </ul>
          </details>

          <details>
            <summary className="h3" style={{ cursor: 'pointer' }}>
              Implementation
            </summary>
            <ul className="specs" style={{ marginTop: '1rem' }}>
              <li>
                <span>Interface</span>
                <span>React 19, TypeScript, Vite</span>
              </li>
              <li>
                <span>Capture &amp; visualisation</span>
                <span>Web Audio API, Canvas 2D, WaveSurfer.js</span>
              </li>
              <li>
                <span>Service</span>
                <span>FastAPI, Uvicorn, WebSockets</span>
              </li>
              <li>
                <span>Signal processing</span>
                <span>librosa, scipy, NumPy</span>
              </li>
              <li>
                <span>Models</span>
                <span>CNN-BiLSTM attention; k-fold ensemble</span>
              </li>
            </ul>
          </details>

          <details>
            <summary className="h3" style={{ cursor: 'pointer' }}>
              Known limits
            </summary>
            <ul className="specs" style={{ marginTop: '1rem' }}>
              <li>
                <span>Clip length</span>
                <span>scored in 3 s units; 1 s utterances are the weakest case</span>
              </li>
              <li>
                <span>Browser sample rate</span>
                <span>some browsers ignore the 16 kHz request</span>
              </li>
              <li>
                <span>Stream recovery</span>
                <span>a dropped socket needs the microphone restarted</span>
              </li>
              <li>
                <span>Attack coverage</span>
                <span>unseen vocoders are out-of-distribution by definition</span>
              </li>
            </ul>
          </details>
        </div>
      </div>
    </section>
  );
}
