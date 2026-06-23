# LabLog

A personal research work tracker — log what you do each day, track goals,
blockers, file/dataset issues, and generate clean weekly updates for your PI
and lab meetings. Data is stored in your browser (`localStorage`); no backend
required for the MVP.

## Stack

- **Next.js 14** (App Router) + **TypeScript**
- **Tailwind CSS** with a soft light/dark theme
- **localStorage** persistence behind a repository layer

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Pages

| Route       | Purpose                                                        |
| ----------- | ------------------------------------------------------------- |
| `/`         | Dashboard — today's focus, weekly hours, blockers, goals      |
| `/daily`    | Daily log — fast entry of what you did, hours, blockers, etc. |
| `/goals`    | Long/short-term goals with milestones                         |
| `/tasks`    | Kanban board (Backlog → This Week → Today → Blocked → Done)   |
| `/blockers` | Blockers & questions for your PI                              |
| `/files`    | Participant data / file issue tracker                         |
| `/weekly`   | Generate Slack / talking points / email updates from a range  |

## Hours tracking

Each daily log records two numbers:

- **Hours on task** — focused work time
- **Hours in lab** — total time present

Tasks on the board also track **hours spent**, with a quick "+ Log hours"
button. Weekly summaries total all of these.

## Architecture notes — adding Supabase later

All persistence flows through `lib/storage.ts` (`createRepository`) and the
concrete repositories in `lib/repositories.ts`. The CRUD methods are already
`async`, so swapping the localStorage bodies for Supabase queries is the only
change required — the UI and `useCollection` hook stay the same. Keep the
`BaseRecord` shape (`id`, `createdAt`, `updatedAt`) as your row columns.

Summary generation lives in `lib/summary.ts` as pure functions — no AI, every
line is derived from entered data.
