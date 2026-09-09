# Bana Ba Sawa UK website

A website for Bana Ba Sawa UK, a community association uniting people of Sawa
heritage in the UK. The public pages are built with React, TypeScript, Vite and
Tailwind CSS. Membership accounts are served by an Express API.

## Tech stack

- React 19 with TypeScript
- Vite 8
- Tailwind CSS v4 (via `@tailwindcss/vite`)
- React Router for client side routing
- Express API with httpOnly session cookies
- SQLite for local development (`node:sqlite`)
- PostgreSQL for production
- `bcryptjs` password hashing
- `lucide-react` for line icons

## Getting started

```bash
npm install
npm run dev
```

This starts the API on `http://127.0.0.1:3001` and the Vite app with `/api`
proxied to it. Open the printed local URL in your browser.

Local development uses SQLite at `data/bana-ba-sawa.db` and does not require a
`.env` file. Optional overrides are listed in `.env.example`.

## Available scripts

- `npm run dev`, start the API and Vite together
- `npm run build`, type-check and create a production build in `dist`
- `npm start`, serve the production build and API together (local SQLite unless `DATABASE_URL` is set)
- `npm run db:migrate`, apply PostgreSQL migrations (`DATABASE_URL` required)
- `npm run preview`, preview the production frontend locally (API must also be running)
- `npm run lint`, run Oxlint against the source
- `npm run test:api`, run the authentication API flow check
- `npm run test:auth`, run password-reset, security and Phase 3 API tests
- `npm run test:phase3`, run Phase 3 API tests only
- `npm run test:config`, check production URL and database config rules
- `npm run admin:create`, create a Client Admin account from the server terminal

## Project structure

```
api/            Vercel Function entry (`index.ts`) that runs the Express app
server/         Express API, database access, auth and membership routes
server/migrations/  Production PostgreSQL schema migrations
src/
  components/   Reusable UI building blocks (Header, Footer, Button, forms...)
  sections/     Page sections
  pages/        Route level pages, including login, register and the member portal
  lib/          Route constants, API client and shared helpers
  context/      Auth session state
  assets/       Community photography used across the site
data/           Local SQLite database (created on first run, not committed)
```

## Production architecture

The site is one Vercel project:

- Vite builds the React SPA into `dist`
- Express runs as a Vercel Function from `api/index.ts`
- The browser calls relative `/api/*` URLs on the same domain
- `vercel.json` rewrites `/api/*` to that function, then sends other routes to `index.html`
- Production data is stored in PostgreSQL, not SQLite

Local SQLite data is development-only and is not copied to production.

## Required production environment variables

Set these in the Vercel project settings (Production). Do not commit values.

- `DATABASE_URL` — PostgreSQL connection string (use the pooled URL, with SSL)
- `APP_URL` — public website URL, for example `https://bana-ba-sawa-uk.vercel.app`

Optional, server-side only:

- `CLIENT_ORIGIN` — only if the API is ever hosted on a different origin
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`
- `RESET_TOKEN_TTL_MINUTES`
- `VERIFY_TOKEN_TTL_HOURS`

`APP_URL` must be the live website. Production reset emails must not use
`http://localhost:5173`. The API will refuse to start when `NODE_ENV=production`
or when running on Vercel if `APP_URL` is missing or points at localhost. Hosted
deployments also require `DATABASE_URL`. Local `npm run dev` still defaults to
localhost and does not need these variables.

Password hashes, session cookies and SMTP credentials stay on the server. The
frontend only uses relative `/api` requests and has no secret environment
variables.

## Production database

1. Create a hosted PostgreSQL database (Neon is the recommended match for Vercel).
2. Copy the pooled connection string into Vercel as `DATABASE_URL`.
3. Set `APP_URL` to the production website URL.
4. Deploy. The API applies versioned migrations on startup; you can also run
   `npm run db:migrate` against the same database.

The schema includes `users`, `sessions`, `password_reset_tokens`,
`email_verification_tokens`, `events`, `news_items` and `event_notifications`,
with unique email, membership number and slug constraints and foreign keys.

Create a Client Admin from the server terminal with `npm run admin:create`.
That command is not a public HTTP endpoint. Newly registered accounts are always
ordinary members.

Future Events and News pages should use the contract in
[`docs/EVENTS_NEWS_API.md`](docs/EVENTS_NEWS_API.md). Those frontend pages are not
built yet; the APIs and database tables are ready.

## Content and factual accuracy

Copy on the public pages is grounded in the association's supplied Rules of
Procedure and website draft. Where those documents do not confirm a fact
(for example membership numbers, office holder names, or a public contact
address), the site avoids presenting an unconfirmed figure as if it were
established.
