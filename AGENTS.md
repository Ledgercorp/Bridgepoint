# Base44 Dev Environment

## What this is

BridgePoint is a Vite + React 18 + TypeScript frontend (shadcn/ui, TanStack Query, React Router, Tailwind). It has no local backend — all data/auth runs against an external Supabase project, and AI features call Supabase Edge Functions (the OpenAI key lives in Supabase project secrets, never in the client).

## Running it

```bash
docker compose -f docker-compose.base44.yml up -d
```

- Single `web` service on `node:22`, source bind-mounted at `/app`, `node_modules` in a named volume.
- Runs `npm install && npm run dev` (Vite dev server with HMR on container port 8080, mapped to host port 3000).
- `vite.config.ts` sets `server.host: true` and `allowedHosts: true` so the preview's external hostname is accepted.
- File-watch polling is enabled (`CHOKIDAR_USEPOLLING=true`) for bind-mount reliability.

## Credentials

The app boots with placeholder Supabase values from `.env.base44-defaults`. To use real data/auth, provide via the platform secrets (delivered to `/run/base44/app.env`, listed as the last `env_file:` entry so it wins):

- `VITE_SUPABASE_URL` — Supabase project URL
- `VITE_SUPABASE_PUBLISHABLE_KEY` — Supabase anon/publishable key (browser-safe)

Both are optional for boot — the UI shell renders without them; only Supabase data/auth/edge-function calls fail until they are set.

## Verification

- `curl -sf -H "Host: external-preview.example.com" http://localhost:3000/` returns the app HTML.
- `/src/main.tsx` returns 200 (confirms live source, not a prebuilt bundle).
- Tests: `npx vitest run` (run inside the container: `docker compose -f docker-compose.base44.yml exec web npx vitest run`).
