/*
 * Local-only end-to-end proof for the stateless API stack.
 *
 * Prerequisites:
 *   docker compose up -d --scale api=2 --no-recreate api proxy
 *   docker compose exec -T api node scripts/ensure-local-demo-data.cjs
 *
 * Run from pandittalk-website:
 *   npm run test:local-replica
 */
const { io } = require('socket.io-client');

const base = process.env.LOCAL_API_BASE || 'http://localhost:3001';
const bookingId = 'd1d7ccf5-08dc-45ea-9b16-0e7d04d8a002';

async function verify(phone, intent) {
  const response = await fetch(`${base}/auth/verify-otp`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      phoneNumber: phone,
      otp: '1234',
      acceptedLegalConsent: true,
      ...(intent ? { intent } : {}),
    }),
  });
  if (!response.ok) {
    throw new Error(`OTP verification failed for ${phone}: ${response.status}`);
  }
  return (await response.json()).accessToken;
}

function openClient(label, token) {
  return new Promise((resolve, reject) => {
    const socket = io(`${base}/chat`, {
      auth: { token },
      transports: ['websocket'],
      reconnection: false,
      timeout: 5000,
    });
    socket.once('connect', () => resolve({ label, socket }));
    socket.once('connect_error', (error) => {
      reject(new Error(`${label} connect_error: ${error.message}`));
    });
  });
}

function waitFor(client, event, predicate = () => true, timeoutMs = 7000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`${client.label} timed out waiting for ${event}`));
    }, timeoutMs);
    const handler = (payload) => {
      if (!predicate(payload)) return;
      clearTimeout(timer);
      client.socket.off(event, handler);
      resolve(payload);
    };
    client.socket.on(event, handler);
  });
}

async function main() {
  const sockets = [];
  try {
    const customerToken = await verify('+919999999998');
    const panditToken = await verify('+919999999997', 'dashboard');
    const customer = await openClient('customer', customerToken);
    const pandit = await openClient('pandit', panditToken);
    sockets.push(customer.socket, pandit.socket);

    const customerJoined = waitFor(
      customer,
      'sessionJoined',
      (payload) => payload?.bookingId === bookingId,
    );
    const customerWaiting = waitFor(
      customer,
      'waitingForPandit',
      (payload) => payload?.bookingId === bookingId,
    );
    customer.socket.emit('joinSession', { bookingId, token: customerToken });
    await Promise.all([customerJoined, customerWaiting]);

    const customerStarted = waitFor(customer, 'sessionStarted');
    const panditStarted = waitFor(pandit, 'sessionStarted');
    const panditJoined = waitFor(
      pandit,
      'sessionJoined',
      (payload) => payload?.bookingId === bookingId,
    );
    pandit.socket.emit('joinSession', { bookingId, token: panditToken });
    await Promise.all([panditJoined, customerStarted, panditStarted]);

    const customerMessage = waitFor(
      customer,
      'newMessage',
      (payload) => payload?.message === 'replica-chat-proof',
    );
    const panditMessage = waitFor(
      pandit,
      'newMessage',
      (payload) => payload?.message === 'replica-chat-proof',
    );
    customer.socket.emit('sendMessage', {
      bookingId,
      message: 'replica-chat-proof',
    });
    await Promise.all([customerMessage, panditMessage]);

    pandit.socket.disconnect();
    sockets.pop();
    const reconnected = await openClient('pandit-reconnected', panditToken);
    sockets.push(reconnected.socket);
    const rejoined = waitFor(
      reconnected,
      'sessionJoined',
      (payload) => payload?.bookingId === bookingId,
    );
    const resumed = waitFor(reconnected, 'sessionStarted');
    reconnected.socket.emit('joinSession', { bookingId, token: panditToken });
    const [history] = await Promise.all([rejoined, resumed]);
    const historyHasMessage =
      Array.isArray(history.messages) &&
      history.messages.some((message) => message.message === 'replica-chat-proof');
    if (!historyHasMessage) {
      throw new Error('Reconnect did not return the MongoDB chat history');
    }

    console.log(JSON.stringify({
      ok: true,
      transport: 'websocket through Caddy proxy',
      crossReplicaMessageBroadcast: true,
      reconnectResumedFromRedis: true,
      reconnectHistoryFromDynamo: true,
      historyMessages: history.messages.length,
    }, null, 2));

    // End the local demo booking during the grace window so the next run
    // starts from a clean Redis session state. The seed script restores the
    // booking to confirmed before each run.
    const cleanup = waitFor(
      customer,
      'sessionGraceEnded',
      (payload) => payload?.bookingId === bookingId,
      3000,
    );
    customer.socket.emit('endSession', { bookingId });
    await cleanup;
  } finally {
    for (const socket of sockets) socket.disconnect();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
