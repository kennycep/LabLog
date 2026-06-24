# LabLog

A private research work tracker — a lab notebook and weekly-update generator.
Log work sessions with time in/out, track goals, tasks, blockers, and
participant file issues, and turn it all into a clean Slack update or meeting
agenda for your PI. Data is stored in **Supabase** (Postgres + Auth) and syncs
across your phone and laptop, private to your account.

## Stack

- **Next.js 14** (App Router) + **TypeScript**
- **Tailwind CSS** with a soft light/dark theme (lab red + white)
- **Supabase** — Postgres for data, Auth for email magic-link sign-in
- Row Level Security so each user only ever sees their own rows

## 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) → **New project**. Pick a name
   and database password; wait for it to provision.
2. In the dashboard, open **SQL Editor → New query**, paste the contents of
   [`supabase/schema.sql`](supabase/schema.sql), and **Run**. This creates all
   tables (`profiles`, `daily_logs`, `work_sessions`, `goals`, `tasks`,
   `blockers`, `file_issues`, `weekly_reports`), enables RLS, and adds the
   per-user policies and triggers.
3. Open **Project Settings → API** and copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Auth URLs (magic link)

In **Authentication → URL Configuration**, set:

- **Site URL**: your production URL (e.g. `https://lab-log-two.vercel.app`)
- **Redirect URLs**: add both your production URL and `http://localhost:3000`
  for local development.

Email magic links work out of the box with Supabase's built-in email (subject
to rate limits). For heavier use, configure your own SMTP under
**Authentication → Emails**.

## 2. Configure environment variables

Copy the example file and fill in your values:

```bash
cp .env.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
```

Keys are never hardcoded — they're read from the environment. `.env.local` is
git-ignored.

## 3. Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000. You'll be sent to the sign-in page; enter your
email, click the magic link, and you're in.

## 4. Deploy to Vercel

After deploying, add the **same two environment variables** in your Vercel
project:

**Vercel → Project → Settings → Environment Variables**

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Add them for the Production (and Preview) environments, then **redeploy** so the
build picks them up. (Next.js inlines `NEXT_PUBLIC_*` values at build time, so a
redeploy is required after changing them.) Also remember to add your Vercel URL
to the Supabase **Redirect URLs** list (step 1).

## Pages

| Route       | Purpose                                                        |
| ----------- | ------------------------------------------------------------- |
| `/login`    | Magic-link sign-in / landing page (public)                    |
| `/`         | Dashboard — daily check-in, timeline, week at a glance        |
| `/daily`    | Daily Log — sectioned notebook entry with timed sessions      |
| `/goals`    | Long/short-term goals with milestones                         |
| `/tasks`    | Kanban board (Backlog → This Week → Today → Blocked → Done)   |
| `/blockers` | Blockers & questions for your PI                              |
| `/files`    | Participant data / file issue tracker                         |
| `/weekly`   | Prepare Cameron update + saved meeting-report archive         |
| `/account`  | Email, sign out, export JSON, delete all data                 |

## Time tracking

Each daily log holds one or more **work sessions** (time in / out / break /
type) that auto-calculate hours. Lab hours come from the sessions (or a manual
override); focused task hours are tracked separately. The dashboard and weekly
summary roll these up across the week.

## Architecture

Data flows through a repository layer:

- [`lib/supabase.ts`](lib/supabase.ts) — lazy browser client (no env access at
  import time, so the build never needs the keys).
- [`lib/supabaseRepo.ts`](lib/supabaseRepo.ts) — generic Supabase repository
  with camelCase ↔ snake_case mapping.
- [`lib/repositories.ts`](lib/repositories.ts) — one repo per table; the
  `daily_logs` repo also manages nested `work_sessions`.
- [`lib/useCollection.ts`](lib/useCollection.ts) — auth-aware React hook
  (loading/error states, refetch after mutations).

Auth gating lives in [`components/AuthProvider.tsx`](components/AuthProvider.tsx)
and [`components/AppGate.tsx`](components/AppGate.tsx): unauthenticated users are
redirected to `/login`, and every table is protected by RLS regardless of the
UI.

Summary generation is in [`lib/summary.ts`](lib/summary.ts) — pure functions, no
AI, every line derived from entered data.
