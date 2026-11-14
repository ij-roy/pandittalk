export const NO_INTERNET_MESSAGE = 'No internet. Check your connection and try again.';

const GENERIC_TOOL_ERROR = 'Something went wrong. Please try again.';

type AxiosLike = {
  isAxiosError?: boolean;
  code?: string;
  message?: string;
  response?: { data?: unknown } | null;
};

function asAxios(err: unknown): AxiosLike | null {
  if (!err || typeof err !== 'object') return null;
  const candidate = err as AxiosLike;
  if (candidate.isAxiosError !== true) return null;
  return candidate;
}

function serverMessage(data: unknown): string | null {
  if (!data || typeof data !== 'object' || !('message' in data)) return null;
  const message = (data as { message: unknown }).message;
  if (typeof message === 'string' && message.trim()) return message;
  if (Array.isArray(message)) {
    const joined = message.map(String).filter(Boolean).join(', ');
    return joined || null;
  }
  return null;
}

/** True when the request never reached the server. Canceled requests are not offline. */
export function isOfflineSubmitError(err: unknown): boolean {
  const axiosError = asAxios(err);
  if (!axiosError) return false;
  if (axiosError.code === 'ERR_CANCELED') return false;
  return axiosError.response == null;
}

export function messageFromToolError(err: unknown): string {
  if (isOfflineSubmitError(err)) return NO_INTERNET_MESSAGE;
  const axiosError = asAxios(err);
  if (axiosError) {
    return serverMessage(axiosError.response?.data) ?? GENERIC_TOOL_ERROR;
  }
  if (err instanceof Error && err.message.trim()) return err.message;
  return GENERIC_TOOL_ERROR;
}
