# PanditTalk Development Access

This file records how the local development services are reached remotely.
Add new mappings at the end when a tunnel or deployment URL changes.

| Service | Local address | Remote access | Status |
| --- | --- | --- | --- |
| Website development server | `http://localhost:3000` | `https://ij.dophera.tech/` | Confirmed by user |
| Dashboard development server | `http://localhost:5173` | `https://dashboard.dophera.tech/` | Confirmed by user |
| Backend API through Caddy | `http://localhost:3001` | `https://api-pandittalk.dophera.tech/` | Project-configured public API |
| Socket.IO chat | `http://localhost:3001/chat` | `https://pandittalk-load-balancer.admininfo-6d6.workers.dev/chat` | Uses backend public API |
| Expo Metro/dev client | `http://localhost:8081` | Ephemeral Expo tunnel generated when Metro starts with `--tunnel` | URL changes per session |
| TURN/WebRTC | `localhost:3478` | Public UDP/TCP 3478 endpoint required for external media | Mapping not supplied |

## Development ports

- Website: `3000`
- Dashboard: `5173`
- Backend API: `3001`
- Pandit service: `3002`
- Expo Metro/dev client: `8081`
- Optional Cloudflare Worker local runtime: `8787`
- TURN/WebRTC: `3478`

For physical devices, `localhost` refers to the device itself. Use the public
HTTPS/API URL or the active Expo tunnel instead.

## 2026-11-18 — Backend public tunnel mapping

- Backend API: `http://localhost:3001` → `https://api-pandittalk.dophera.tech/`
- Socket.IO chat endpoint: `https://api-pandittalk.dophera.tech/chat`
