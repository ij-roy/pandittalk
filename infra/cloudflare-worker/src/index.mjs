const SAFE_RETRY_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
const DEFAULT_HEALTH_PATH = '/readiness';
const DEFAULT_HEALTH_TIMEOUT_MS = 2500;
const STATUS_KEY = 'backends_status';
const CONFIG_KEY = 'backends_config';

function normalizeOrigin(value, name) {
  if (!value) {
    throw new Error(`${name} is not configured`);
  }

  const origin = new URL(value);
  if (!['http:', 'https:'].includes(origin.protocol)) {
    throw new Error(`${name} must use http or https`);
  }

  origin.hash = '';
  origin.search = '';
  origin.pathname = origin.pathname.replace(/\/+$/, '');
  return origin;
}

function normalizeBackend(raw, index) {
  const backend = typeof raw === 'string' ? { url: raw } : raw;
  const url = normalizeOrigin(backend?.url, `backend[${index}].url`).toString().replace(/\/$/, '');

  return {
    name: backend.name || `backend-${index + 1}`,
    url,
    healthy: backend.healthy === true,
    latency: Number.isFinite(Number(backend.latency)) ? Number(backend.latency) : null,
    checkedAt: backend.checkedAt || null,
  };
}

function buildOriginUrl(origin, requestUrl) {
  const target = new URL(requestUrl);
  const basePath = origin.pathname;
  target.protocol = origin.protocol;
  target.username = origin.username;
  target.password = origin.password;
  target.host = origin.host;
  target.pathname = `${basePath}${target.pathname}`.replace(/\/\/+/g, '/');
  return target;
}

function healthUrl(origin, env) {
  return new URL(env.HEALTH_PATH || DEFAULT_HEALTH_PATH, origin);
}

function readinessPayloadIsValid(payload) {
  if (!payload || typeof payload !== 'object') {
    return true;
  }

  if (payload.status && payload.status !== 'ready') {
    return false;
  }

  if (payload.checks && Object.values(payload.checks).some((value) => value !== 'ok')) {
    return false;
  }

  return true;
}

async function probeBackend(backend, env) {
  const startedAt = Date.now();
  const controller = new AbortController();
  const timeoutMs = Number(env.HEALTH_TIMEOUT_MS || DEFAULT_HEALTH_TIMEOUT_MS);
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(healthUrl(new URL(backend.url), env), {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Cache-Control': 'no-cache',
      },
      signal: controller.signal,
    });
    let payload;
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }

    return {
      ...backend,
      healthy: response.ok && readinessPayloadIsValid(payload),
      latency: Date.now() - startedAt,
      checkedAt: Date.now(),
    };
  } catch {
    return {
      ...backend,
      healthy: false,
      latency: null,
      checkedAt: Date.now(),
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function loadKvStatus(env) {
  if (!env.PANDITTALK_BACKEND_CONFIG?.get) {
    return null;
  }

  const status = await env.PANDITTALK_BACKEND_CONFIG.get(STATUS_KEY, 'json');
  if (!Array.isArray(status)) {
    return [];
  }

  return status.map(normalizeBackend);
}

async function loadLegacyStatus(env) {
  if (!env.PRIMARY_ORIGIN || !env.SECONDARY_ORIGIN) {
    return [];
  }

  const primary = await probeBackend(
    normalizeBackend({ name: 'asus', url: env.PRIMARY_ORIGIN }, 0),
    env,
  );
  if (primary.healthy) {
    return [primary];
  }

  const secondary = await probeBackend(
    normalizeBackend({ name: 'kali', url: env.SECONDARY_ORIGIN }, 1),
    env,
  );
  return [primary, secondary];
}

async function loadStatus(env) {
  const kvStatus = await loadKvStatus(env);
  return kvStatus ?? loadLegacyStatus(env);
}

function selectWeightedBackend(backends) {
  const weighted = backends.map((backend) => ({
    backend,
    weight: 1 / Math.max(backend.latency || 1, 50),
  }));
  const totalWeight = weighted.reduce((sum, entry) => sum + entry.weight, 0);
  let random = Math.random() * totalWeight;

  for (const entry of weighted) {
    random -= entry.weight;
    if (random <= 0) {
      return entry.backend;
    }
  }

  return weighted[0].backend;
}

function proxyRequest(request, backend) {
  const headers = new Headers(request.headers);
  headers.delete('host');

  const init = {
    method: request.method,
    headers,
    redirect: 'manual',
  };

  if (!['GET', 'HEAD'].includes(request.method)) {
    init.body = request.body;
  }

  return fetch(buildOriginUrl(new URL(backend.url), request.url), init);
}

function withRoutingHeader(response, backend, env) {
  if (env.DEBUG_ROUTING !== 'true') {
    return response;
  }

  const result = new Response(response.body, response);
  result.headers.set('X-PanditTalk-Backend', backend.name);
  return result;
}

export async function handleRequest(request, env) {
  let backends;
  try {
    backends = await loadStatus(env);
  } catch {
    return jsonResponse({ ok: false, error: 'No backend status available' }, 500);
  }

  if (!backends.length) {
    return jsonResponse({ ok: false, error: 'No backend status available' }, 500);
  }

  const healthy = backends.filter((backend) => backend.healthy);
  if (!healthy.length) {
    return jsonResponse({ ok: false, error: 'No healthy backends available' }, 503);
  }

  const selectedBackend = selectWeightedBackend(healthy);
  const incomingUrl = new URL(request.url);

  if (incomingUrl.pathname === '/' && env.ROUTER_STATUS_ROOT !== 'false') {
    return jsonResponse({
      ok: true,
      service: 'PanditTalk Edge Load Balancer',
      selectedBackend: selectedBackend.name,
      healthyBackends: healthy.length,
      timestamp: Date.now(),
    });
  }

  const backendPool = [
    selectedBackend,
    ...healthy.filter((backend) => backend.url !== selectedBackend.url),
  ];
  const canRetry = SAFE_RETRY_METHODS.has(request.method) && request.headers.get('Upgrade') !== 'websocket';

  for (const backend of backendPool) {
    try {
      const response = await proxyRequest(request, backend);
      if (canRetry && response.status >= 500) {
        continue;
      }
      return withRoutingHeader(response, backend, env);
    } catch {
      if (!canRetry) {
        break;
      }
    }
  }

  return jsonResponse({ ok: false, error: 'All backends failed' }, 502);
}

export async function scheduled(_event, env) {
  if (!env.PANDITTALK_BACKEND_CONFIG?.get || !env.PANDITTALK_BACKEND_CONFIG?.put) {
    return;
  }

  const config = await env.PANDITTALK_BACKEND_CONFIG.get(CONFIG_KEY, 'json');
  if (!Array.isArray(config) || config.length === 0) {
    return;
  }

  const backends = config.map(normalizeBackend);
  const results = await Promise.all(backends.map((backend) => probeBackend(backend, env)));
  await env.PANDITTALK_BACKEND_CONFIG.put(STATUS_KEY, JSON.stringify(results));
}

export default {
  fetch(request, env) {
    return handleRequest(request, env);
  },
  scheduled,
};

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });
}
