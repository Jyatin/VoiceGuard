import { useEffect, useState } from 'react';
import { useInView } from '../../hooks/useInView';

const STAGES = [
  { n: '01', name: 'Audio capture', detail: 'getUserMedia, 16 kHz mono' },
  { n: '02', name: 'Preprocessing', detail: 'trim, pad, normalise to 3 s' },
  { n: '03', name: 'Feature extraction', detail: '64 log-mel, 40 MFCC, spectral stats' },
  { n: '04', name: 'Neural inference', detail: 'CNN-BiLSTM with attention pooling' },
  { n: '05', name: 'Fold aggregation', detail: 'ensemble vote (upload path only)' },
  { n: '06', name: 'Confidence estimate', detail: 'threshold 0.50' },
  { n: '07', name: 'Verdict', detail: 'real or fake, with latency' },
];

export function ArchitecturePipeline() {
  const { ref, seen } = useInView<HTMLDivElement>(0.3);
  const [lit, setLit] = useState(-1);

  useEffect(() => {
    if (!seen) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setLit(STAGES.length - 1);
      return;
    }
    let i = 0;
    setLit(0);
    const id = setInterval(() => {
      i += 1;
      setLit(i);
      if (i >= STAGES.length - 1) clearInterval(id);
    }, 230);
    return () => clearInterval(id);
  }, [seen]);

  return (
    <section className="band band--dark" id="architecture">
      <div className="shell">
        <div className="grid12">
          <div className="col-lead">
            <h2 className="h2">From waveform to verdict.</h2>
          </div>
          <div className="col-wide">
            <p className="prose">
              Both engines share the same seven stages. The live path skips fold aggregation to
              stay inside its latency budget; the forensic path runs every fold and keeps the
              intermediate representations so they can be inspected afterwards.
            </p>
          </div>
        </div>

        <div ref={ref} style={{ marginTop: 'clamp(2.5rem, 5vw, 4rem)' }}>
          <div className="pipe__trace" data-run={seen}>
            <span style={{ width: seen ? '100%' : 0 }} />
          </div>
          <div className="pipe" data-run={seen}>
            {STAGES.map((s, i) => (
              <div key={s.n} className="pipe__node" data-lit={i <= lit}>
                <span className="tag">{s.n}</span>
                <div className="pipe__name" style={{ marginTop: '0.4rem' }}>
                  {s.name}
                </div>
                <p className="note" style={{ marginTop: '0.3rem', fontSize: '0.8125rem' }}>
                  {s.detail}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
