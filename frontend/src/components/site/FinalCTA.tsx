import { Mark } from './Mark';

export function FinalCTA() {
  return (
    <section className="band">
      <div className="shell">
        <div className="grid12">
          <div style={{ gridColumn: '1 / -1' }}>
            <h2 className="display" style={{ maxWidth: '20ch' }}>
              Hear what the human ear misses.
            </h2>
          </div>
          <div className="col-offset" style={{ marginTop: '0.5rem' }}>
            <p className="lede">
              Run a live detection, or analyse a recording you already have.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '1.75rem' }}>
              <a className="btn" href="#detector">
                Open VoiceGuard <span className="arw">→</span>
              </a>
              <a className="btn btn--ghost" href="#architecture">
                Explore the architecture
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="band" style={{ paddingBlock: '2.5rem' }}>
      <div
        className="shell"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1rem',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span className="nav__mark">
          <Mark />
          VOICEGUARD
        </span>
        <span className="tag">Anti-spoofing research build · Smart India Hackathon 2026</span>
      </div>
    </footer>
  );
}
