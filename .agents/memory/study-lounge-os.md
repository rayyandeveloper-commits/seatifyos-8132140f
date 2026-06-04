---
name: Study Lounge OS architecture
description: Stack, auth, DB, key files, and completed upgrade notes for Study Lounge OS project.
---

## Stack
- TanStack Start (SSR React) + TanStack Router (file-based) + TanStack Query
- Supabase (auth + DB) — credentials in .replit userenv as VITE_SUPABASE_URL + VITE_SUPABASE_PUBLISHABLE_KEY
- Tailwind CSS v4, Framer Motion, Radix UI/shadcn components, Recharts
- Vite via `@lovable.dev/vite-tanstack-config` (kept, works fine on port 5000)

## Auth
- Supabase email/password only. No Google OAuth.
- Session in localStorage via Supabase JS client.
- Shell.tsx handles auth guard (redirects to "/" if no session).

## Key files
- `src/lib/queries.ts` — all data hooks + types
- `src/lib/reminders.functions.ts` — server fn for Twilio WhatsApp
- `src/routes/api/public/hooks/send-reminders.ts` — daily cron endpoint
- `src/integrations/supabase/client.ts` — Supabase client
- `src/styles.css` — full design system (glass, gradients, oklch dark theme)
- `src/components/layout/Shell.tsx` — auth guard + command palette (⌘K)
- `src/components/layout/Sidebar.tsx` — nav with unread badge
- `src/components/layout/CommandPalette.tsx` — ⌘K search palette

## DB tables
- cabins, students, notifications, app_settings, cabin_history, reminder_logs

## WhatsApp / Twilio
- Direct Twilio API (not Lovable gateway)
- Requires TWILIO_ACCOUNT_SID + TWILIO_AUTH_TOKEN in Replit Secrets
- Sender number stored in app_settings.twilio_from

## Completed upgrades (PRD phases)
- ⌘K Command palette with page/student/cabin search
- Skeleton loaders on all pages (dashboard, cabins, students, renewals, analytics, notifications)
- Mark all notifications read (useMarkAllNotificationsRead mutation)
- Unread notification badge on Sidebar nav item
- Search button in Topbar (desktop + mobile)
- Quick actions grid on Dashboard
- Overdue alert banner on Dashboard with occupancy progress bar
- Filter tab counts on Students page
- Student notes expandable in-row on Students table
- Cabin count labels on filter tabs in Cabins page
- Better empty states on all pages
- Bulk WhatsApp send on Renewals (due today + all overdue)
- Per-student Twilio send button on Renewals list
- Analytics: empty states for charts when no data

**Why:** Preserve all existing data/APIs, refactor-not-replace approach per PRD instruction.
