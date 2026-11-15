import test from 'node:test';
import assert from 'node:assert/strict';
import worker, { handleRequest } from '../src/index.mjs';

const originalFetch = globalThis.fetch;

test.afterEach(() => {
  globalThis.fetch = originalFetch;
});

test('forwards requests to the primary origin when it is healthy', async () => {
  const requests = [];
  globalThis.fetch = async (input, init) => {
    const request = input instanceof Request ? input : new Request(input, init);
    requests.push(request);

    if (request.url === 'https://asus.example/readiness') {
      return new Response('ready', { status: 200 });
    }

    return new Response('from-asus', { status: 200 });
  };

  const response = await handleRequest(
    new Request('https://api.example.com/socket.io/?EIO=4&transport=polling'),
    {
      PRIMARY_ORIGIN: 'https://asus.example',
      SECONDARY_ORIGIN: 'https://kali.example',
      HEALTH_PATH: '/readiness',
    },
  );

  assert.equal(response.status, 200);
  assert.equal(await response.text(), 'from-asus');
  assert.equal(requests[1].url, 'https://asus.example/socket.io/?EIO=4&transport=polling');
});

test('fails over to the secondary origin when the primary is unhealthy', async () => {
  const requests = [];
  globalThis.fetch = async (input, init) => {
    const request = input instanceof Request ? input : new Request(input, init);
    requests.push(request);

    if (request.url === 'https://asus.example/readiness') {
      return new Response('not ready', { status: 503 });
    }

    if (request.url === 'https://kali.example/readiness') {
      return new Response('ready', { status: 200 });
    }

    return new Response('from-kali', { status: 200 });
  };

  const response = await handleRequest(
    new Request('https://api.example.com/v1/profile?source=mobile'),
    {
      PRIMARY_ORIGIN: 'https://asus.example',
      SECONDARY_ORIGIN: 'https://kali.example',
      HEALTH_PATH: '/readiness',
    },
  );

  assert.equal(response.status, 200);
  assert.equal(await response.text(), 'from-kali');
  assert.equal(requests[2].url, 'https://kali.example/v1/profile?source=mobile');
});

test('returns 503 without forwarding when both origins are unhealthy', async () => {
  const requests = [];
  globalThis.fetch = async (input, init) => {
    const request = input instanceof Request ? input : new Request(input, init);
    requests.push(request);
    return new Response('not ready', { status: 503 });
  };

  const response = await handleRequest(
    new Request('https://api.example.com/health'),
    {
      PRIMARY_ORIGIN: 'https://asus.example',
      SECONDARY_ORIGIN: 'https://kali.example',
      HEALTH_PATH: '/readiness',
    },
  );

  assert.equal(response.status, 503);
  assert.match(await response.text(), /No healthy backends available/);
  assert.equal(requests.length, 2);
});

test('routes using the KV health snapshot and hides backend URLs from clients', async () => {
  const requests = [];
  const originalRandom = Math.random;
  Math.random = () => 0.99;
  globalThis.fetch = async (input, init) => {
    const request = input instanceof Request ? input : new Request(input, init);
    requests.push(request);
    return new Response('from-kali', { status: 200 });
  };

  try {
    const response = await handleRequest(
      new Request('https://api.example.com/v1/profile'),
      {
        PANDITTALK_BACKEND_CONFIG: {
          async get(key) {
            assert.equal(key, 'backends_status');
            return [
              { name: 'asus', url: 'https://asus.example', healthy: true, latency: 300 },
              { name: 'kali', url: 'https://kali.example', healthy: true, latency: 50 },
            ];
          },
        },
        DEBUG_ROUTING: 'true',
      },
    );

    assert.equal(response.status, 200);
    assert.equal(await response.text(), 'from-kali');
    assert.equal(response.headers.get('x-pandittalk-backend'), 'kali');
    assert.equal(response.headers.get('x-pandittalk-origin'), null);
    assert.equal(requests[0].url, 'https://kali.example/v1/profile');
  } finally {
    Math.random = originalRandom;
  }
});

test('preserves the Socket.IO upgrade headers without exposing the origin', async () => {
  const requests = [];
  globalThis.fetch = async (input, init) => {
    const request = input instanceof Request ? input : new Request(input, init);
    requests.push(request);
    return new Response('socket-forwarded', { status: 200 });
  };

  const response = await handleRequest(
    new Request('https://api.example.com/socket.io/?EIO=4&transport=websocket', {
      headers: {
        Connection: 'Upgrade',
        Upgrade: 'websocket',
      },
    }),
    {
      PANDITTALK_BACKEND_CONFIG: {
        async get(key) {
          assert.equal(key, 'backends_status');
          return [{ name: 'kali', url: 'https://kali.example', healthy: true, latency: 50 }];
        },
      },
    },
  );

  assert.equal(response.status, 200);
  assert.equal(await response.text(), 'socket-forwarded');
  assert.equal(requests[0].url, 'https://kali.example/socket.io/?EIO=4&transport=websocket');
  assert.equal(requests[0].headers.get('upgrade'), 'websocket');
  assert.equal(requests[0].headers.get('connection'), 'Upgrade');
  assert.equal(response.headers.get('x-pandittalk-origin'), null);
});

test('scheduled health checks persist a KV snapshot for configured backends', async () => {
  const calls = [];
  globalThis.fetch = async (input) => {
    calls.push(String(input));
    return new Response(JSON.stringify({
      status: 'ready',
      checks: { postgres: 'ok', redis: 'ok', mongodb: 'ok' },
    }), { status: 200 });
  };

  let saved;
  const kv = {
    async get(key, type) {
      assert.equal(key, 'backends_config');
      assert.equal(type, 'json');
      return [
        { name: 'asus', url: 'https://asus.example' },
        { name: 'kali', url: 'https://kali.example/' },
      ];
    },
    async put(key, value) {
      saved = { key, value: JSON.parse(value) };
    },
  };

  await worker.scheduled({}, {
    PANDITTALK_BACKEND_CONFIG: kv,
    HEALTH_PATH: '/readiness',
  });

  assert.deepEqual(calls.sort(), [
    'https://asus.example/readiness',
    'https://kali.example/readiness',
  ]);
  assert.equal(saved.key, 'backends_status');
  assert.deepEqual(saved.value.map((entry) => [entry.name, entry.healthy]), [
    ['asus', true],
    ['kali', true],
  ]);
});
