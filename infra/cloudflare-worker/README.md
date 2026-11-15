# PanditTalk Cloudflare Worker

This Worker is the single public API/WSS front door for the website, dashboard,
mobile app, and provider callbacks. It follows the same pattern as the supplied
Touch Worker example, with PanditTalk-specific readiness checks and Socket.IO
forwarding.

The Worker reads a backend list from the `PANDITTALK_BACKEND_CONFIG` KV
namespace:

- `backends_config`: the source list of Asus/Kali origins.
- `backends_status`: the scheduled health-check snapshot used for routing.

Only healthy origins receive traffic. Read-only requests may retry another
healthy origin after a network/5xx failure; POST, payment, authentication, and
WebSocket requests are never replayed. Origin URLs are never returned to
clients. The backend readiness endpoint is `/readiness`, and Socket.IO keeps
its `/socket.io/` transport path and query string.

## Configure and deploy

From this directory:

```powershell
npx wrangler login
npx wrangler deploy
npx wrangler kv key put --binding=PANDITTALK_BACKEND_CONFIG backends_config --path=backends-config.json --remote
npx wrangler deploy
```

The checked-in `wrangler.toml` declares the production KV binding. Before the
`kv key put` command, copy `backends-config.example.json` to
`backends-config.json` and replace both URLs with the real HTTPS tunnel/public
origins. Do not use localhost in KV: Cloudflare cannot reach a laptop's
localhost. Do not commit `backends-config.json` if it contains private
deployment details. The checked-in `wrangler.toml` contains no account ID or
origin URL.

The scheduled trigger refreshes `backends_status` every minute. Until the first
successful scheduled run, the Worker may return `No backend status available`;
that is safer than sending traffic to an unchecked origin.

## Local tests

```powershell
npm test
```

The stable client URL is:

`https://pandittalk-load-balancer.admininfo-6d6.workers.dev`
