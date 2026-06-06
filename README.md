# VSBattle AI

MVP implementation of a VS Battles Wiki-grounded Death Battle judge.

## What is implemented

- Next.js 14 App Router + Tailwind shell.
- Landing page with demo Goku vs Saitama verdict.
- Character search through the Fandom MediaWiki API with seeded fallback profiles.
- Profile viewer with parsed tier, AP, speed, durability, abilities, and starter feats.
- Matchup creation, argument submission, deterministic AI judge, and verdict display.
- Respect Thread generator, OC Character Builder, Tier Explorer, dashboard, login placeholder, and public arena.
- API routes matching the project plan.
- Knowledge prompt files and Supabase migration for the production data model.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Environment

Copy `.env.example` to `.env.local` and fill only what you need.

The app can run without LLM or Supabase keys. In that mode it uses live VS Wiki API calls where possible and a deterministic fallback judge.

## Current MVP limitations

- Debate rooms use in-memory storage. This works for local testing but must be replaced by Supabase before production traffic.
- Auth buttons are placeholders for Phase 2.
- Profile parsing is conservative because VS Wiki pages are not fully uniform.
- Generated respect threads are starter drafts; scans and calc links must be verified before posting.

## Key routes

- `/search`
- `/profile/[name]`
- `/matchup`
- `/matchup/[id]`
- `/tools/respect-rt`
- `/tools/builder`
- `/tools/tier-explorer`

## API examples

```bash
curl "http://localhost:3000/api/characters/search?q=Saitama"
curl "http://localhost:3000/api/characters/Saitama"
```
