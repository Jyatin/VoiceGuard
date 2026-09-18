import { useEffect, useState } from 'react';
import { getMetrics } from '../../lib/api';
import { useInView } from '../../hooks/useInView';
import type { MetricsData } from '../../types';

function RocPlot({ fpr, tpr, auc }: { fpr: number[]; tpr: number[]; auc?: number }) {
  const { ref, seen } = useInView<HTMLDivElement>(0.3);
  const pts = fpr.map((x, i) => `${(x * 100).toFixed(2)},${(100 - (tpr[i] ?? 0) * 100).toFixed(2)}`);
  const path = `M0,100 L${pts.join(' L')} L100,0`;

  return (
    <div ref={ref}>
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        style={{ width: '100%', height: 'clamp(220px, 34vh, 320px)' }}
        role="img"
        aria-label={`Receiver operating characteristic curve${auc ? `, area under curve ${auc.toFixed(3)}` : ''}`}
      >
        {[25, 50, 75].map((g) => (
          <g key={g} stroke="rgba(255,255,255,0.09)" strokeWidth="0.25">
            <line x1={g} y1="0" x2={g} y2="100" />
            <line x1="0" y1={g} x2="100" y2={g} />
          </g>
        ))}
        <line x1="0" y1="100" x2="100" y2="0" stroke="rgba(255,255,255,0.22)" strokeWidth="0.3" strokeDasharray="1.5 1.5" />
        <path
          d={path}
          fill="none"
          stroke="#2fb6c9"
          strokeWidth="0.9"
          vectorEffect="non-scaling-stroke"
          strokeLinejoin="round"
          style={{
            strokeDasharray: 400,
            strokeDashoffset: seen ? 0 : 400,
            transition: 'stroke-dashoffset 1.6s cubic-bezier(0.3, 0, 0.2, 1)',
          }}
        />
      </svg>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span className="tag">false positive rate →</span>
        <span className="tag">↑ true positive rate</span>
      </div>
    </div>
  );
}

export function PerformanceSection() {
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    getMetrics()
      .then((m) => alive && setMetrics(m))
      .catch(() => alive && setError('Evaluation metrics are unavailable — the service is not reachable.'));
    return () => {
      alive = false;
    };
  }, []);

  const pct = (v?: number) => (typeof v === 'number' ? `${(v * 100).toFixed(1)}%` : '—');
  const cm = metrics?.confusion_matrix;

  return (
    <section className="band band--dark" id="performance">
      <div className="shell">
        <div className="grid12">
          <div className="col-lead">
            <h2 className="h2">Built to perform under imperfect conditions.</h2>
          </div>
          <div className="col-wide">
            <p className="prose">
              Clean studio audio is the easy case. The numbers that matter are the ones from a
              noisy room, a narrowband phone line, a 32 kbps recording, and a caller who only
              says one word. All figures below are read from the service&rsquo;s evaluation
              record, not written into this page.
            </p>
            {error && <p className="alert" style={{ marginTop: '1rem' }}>{error}</p>}
          </div>
        </div>

        {/* headline figures — four columns, hairline separated */}
        <div
          className="split"
          style={{
            marginTop: 'clamp(2.5rem, 5vw, 4rem)',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          }}
        >
          {[
            ['Accuracy', metrics?.accuracy],
            ['Precision', metrics?.precision],
            ['Recall', metrics?.recall],
            ['F1', metrics?.f1],
          ].map(([label, value]) => (
            <div key={label as string}>
              <div className="figure">{pct(value as number | undefined)}</div>
              <span className="tag">{label as string}</span>
            </div>
          ))}
        </div>

        <div className="grid12" style={{ marginTop: 'clamp(3rem, 6vw, 5rem)' }}>
          {/* ROC */}
          <div style={{ gridColumn: 'span 12' }} className="split" >
            <div className="stack-m">
              <div style={{ display: 'flex', gap: '2.5rem', flexWrap: 'wrap' }}>
                <div className="readout">
                  <span className="tag">AUC</span>
                  <span className="readout__value">{metrics?.auc?.toFixed(3) ?? '—'}</span>
                </div>
                <div className="readout">
                  <span className="tag">Equal error rate</span>
                  <span className="readout__value">
                    {metrics?.eer !== undefined ? `${(metrics.eer * 100).toFixed(2)}%` : '—'}
                  </span>
                </div>
                <div className="readout">
                  <span className="tag">Test clips</span>
                  <span className="readout__value">
                    {metrics?.total_test_samples?.toLocaleString() ?? '—'}
                  </span>
                </div>
              </div>

              {cm && (
                <div>
                  <span className="tag">Confusion matrix</span>
                  <ul className="specs" style={{ marginTop: '0.5rem' }}>
                    <li>
                      <span>Real classified real</span>
                      <span>{cm.true_real}</span>
                    </li>
                    <li>
                      <span>Real classified fake</span>
                      <span>{cm.false_fake}</span>
                    </li>
                    <li>
                      <span>Fake classified real</span>
                      <span>{cm.false_real}</span>
                    </li>
                    <li>
                      <span>Fake classified fake</span>
                      <span>{cm.true_fake}</span>
                    </li>
                  </ul>
                  <p className="note" style={{ marginTop: '0.75rem' }}>
                    The costly cell is the third one: synthetic speech accepted as a person.
                  </p>
                </div>
              )}
            </div>

            <div>
              {metrics?.roc_curve ? (
                <RocPlot
                  fpr={metrics.roc_curve.fpr}
                  tpr={metrics.roc_curve.tpr}
                  auc={metrics.auc}
                />
              ) : (
                <p className="note">No curve to draw yet.</p>
              )}
            </div>
          </div>
        </div>

        {/* robustness */}
        <div style={{ marginTop: 'clamp(3rem, 6vw, 5rem)' }}>
          <div className="grid12">
            <div className="col-narrow">
              <h3 className="h3">Accuracy by condition</h3>
            </div>
            <div style={{ gridColumn: 'span 12' }}>
              <div className="rulelist">
                {(metrics?.robustness ?? []).map((r) => (
                  <div key={r.tag} className="sig">
                    <div>
                      <span className="pipe__name">{r.condition}</span>
                      {r.description && (
                        <p className="note" style={{ marginTop: '0.2rem' }}>
                          {r.description}
                        </p>
                      )}
                    </div>
                    <div style={{ alignSelf: 'center' }}>
                      <div className="bar">
                        <div className="bar__fill" style={{ width: `${r.accuracy * 100}%` }} />
                      </div>
                    </div>
                    <div className="mono" style={{ alignSelf: 'center', textAlign: 'right' }}>
                      {(r.accuracy * 100).toFixed(1)}%
                    </div>
                  </div>
                ))}
                {!metrics && <div className="note">Loading evaluation record…</div>}
              </div>
            </div>
          </div>
          {metrics?.ensemble_note && (
            <p className="note" style={{ marginTop: '1.25rem' }}>
              {metrics.ensemble_note}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
