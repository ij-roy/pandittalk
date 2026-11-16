type QueueEventPayload = Record<string, unknown>;
export type QueueExpiredReason = 'turn_timeout' | 'max_wait' | 'pandit_offline';

export type QueueEvent =
  | {
      type: 'ready';
      panditId: string;
      expiresAt: string;
      message: string;
    }
  | {
      type: 'position';
      panditId: string;
      position: number;
      queueLength: number;
    }
  | {
      type: 'expired';
      panditId: string;
      reason: QueueExpiredReason;
    };

function objectPayload(value: unknown): QueueEventPayload | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as QueueEventPayload
    : null;
}

function samePandit(payload: QueueEventPayload, panditId: string): payload is QueueEventPayload & { panditId: string } {
  return payload.panditId === panditId;
}

export function parseQueueEvent(panditId: string, event: string, value: unknown): QueueEvent | null {
  const payload = objectPayload(value);
  if (!payload || !samePandit(payload, panditId)) return null;

  if (
    event === 'queueReady' &&
    typeof payload.expiresAt === 'string' &&
    Number.isFinite(Date.parse(payload.expiresAt))
  ) {
    return {
      type: 'ready',
      panditId,
      expiresAt: payload.expiresAt,
      message: typeof payload.message === 'string' ? payload.message : 'Your Chat Now turn is ready.',
    };
  }

  if (
    event === 'queuePositionUpdated' &&
    Number.isInteger(payload.position) &&
    Number(payload.position) > 0 &&
    Number.isInteger(payload.queueLength) &&
    Number(payload.queueLength) >= Number(payload.position)
  ) {
    return {
      type: 'position',
      panditId,
      position: Number(payload.position),
      queueLength: Number(payload.queueLength),
    };
  }

  if (
    event === 'queueExpired' &&
    (payload.reason === 'turn_timeout' || payload.reason === 'max_wait' || payload.reason === 'pandit_offline')
  ) {
    return { type: 'expired', panditId, reason: payload.reason };
  }

  return null;
}

export function queueExpiredMessage(reason: QueueExpiredReason): string {
  if (reason === 'pandit_offline') return 'The Pandit went offline before your turn. Nothing was charged.';
  if (reason === 'max_wait') return 'Your Chat Now queue wait expired. Nothing was charged.';
  return 'Your Chat Now turn expired before it was started. Nothing was charged.';
}
