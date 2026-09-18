import type { ReactElement } from 'react';
import type { AcousticStats } from '../../types';

type Signal = {
  name: string;
  unit: string;
  body: string;
  /** small SVG glyph that encodes what the measure does */
  glyph: (id: string) => ReactElement;
  read: (s: AcousticStats) => string;
};

const bars = (heights: number[], mark?: number) => (id: string) => (
  <svg viewBox="0 0 120 40" width="100%" height="40" aria-hidden="true" key={id}>
    {heights.map((h, i) => (
      <rect
        key={i}
        x={i * 8}
        y={40 - h * 36}
        width="5"
        height={Math.max(1, h * 36)}
        fill={mark !== undefined && i === mark ? '#0e6c80' : '#bcc0b9'}
      />
    ))}
  </svg>
);

const SIGNALS: Signal[] = [
  {
    name: 'Spectral centroid',
    unit: 'Hz',
    body:
      'The centre of mass of the spectrum — where the energy sits on average. Synthesis that over-smooths the high end pulls this down; harsh vocoder output pushes it up.',
    glyph: bars([0.2, 0.45, 0.8, 1, 0.75, 0.4, 0.25, 0.15, 0.1, 0.08, 0.06, 0.05, 0.04, 0.03, 0.02], 3),
    read: (s) => `${s.centroid.toFixed(0)} Hz`,
  },
  {
    name: 'Spectral bandwidth',
    unit: 'Hz',
    body:
      'How far energy spreads either side of the centroid. A real vocal tract produces a characteristic spread; generated speech is often narrower or unnaturally even.',
    glyph: bars([0.1, 0.25, 0.5, 0.75, 0.9, 1, 0.9, 0.75, 0.5, 0.25, 0.12, 0.08, 0.05, 0.03, 0.02]),
    read: (s) => `${s.bandwidth.toFixed(0)} Hz`,
  },
  {
    name: 'Spectral rolloff',
    unit: 'Hz',
    body:
      'The frequency below which 85% of the energy lives. It exposes the ceiling a synthesis model or a codec imposed on the signal.',
    glyph: bars([1, 0.95, 0.9, 0.85, 0.8, 0.7, 0.6, 0.45, 0.3, 0.14, 0.05, 0.02, 0.01, 0.01, 0.01], 9),
    read: (s) => `${s.rolloff.toFixed(0)} Hz`,
  },
  {
    name: 'Zero-crossing rate',
    unit: 'per frame',
    body:
      'How often the waveform changes sign. Fricatives raise it naturally; vocoder noise raises it in places where speech has no reason to.',
    glyph: (id) => (
      <svg viewBox="0 0 120 40" width="100%" height="40" aria-hidden="true" key={id}>
        <line x1="0" y1="20" x2="120" y2="20" stroke="#d5d8d2" strokeWidth="1" />
        <path
          d="M0 20 Q4 4 8 20 T16 20 Q20 6 24 20 T32 20 Q36 2 40 20 T48 20 Q52 8 56 20 T64 20 Q68 4 72 20 T80 20 Q84 10 88 20 T96 20 Q100 6 104 20 T112 20"
          fill="none"
          stroke="#0e6c80"
          strokeWidth="1.3"
        />
      </svg>
    ),
    read: (s) => s.zcr.toFixed(4),
  },
  {
    name: 'Spectral flatness',
    unit: 'ratio',
    body:
      'Whether the signal is tonal or noise-like. Phase and spectral artifacts from synthesis shift it measurably, and it is the one a listener has no chance of hearing.',
    glyph: (id) => (
      <svg viewBox="0 0 120 40" width="100%" height="40" aria-hidden="true" key={id}>
        {Array.from({ length: 15 }).map((_, i) => (
          <rect key={i} x={i * 8} y={40 - (i < 7 ? 0.9 - i * 0.1 : 0.34) * 36} width="5" height={Math.max(1, (i < 7 ? 0.9 - i * 0.1 : 0.34) * 36)} fill={i < 7 ? '#bcc0b9' : '#0e6c80'} />
        ))}
      </svg>
    ),
    read: (s) => s.flatness.toFixed(4),
  },
];

export function AcousticSignals({ stats }: { stats?: AcousticStats | null }) {
  return (
    <section className="band" id="signals">
      <div className="shell">
        <div className="grid12">
          <div className="col-lead">
            <h2 className="h2">The voice leaves fingerprints.</h2>
          </div>
          <div className="col-wide">
            <p className="prose">
              Alongside the neural verdict, every uploaded recording is measured against five
              handcrafted descriptors. They are what makes a verdict arguable: a number someone
              can check, compare against a known-clean sample, and put in a report.
            </p>
            {stats && (
              <p className="note" style={{ marginTop: '1rem' }}>
                Values shown are from the recording you analysed in this session.
              </p>
            )}
          </div>
        </div>

        <div className="rulelist" style={{ marginTop: 'clamp(2.5rem, 5vw, 4rem)' }}>
          {SIGNALS.map((sig) => (
            <div key={sig.name} className="sig">
              <div>
                <h3 className="h3">{sig.name}</h3>
                <span className="tag">{sig.unit}</span>
              </div>
              <div className="prose">{sig.body}</div>
              <div className="sig__viz">
                {sig.glyph(sig.name)}
                <div className="mono" style={{ marginTop: '0.4rem' }}>
                  {stats ? sig.read(stats) : 'no measurement yet'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
