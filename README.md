# Calendar

A simple offline-first calendar app built with Next.js. Click any day to add, edit, or delete events, including recurring ones.

## Features

- Month-view calendar with previous/next/today navigation
- Add, edit, and delete events (title, time, description)
- Recurring events — daily, weekly, monthly, or yearly, with an optional end date
- Data persisted locally in SQLite (`data/calendar.db`)
- Installable as a PWA

## Tech stack

- [Next.js](https://nextjs.org) (App Router, Server Actions)
- React + TypeScript
- Tailwind CSS
- [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) for storage

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project structure

- `src/app` — routes, root layout, PWA manifest
- `src/components` — `Calendar` (month grid) and `EventModal` (event form)
- `src/lib/actions.ts` — server actions for event CRUD
- `src/lib/server/db.ts` — SQLite schema and queries
- `src/lib/types.ts` — shared types

## Notes

- Recurring events store a single anchor event; occurrences are computed on the fly for whichever month is visible.
- Editing or deleting a recurring event applies to the entire series, not a single occurrence.
