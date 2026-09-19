import { useEffect, useRef } from 'react';
import { authenticSample, drawTrace, envelope, fitCanvas, prefersReducedMotion } from '../../lib/signal';
import './hero-video.css';

/**
 * The hero scope draws the shared reference signal (see lib/signal.ts).
 * It is explicitly labelled as a reference trace: no verdict shown here comes from
 * the model. Live verdicts only ever come from the detector section.
 */
function ReferenceTrace() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let raf = 0;
    let offset = 0;
    let { w, h } = fitCanvas(canvas);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bins = 320;
    const render = () => {
      const values = envelope(authenticSample, bins, 2.4, offset);
      drawTrace(ctx, values, w, h, '#2fb6c9', 2, 3);
    };

    const still = prefersReducedMotion();
    if (still) {
      render();
    } else {
      const loop = () => {
        offset += 0.012;
        render();
        raf = requestAnimationFrame(loop);
      };
      loop();
    }

    const onResize = () => {
      const size = fitCanvas(canvas);
      w = size.w;
      h = size.h;
      render();
    };
    window.addEventListener('resize', onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <div className="scope reveal reveal--4">
      <div className="scope__bar">
        <div style={{ display: 'flex', gap: '1.75rem', flexWrap: 'wrap' }}>
          <span className="tag">16 kHz mono</span>
          <span className="tag">1.5 s window · 1.0 s stride</span>
          <span className="tag">64 log-mel bands</span>
        </div>
        <span className="tag">Reference trace</span>
      </div>

      <div className="scope__body" style={{ paddingBlock: 0 }}>
        <div className="scope__grid" />
        <canvas
          ref={canvasRef}
          style={{ width: '100%', height: 'clamp(150px, 26vh, 260px)' }}
          role="img"
          aria-label="Animated waveform of a reference speech signal"
        />
      </div>

      <div className="scope__foot">
        <span className="note" style={{ maxWidth: '46ch' }}>
          A synthesised reference signal, not a recording and not a verdict. Verdicts come from
          the detector below, and only from the model.
        </span>
        <a className="btn btn--onscope" href="#detector">
          Use my microphone <span className="arw">→</span>
        </a>
      </div>
    </div>
  );
}

export function Hero() {
  return (
    <section
      className="band band--flush hero"
      id="top"
      style={{
        paddingTop: 'clamp(3rem, 8vh, 6rem)',
        position: 'relative',
        isolation: 'isolate',
        overflow: 'hidden',
      }}
    >
      <video
        className="hero-video"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        aria-hidden="true"
      >
        <source src="/voiceguard-wave-bg.mp4" type="video/mp4" />
      </video>
      <div className="hero-video__veil" aria-hidden="true" />

      <div className="shell hero-video__content">
        <div className="grid12" style={{ rowGap: 'clamp(2rem, 4vw, 3rem)' }}>
          <div className="col-lead reveal" style={{ gridColumn: 'span 12' }}>
            <span className="tag">Real-time voice security</span>
          </div>

          <div className="reveal reveal--2" style={{ gridColumn: '1 / -1' }}>
            <h1 className="display" style={{ maxWidth: '22ch' }}>
              Know when a voice isn&rsquo;t real.
            </h1>
          </div>

          <div className="reveal reveal--3 col-offset">
            <p className="lede" style={{ maxWidth: '48ch' }}>
              VoiceGuard detects synthetic and manipulated speech in real time — before a
              convincing voice becomes a security breach.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '1.75rem' }}>
              <a className="btn" href="#detector">
                Open detector <span className="arw">→</span>
              </a>
              <a className="btn btn--ghost" href="#method">
                Read the method
              </a>
            </div>
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <ReferenceTrace />
          </div>
        </div>
      </div>
    </section>
  );
}
