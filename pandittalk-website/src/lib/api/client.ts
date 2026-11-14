'use client';

import { useCallback, useEffect, useState } from 'react';

export class ApiError extends Error {
  constructor(message: string, public status: number, public code?: string) { super(message); }
}

let refreshing: Promise<boolean> | undefined;
const REQUEST_TIMEOUT_MS = 20000;

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  if (!path.startsWith('/') || path.startsWith('//')) throw new Error('Invalid service path');
  const headers = new Headers(options.headers);
  if (!(options.body instanceof FormData)) headers.set('Content-Type', 'application/json');

  const send = async () => {
    const controller = new AbortController();
    const external = options.signal;
    const onAbort = () => controller.abort();
    if (external) {
      if (external.aborted) controller.abort();
      else external.addEventListener('abort', onAbort, { once: true });
    }
    const timer = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      return await fetch(`/api/backend${path}`, { ...options, headers, cache: 'no-store', credentials: 'same-origin', signal: controller.signal });
    } finally {
      window.clearTimeout(timer);
      external?.removeEventListener('abort', onAbort);
    }
  };

  let response: Response;
  try {
    response = await send();
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      if (options.signal?.aborted) throw error;
      throw new ApiError('This is taking longer than expected. Nothing was confirmed or charged — please try again.', 408, 'TIMEOUT');
    }
    throw error;
  }

  if (response.status === 401) {
    const refresh = () => fetch('/api/auth/refresh', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' }).then(r => r.ok);
    refreshing ??= (typeof navigator !== 'undefined' && navigator.locks ? navigator.locks.request('pt-session-refresh', async () => refresh()) : refresh()).then(Boolean).finally(() => { refreshing = undefined; });
    if (await refreshing) {
      try { response = await send(); }
      catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          if (options.signal?.aborted) throw error;
          throw new ApiError('This is taking longer than expected. Nothing was confirmed or charged — please try again.', 408, 'TIMEOUT');
        }
        throw error;
      }
    } else if (typeof window !== 'undefined' && !path.startsWith('/auth')) {
      const returnTo = encodeURIComponent(`${location.pathname}${location.search}`);
      // Refresh failed — treat as an expired/ended session, not a first-time sign-in gate.
      location.assign(`/login?returnTo=${returnTo}&reason=session`);
    }
  }
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new ApiError(body?.message || 'The service could not complete this request. Nothing was confirmed or charged — please try again.', response.status, body?.code);
  return body as T;
}

export function useApi<T>(path: string | null) {
  const [data, setData] = useState<T>();
  const [error, setError] = useState<Error>();
  const [loading, setLoading] = useState(!!path);
  const [version, setVersion] = useState(0);
  const reload = useCallback(() => setVersion(v => v + 1), []);
  useEffect(() => {
    const controller = new AbortController();
    setError(undefined); setLoading(!!path);
    if (path) {
      api<T>(path, { signal: controller.signal })
        .then(value => { if (!controller.signal.aborted) setData(value); })
        .catch(reason => { if (!controller.signal.aborted) setError(reason); })
        .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    } else {
      setData(undefined); setLoading(false);
    }
    return () => controller.abort();
  }, [path, version]);
  return { data, error, loading, reload };
}
