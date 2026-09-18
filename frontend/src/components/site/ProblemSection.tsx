import { useEffect, useMemo, useRef } from 'react';
import { authenticSample, fitCanvas, spectrum, syntheticSample } from '../../lib/signal';

function SpectrumPlot({ bands, tone, label }: { bands: number[]; tone: string; label: string }) {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const draw = () => {
      const { w, h } = fitCanvas(canvas);
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, w, h);
      const step = w / bands.length;
      ctx.fillStyle = tone;
      bands.forEach((v, i) => {
        const bh = Math.max(1, v * (h - 6));
        ctx.fillRect(i * step, h - bh, Math.max(1, step - 2), bh);
      });
    };
    draw();
    window.addEventListener('resize', draw);
    return () => window.removeEventListener('resize', draw);
  }, [bands, tone]);

  return (
    <canvas
      ref={ref}
      style={{ width: '100%', height: '148px' }}
      role="img"
      aria-label={label}
    />
  );
}

export function ProblemSection() {
  const authentic = useMemo(() => spectrum(authenticSample, 56), []);
  const synthetic = useMemo(() => spectrum(syntheticSample, 56), []);

  return (
    <section className="band" id="product">
      <div className="shell">
        <div className="grid12">
          <div className="col-lead">
            <h2 className="h2">A convincing voice is no longer proof of identity.</h2>
          </div>
          <div className="col-wide stack-m">
            <p className="prose">
              Speech synthesis now reproduces identity, tone, cadence and pronunciation closely
              enough to pass a phone call, a helpdesk check, or a voice biometric prompt. The
              things a listener uses to judge authenticity are exactly the things a model can
              copy.
            </p>
            <p className="prose">
              What synthesis does not copy cleanly is the physics underneath. Vocoders leave
              artifacts in the spectrum and in phase continuity — energy where a human vocal
              tract would not put it, and a tonality that is too regular to be a body.
              VoiceGuard looks there.
            </p>
          </div>
        </div>

        <div className="split split--rule" style={{ marginTop: 'clamp(3rem, 6vw, 5rem)' }}>
          <div className="stack-s">
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
              <h3 className="h3">Authentic speech</h3>
              <span className="tag">145 Hz f₀</span>
            </div>
            <SpectrumPlot
              bands={authentic}
              tone="#15181a"
              label="Spectrum of authentic speech: strong low harmonics decaying with frequency"
            />
            <p className="note">
              Energy concentrates in a few low harmonics and decays. Vibrato moves the
              fundamental continuously, and the envelope rises and falls with breath.
            </p>
          </div>

          <div className="stack-s">
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
              <h3 className="h3">Synthetic speech</h3>
              <span className="tag">vocoder artifacts</span>
            </div>
            <SpectrumPlot
              bands={synthetic}
              tone="#a33a2b"
              label="Spectrum of synthetic speech: broadband energy extending into high bands"
            />
            <p className="note">
              Energy spreads into bands a voice should not reach, high-frequency content stays
              flat rather than decaying, and phase discontinuities repeat on the frame boundary.
            </p>
          </div>
        </div>

        <p className="note" style={{ marginTop: '1.5rem' }}>
          Both plots are computed in the browser from the same synthesised reference signals the
          detector accepts as demo input — not from a customer recording.
        </p>
      </div>
    </section>
  );
}
