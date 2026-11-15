# Cloudflare Worker/API front door

The website, dashboard, and mobile app must use one stable HTTPS/WSS hostname.
The current Worker URL is
`https://pandittalk-load-balancer.admininfo-6d6.workers.dev`. Do not put
`backend1` or `backend2` origins in a client bundle.

The Worker is an infrastructure component, not application state. Configure it
to route API and Socket.IO requests to the currently healthy backend origins:

- Asus origin: the HTTPS tunnel or public origin for the Asus backend.
- Kali origin: the HTTPS tunnel or public origin for the Kali backend.
- Health path: `/readiness` (it must report PostgreSQL, Redis, and MongoDB as
  healthy before an origin receives traffic).
- WebSockets: pass through the Socket.IO transport path `/socket.io/` for both
  polling and WebSocket upgrades, preserve query strings, and preserve the
  `Upgrade` and `Connection` headers. The application namespace is `/chat`, so
  clients connect to the `/chat` namespace over that `/socket.io/` transport;
  `/chat` is not the transport path itself.
- Payments: configure Razorpay webhooks to call the stable Worker URL, never an
  individual laptop origin.

Both backend instances must run the same commit and use the same Supabase,
Redis Cloud, MongoDB Atlas, Cloudinary, JWT, and provider configuration. The
Worker only chooses an origin; it does not synchronize databases, sessions, or
uploaded files.

The repository implementation is a KV-backed Worker modeled on the supplied
Touch example. Create the `PANDITTALK_BACKEND_CONFIG` KV namespace, put the
real origin list in `backends_config`, and deploy
`infra/cloudflare-worker/src/index.mjs`. The scheduled handler writes
`backends_status` after probing `/readiness`; see
`infra/cloudflare-worker/README.md` for the commands.

For simple active/passive routing, use the Worker origin list and health checks.
For Cloudflare-managed health-aware load balancing, configure the equivalent
Cloudflare Load Balancing pool/monitor and route the Worker to that pool. Keep
the backend origin URLs and any provider credentials in Cloudflare/server-side
configuration, never in `NEXT_PUBLIC_*`, `VITE_*`, or `EXPO_PUBLIC_*` values.
