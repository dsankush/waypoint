# Waypoint

*Your career, mapped.* A private portal where each person fills in everything needed for a job application,
talks to a Career Advisor, and meets a personal guide character. An admin account can see and manage everyone.

Built with Next.js (App Router), TypeScript, Tailwind, shadcn/ui and Supabase (Postgres + private Storage).
All database access happens on the server only.

## Features
- Three candidate accounts and one admin account, each with its own password
- 8-step profile with autosave, repeatable education and experience entries, resume upload
- **Quick fill** on every step: write or paste, preview, then apply
- Career Advisor chat that fills the form live and remembers the conversation
- A guide character and note chosen from the person's context, refreshed only when something meaningful changes
- Gamified welcome pop-up on every sign-in
- Admin dashboard: totals, sign-ins, per-candidate detail, reopen / reset / export
- Mobile-app layout on phones, a full web layout (collapsible sidebar) on desktop

## Setup
1. Create a Supabase project and run, in order, the SQL in `supabase/migrations/` (`0001_init.sql`, then `0002_quickfill_context_thankyou.sql`).
2. Copy `.env.example` to `.env.local` and fill in every value.
3. `npm install`
4. `npm run dev` and open http://localhost:3000

## Environment variables
Set these locally in `.env.local` and on Vercel under Project Settings → Environment Variables.
None of them may use the `NEXT_PUBLIC_` prefix.

| Variable | Purpose |
|---|---|
| `PASSWORD_AYUSHI`, `PASSWORD_GAURAV`, `PASSWORD_PAWAN`, `PASSWORD_ADMIN` | Sign-in passwords (server only) |
| `SESSION_SECRET` | Signs the session cookie (`openssl rand -base64 32`) |
| `OPENAI_API_KEY`, `OPENAI_MODEL`, `OPENAI_FAST_MODEL` | Advisor, Quick fill and guide |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Database and storage (service role, server only) |

## Notes
- Never commit `.env.local`. The service role key bypasses all database protections.
- Row Level Security is on for every table with no policies, so the public (anon) key can read nothing.
- To run a second dev server or build without touching `.next`, set `NEXT_DIST_DIR=.next-test`.
