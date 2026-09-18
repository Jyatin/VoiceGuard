import type { SystemHealth } from '../../types';

/**
 * Honest system state, always visible. Three cases:
 *  - service unreachable
 *  - service up, no weights → fallback engine (never presented as neural inference)
 *  - service up with weights
 */
export function SystemStatus({
  health,
  online,
  isMock,
}: {
  health: SystemHealth | null;
  online: boolean;
  isMock: boolean;
}) {
  let led = 'led--paper';
  let title = 'Detection service unreachable';
  let detail =
    'Start the backend on port 8000 to run detection. Until then the page is read-only.';

  if (online && isMock) {
    led = 'led--paper-on';
    title = 'Demo mode';
    detail =
      'Neural model weights are not loaded. Predictions come from the signal-informed fallback engine, not from the trained model.';
  } else if (online) {
    led = 'led--paper-on';
    title = 'Neural weights loaded';
    detail = health?.engine
      ? `Live model active — ${health.engine}, powering both engines.`
      : health?.ensemble_folds
        ? `Live model active; ensemble running ${health.ensemble_folds} folds.`
        : 'Live model active.';
  }

  return (
    <div className="status" role="status">
      <div className="shell status__inner">
        <span className={`led ${led}`} />
        <span className="tag" style={{ color: 'var(--ink)' }}>
          {title}
        </span>
        <span className="note" style={{ maxWidth: '68ch' }}>
          {detail}
        </span>
      </div>
    </div>
  );
}
