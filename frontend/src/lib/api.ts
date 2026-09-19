import type { MetricsData, PredictionResponse, SystemHealth } from '../types';

/**
 * Single source of truth for the backend location.
 *
 * Vercel can override this with VITE_API_BASE. The production fallback points
 * to the deployed Render backend so the detector works even if the variable
 * was omitted from the initial Vercel deployment.
 */
const configuredBase = (import.meta.env?.VITE_API_BASE as string | undefined)?.trim();
const DEFAULT_PRODUCTION_BASE = 'https://voiceguard-api-fhri.onrender.com';

export const apiBase = (): string => {
  const base = configuredBase ||
    (import.meta.env?.DEV
      ? `${window.location.protocol}//${window.location.hostname}:8000`
      : DEFAULT_PRODUCTION_BASE);
  return base.replace(/\/$/, '');
};

export const wsBase = (): string =>
  apiBase().replace(/^https:/, 'wss:').replace(/^http:/, 'ws:');

export async function getHealth(): Promise<SystemHealth> {
  const res = await fetch(`${apiBase()}/health`);
  if (!res.ok) throw new Error(`health ${res.status}`);
  return res.json();
}

export async function getMetrics(): Promise<MetricsData> {
  const res = await fetch(`${apiBase()}/metrics`);
  if (!res.ok) throw new Error(`metrics ${res.status}`);
  return res.json();
}

/** POST /predict — multipart, field name must stay `file` (backend contract). */
export async function postPredict(file: File): Promise<PredictionResponse> {
  const body = new FormData();
  body.append('file', file);
  const res = await fetch(`${apiBase()}/predict`, { method: 'POST', body });
  if (!res.ok) throw new Error(`Analysis failed — server returned ${res.status}.`);
  return res.json();
}

export const streamUrl = (): string => `${wsBase()}/predict-stream`;
