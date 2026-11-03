# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Voting demo app (rooms joined by 5-digit code, topics with options, one vote per user per topic) meant for near-zero-cost AWS deployment; no infra code yet. Two independent npm packages — run commands inside each:

- `src/backend` — Express 5 + TypeScript (ESM, `NodeNext`), Prisma 7 on Supabase Postgres, runs as a Lambda. Node >= 24.
- `src/frontend` — Next.js 16 (App Router, `standalone` output), React 19, Tailwind v4.

## Commands

```bash
# src/backend
npm run dev | build | typecheck
npm test                                                        # node:test, in-memory Postgres (PGlite)
node --import tsx --test --test-name-pattern="403" test/rooms.test.ts   # single test
npm run db:migrate | db:deploy | db:generate

# src/frontend
npm run dev | build | lint
```

Env: copy `.env.example` in each package.

## Backend

- `src/app.ts` exports the stateless Express `app` (routers under `/api/*`); `server.ts` (dotenv + listen) and `lambda.ts` (`handler`) both wrap it. No in-memory state.
- Errors are always `{ error: string }`: throw `HttpError` (`src/lib/http-error.ts`); anything else becomes a 500.
- Relative imports need the `.js` extension.
- Prisma 7: import from `src/generated/prisma/client.js` (not `@prisma/client`) and use the `prisma` singleton in `src/lib/prisma.ts`. The CLI uses `DIRECT_URL` (`prisma.config.ts`); runtime uses `DATABASE_URL` via `@prisma/adapter-pg`.
- Sessions (no auth): create/join return a `token`, sent back as `X-User-Token`. `requireRoomUser` guards `/api/rooms/:code/*` (401/404/403) and sets `res.locals.user`, `.room`, `.isOwner`.
- Tests: `test/helpers.ts` boots PGlite, applies `prisma/migrations/*`, then imports the app.

## Frontend

Read `src/frontend/AGENTS.md`: this Next.js version differs from training data, so check `node_modules/next/dist/docs/` first. Tailwind tokens live in `app/globals.css` (no config file). The UI fetches from the backend (`NEXT_PUBLIC_API_URL`); see the `build-ui` skill.

## Rules

Never update CLAUDE.md if I don't specify.
