import { useEffect, useState } from 'react';
import { getHealth } from '../lib/api';
import type { SystemHealth } from '../types';

/**
 * Polls GET /health. Server-side this also triggers the model hot-swap rescan,
 * so the interval is load-bearing — do not remove it.
 */
export function useHealth(intervalMs = 6000) {
  const [health, setHealth] = useState<SystemHealth | null>(null);

  useEffect(() => {
    let alive = true;
    const check = async () => {
      try {
        const data = await getHealth();
        if (alive) setHealth(data);
      } catch {
        if (alive) setHealth(null);
      }
    };
    check();
    const id = setInterval(check, intervalMs);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [intervalMs]);

  return {
    health,
    online: health?.status === 'healthy',
    /** true when weights are absent and the backend is running its fallback engine */
    isMock: health?.is_mock ?? true,
  };
}
