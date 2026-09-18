/**
 * Deterministic reference signals, shared by the hero trace, the authentic-vs-synthetic
 * comparison, and the forensic demo presets. Same math in all three places so the page
 * never shows a "voice" that the analyser would disagree with.
 *
 * authentic: 145 Hz fundamental + harmonics + vibrato, smooth envelope
 * synthetic: 280 Hz square buzz + periodic phase glitch + broadband noise
 */

export function authenticSample(t: number, durationSec = 3): number {
  const f0 = 145 + 12 * Math.sin(2 * Math.PI * 4.5 * t);
  const env = Math.sin(Math.PI * ((t % durationSec) / durationSec));
  return (
    (0.35 * Math.sin(2 * Math.PI * f0 * t) +
      0.22 * Math.sin(2 * Math.PI * 2 * f0 * t) +
      0.14 * Math.sin(2 * Math.PI * 3 * f0 * t) +
      0.06 * Math.sin(2 * Math.PI * 4 * f0 * t)) *
    env
  );
}

export function syntheticSample(t: number): number {
  const buzz = (t * 280) % 1 > 0.5 ? 0.35 : -0.35;
  const glitch = Math.sin(2 * Math.PI * 880 * t) * (t % 0.25 < 0.12 ? 0.35 : 0.05);
  return buzz * 0.4 + glitch * 0.25;
}

/** Envelope of a signal, resampled to `bins` points over `span` seconds from `offset`. */
export function envelope(
  fn: (t: number) => number,
  bins: number,
  span: number,
  offset = 0,
): number[] {
  const out: number[] = [];
  const stepsPerBin = 24;
  for (let i = 0; i < bins; i++) {
    let peak = 0;
    for (let s = 0; s < stepsPerBin; s++) {
      const t = offset + ((i + s / stepsPerBin) / bins) * span;
      peak = Math.max(peak, Math.abs(fn(t)));
    }
    out.push(Math.min(1, peak));
  }
  return out;
}

/** Crude magnitude spectrum by direct evaluation — for illustration panels only. */
export function spectrum(fn: (t: number) => number, bands: number, maxHz = 4000): number[] {
  const sr = 16000;
  const n = 2048;
  const buf = new Float32Array(n);
  for (let i = 0; i < n; i++) buf[i] = fn(i / sr);

  const out: number[] = [];
  for (let b = 0; b < bands; b++) {
    const hz = ((b + 0.7) / bands) * maxHz;
    let re = 0;
    let im = 0;
    for (let i = 0; i < n; i++) {
      const ang = (2 * Math.PI * hz * i) / sr;
      re += buf[i] * Math.cos(ang);
      im -= buf[i] * Math.sin(ang);
    }
    const mag = Math.sqrt(re * re + im * im) / n;
    out.push(Math.min(1, Math.sqrt(mag) * 3.2));
  }
  return out;
}

/** Fit a canvas to its CSS box at device pixel ratio. Returns the CSS-pixel size. */
export function fitCanvas(canvas: HTMLCanvasElement): { w: number; h: number; dpr: number } {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const rect = canvas.getBoundingClientRect();
  const w = Math.max(1, Math.floor(rect.width));
  const h = Math.max(1, Math.floor(rect.height));
  canvas.width = Math.floor(w * dpr);
  canvas.height = Math.floor(h * dpr);
  const ctx = canvas.getContext('2d');
  if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { w, h, dpr };
}

/** Mirrored bar trace, centre-aligned — the page's house style for a waveform. */
export function drawTrace(
  ctx: CanvasRenderingContext2D,
  values: number[],
  w: number,
  h: number,
  color: string,
  barW = 2,
  gap = 2,
) {
  ctx.clearRect(0, 0, w, h);
  const mid = h / 2;
  const total = barW + gap;
  const count = Math.min(values.length, Math.floor(w / total));
  ctx.fillStyle = color;
  for (let i = 0; i < count; i++) {
    const v = values[Math.floor((i / count) * values.length)] ?? 0;
    const bar = Math.max(1, v * (h / 2 - 2));
    ctx.fillRect(i * total, mid - bar, barW, bar * 2);
  }
}

export const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
