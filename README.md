# Bana Ba Sawa UK, website

A frontend only website for Bana Ba Sawa UK, a community association uniting people of Sawa
heritage in the UK. Built with React, TypeScript, Vite and Tailwind CSS.

Only the Home page has been built so far. Other navigation items (About Us, Community,
Membership, Support, Events, Gallery, Contact, Privacy Policy, Documents) currently render a
lightweight "coming soon" placeholder so navigation stays functional while those pages are built
in later stages.

## Tech stack

- React 19 with TypeScript
- Vite 8
- Tailwind CSS v4 (via `@tailwindcss/vite`)
- React Router for client side routing
- `lucide-react` for line icons

There is no backend, database, API or authentication. All forms, when added on later pages, are
frontend only with client side validation.

## Getting started

```bash
npm install
npm run dev
```

Then open the printed local URL in your browser.

## Available scripts

- `npm run dev`, start the local development server
- `npm run build`, type-check and create a production build in `dist`
- `npm run preview`, preview the production build locally
- `npm run lint`, run Oxlint against the source

## Project structure

```
src/
  components/   Reusable UI building blocks (Header, Footer, Button, Card, SectionHeading, Logo...)
  sections/     Home page sections (Hero, ValuesStrip, AboutIntro, ImpactSection, WhatWeDo, CommunityCta)
  pages/        Route level pages (Home, ComingSoon placeholder)
  lib/          Route constants and small shared hooks
  assets/       Optimised community photography used on the Home page
```

## Content and factual accuracy

Copy on the Home page is grounded in the association's supplied Rules of Procedure and website
draft. Where those documents do not confirm a fact (for example membership numbers, office holder
names, or a public contact address), the site avoids presenting an unconfirmed figure as if it
were established. See the summary provided with each change for a list of items that still need
confirmation from the association before publication.
