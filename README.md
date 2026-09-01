# Bana Ba Sawa UK website

A website for Bana Ba Sawa UK, a community association uniting people of Sawa
heritage in the UK. The public pages are built with React, TypeScript, Vite and
Tailwind CSS. Membership accounts are stored in a local SQLite database and
served by a small Express API.

## Tech stack

- React 19 with TypeScript
- Vite 8
- Tailwind CSS v4 (via `@tailwindcss/vite`)
- React Router for client side routing
- Express API with httpOnly session cookies
- SQLite via Node's built-in `node:sqlite`
- `bcryptjs` password hashing
- `lucide-react` for line icons

## Getting started

```bash
npm install
npm run dev
```

This starts the API on `http://127.0.0.1:3001` and the Vite app with `/api`
proxied to it. Open the printed local URL in your browser.

Local development does not require a `.env` file. Optional overrides are listed
in `.env.example`.

## Available scripts

- `npm run dev`, start the API and Vite together
- `npm run build`, type-check and create a production build in `dist`
- `npm start`, serve the production build and API together
- `npm run preview`, preview the production frontend locally (API must also be running)
- `npm run lint`, run Oxlint against the source

## Project structure

```
server/         Express API, SQLite access, auth and membership routes
src/
  components/   Reusable UI building blocks (Header, Footer, Button, forms...)
  sections/     Page sections
  pages/        Route level pages, including login, register and the member portal
  lib/          Route constants, API client and shared helpers
  context/      Auth session state
  assets/       Community photography used across the site
data/           Local SQLite database (created on first run, not committed)
```

## Production notes

SQLite is a file on disk, so the API needs a long-running Node process
(`npm run build` then `npm start`). Vercel serverless hosting will not persist
the database. For production email (password reset), set the SMTP variables in
`.env`. Without SMTP, reset links are printed in the API console during
development.

## Content and factual accuracy

Copy on the public pages is grounded in the association's supplied Rules of
Procedure and website draft. Where those documents do not confirm a fact
(for example membership numbers, office holder names, or a public contact
address), the site avoids presenting an unconfirmed figure as if it were
established.
