import type { MetricsData, PredictionResponse, SystemHealth } from '../types';

/**
 * Single source of truth for the backend location.
 * Override at build time with VITE_API_BASE (e.g. https://api.example.com).
 * Falls back to the audited default: same host, port 8000.
 */
const envBase = (import.meta.env?.VITE_API_BASE as string | undefined)?.replace(/\/$/, '');

export const apiBase = (): string =>
  envBase || `${window.location.protocol}//${window.location.hostname}:8000`;

export const wsBase = (): string => {
  const base = apiBase();
  return base.replace(/^http/, 'ws');
};

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
