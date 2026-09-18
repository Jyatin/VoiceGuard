import type { SystemHealth } from '../../types';

export function EngineComparison({ health }: { health: SystemHealth | null }) {
  const folds = health?.ensemble_folds ?? 0;
  const threshold = health?.operating_threshold ?? 0.5;
  const e4 = Boolean(health?.engine);

  return (
    <section className="band">
      <div className="shell">
        <div className="grid12">
          <div className="col-lead">
            <h2 className="h2">One system. Two detection engines.</h2>
          </div>
          <div className="col-wide">
            <p className="prose">
              A verdict during a live call and a verdict for evidence are different problems. One
              has to answer while the caller is still talking; the other can afford to think.
              VoiceGuard runs both, over the same feature pipeline and the same operating
              threshold of {threshold.toFixed(2)}.
            </p>
          </div>
        </div>

        <div className="split split--rule" style={{ marginTop: 'clamp(3rem, 6vw, 5rem)' }}>
          <div className="stack-m">
            <span className="tag">Live engine</span>
            <h3 className="h2" style={{ fontSize: 'clamp(1.5rem, 2.6vw, 2.1rem)' }}>
              Built for the moment a voice is heard.
            </h3>
            <p className="prose prose--tight">
              Audio is captured in the browser, downsampled to 16 kHz mono, and streamed over a
              WebSocket. Each ~2 s window is scored on arrival by the same raw-waveform CNN that
              powers the forensic engine, so the verdict tracks the call instead of trailing it.
            </p>
            <ul className="specs">
              <li>
                <span>Model</span>
                <span>{e4 ? health?.engine : 'CNN-BiLSTM, single pass'}</span>
              </li>
              <li>
                <span>Transport</span>
                <span>WebSocket, binary Float32</span>
              </li>
              <li>
                <span>Window</span>
                <span>{e4 ? '2.0 s' : '1.5 s, 1.0 s stride'}</span>
              </li>
              <li>
                <span>Weights loaded</span>
                <span>{health?.lightweight_loaded ? 'yes' : 'not loaded'}</span>
              </li>
            </ul>
          </div>

          <div className="stack-m">
            <span className="tag">Forensic engine</span>
            <h3 className="h2" style={{ fontSize: 'clamp(1.5rem, 2.6vw, 2.1rem)' }}>
              Built for evidence.
            </h3>
            <p className="prose prose--tight">
              {e4
                ? 'An uploaded recording is sliced into consecutive 2 s windows and scored end to end, alongside a full 64-band log-mel representation and the handcrafted acoustic statistics that make a verdict explainable to someone who has to act on it.'
                : 'An uploaded recording gets the slower path: a multi-fold ensemble vote, a full 64-band log-mel representation, and the handcrafted acoustic statistics that make a verdict explainable to someone who has to act on it.'}
            </p>
            <ul className="specs">
              <li>
                <span>Model</span>
                <span>
                  {e4
                    ? health?.engine
                    : folds > 0
                      ? `Ensemble, ${folds} folds`
                      : 'Ensemble (no folds loaded)'}
                </span>
              </li>
              <li>
                <span>Input</span>
                <span>.wav / .mp3 upload</span>
              </li>
              <li>
                <span>Representation</span>
                <span>{e4 ? 'Raw waveform, 2 s chunks' : '64 log-mel, 40 MFCC'}</span>
              </li>
              <li>
                <span>Returns</span>
                <span>verdict, spectrogram, stats</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
