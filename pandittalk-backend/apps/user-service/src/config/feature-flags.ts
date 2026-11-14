export type FeatureFlags = {
  payments: boolean;
  digitalTools: boolean;
};

const OFF = new Set(['0', 'false', 'off', 'no']);
const ON = new Set(['1', 'true', 'on', 'yes']);

export function envFlag(value: string | undefined, fallback: boolean): boolean {
  if (value == null || value.trim() === '') return fallback;
  const normalized = value.trim().toLowerCase();
  if (OFF.has(normalized)) return false;
  if (ON.has(normalized)) return true;
  return fallback;
}

/**
 * Kill switches read on each request. Defaults match the current safe behavior:
 * coin recharge stays on, paid digital-tool unlock stays off until ops turns it on.
 */
export function readFeatureFlags(
  env: NodeJS.ProcessEnv = process.env,
): FeatureFlags {
  return {
    payments: envFlag(env.FEATURE_PAYMENTS, true),
    digitalTools: envFlag(env.FEATURE_DIGITAL_TOOLS, false),
  };
}
