# Pandit Talk website

Next.js marketing and customer site for [Pandit Talk](https://www.pandittalk.com).

## Develop

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Scripts

- `npm run dev` — local development
- `npm run build` — production build
- `npm test` — contract tests
- `npx playwright test` — UI journeys (start the app first, or set `UI_BASE_URL`)

## Environment

Copy `.env.example` to `.env.local`. Keep both `pandittalk.com` and `www.pandittalk.com` on the same Vercel project.

## Content

- Pandits publish journal articles from `dashboard.pandittalk.com`
- Live pages: `/articles`, `/articles/[slug]`, `/pandits`, `/tools`, `/guidance`
- Availability notify forms post to a Google Apps Script endpoint (hardcoded in `NotifyOpenForm`; treat as a temporary intake channel)

## Deploy (Vercel)

1. Import this GitHub repo
2. Root directory: project root
3. Framework: Next.js
4. Set env from `.env.example`, then deploy
