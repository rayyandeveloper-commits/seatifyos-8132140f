
# Study Lounge OS — Production Upgrade Plan

Spec adapted to the actual stack (TanStack Start + Lovable Cloud / Postgres). All features below are real, no mocks.

## 1. Database changes (one migration)

- **Rename / rebrand**: keep table names; update `app_settings.library_name` default to "Study Lounge OS".
- **`cabins`**
  - Add `name TEXT` (alphanumeric: `A12`, `VIP-01`, `AA-22`). Keep `number INT` nullable for back-compat; UI uses `name`.
  - Unique `(owner_id, name)`.
- **`students`**
  - Add `whatsapp TEXT` (defaults to `phone`), `status TEXT` computed via view? → use generated column or app-side.
- **`cabin_history`** (new — permanent audit log)
  ```
  id uuid pk
  owner_id uuid (RLS)
  cabin_id uuid    -- nullable so history survives cabin delete
  cabin_name text  -- snapshot
  student_id uuid  -- nullable so history survives student delete
  student_name text, phone text, whatsapp text  -- snapshots
  assigned_date date, due_date date, vacated_date date
  status text  -- 'active' | 'completed' | 'transferred' | 'expired'
  created_at timestamptz, updated_at timestamptz
  ```
  RLS: owner-only read/insert/update; **no DELETE policy** (history is permanent).
- **`reminder_logs`** (new) — `id, owner_id, student_id, cabin_history_id, channel ('whatsapp'), status ('sent'|'failed'|'queued'), provider_sid, error, sent_at`.
- **Triggers (auto history)**
  - `students` INSERT with `cabin_id` → insert active `cabin_history` row.
  - `students` UPDATE: if `cabin_id` changes → close prior open history row (`vacated_date = today`, `status='transferred'`), insert new active row. If `due_date` changes → update open row's `due_date` (renewal).
  - `students` DELETE → close open row (`vacated_date = today`, `status='completed'`).
- **Scheduled jobs** (pg_cron, already enabled):
  - 00:05 daily: mark expired open history (`due_date < today` and active > 30d) → `status='expired'`. Keep `generate_due_notifications` job.
  - 09:00 daily: `pg_net` POST → `/api/public/hooks/send-reminders` (Twilio).

## 2. Backend / server functions

New files under `src/lib/`:
- `history.functions.ts` — `useCabinHistory(cabinId)`, search/filter, analytics aggregates (most-used cabin, longest occupancy, utilization %).
- `import.functions.ts` — bulk insert students/cabins with dedupe by `(owner_id, phone)` / `(owner_id, name)`; returns row-level errors.
- `sheets.functions.ts` — Google Sheets pull via gateway (`google_sheets` connector).
- `reminders.functions.ts` — preview/send single WhatsApp via Twilio gateway.

New public route:
- `src/routes/api/public/hooks/send-reminders.ts` — auth via `apikey` header; finds students with `due_date BETWEEN today AND today+7`, sends Twilio WhatsApp, writes `reminder_logs`.

## 3. Integrations to connect (in order)
1. **Twilio** connector — for WhatsApp send (auto + manual). Requires user to complete OAuth/connect flow.
2. **Google Sheets** connector — for import-by-URL.

(Click-to-chat `wa.me` stays as fallback for one-off sends.)

## 4. Frontend pages/components

**New / upgraded:**
- `routes/cabins.tsx` — supports alphanumeric `name`, status chips, **"View History"** button per cabin.
- `components/cabin/CabinHistoryModal.tsx` — animated vertical **timeline** with status pills, search, expand/collapse cards, glow accents.
- `routes/analytics.tsx` — new page: most-used cabin, longest occupancy, utilization % chart, monthly assignment trend (recharts).
- `routes/imports.tsx` — new page:
  - drag-drop `.xlsx`/`.csv` (papaparse + xlsx), preview table, validation, dedupe, commit.
  - Google Sheets URL input → fetch via connector → same preview/commit flow.
  - Export: students/cabins/history as CSV + XLSX.
- `routes/notifications.tsx` — add reminder_logs tab (sent/failed with retry).
- `routes/settings.tsx` — Twilio sender number, WhatsApp template, business name, daily-send time.
- Sidebar: add **Analytics**, **Imports**.
- **Toast popup system**: install `sonner` (already in shadcn list) — wired globally for due-soon alerts on app load + realtime channel on `notifications` insert.
- **Realtime**: subscribe to `notifications` and `cabin_history` for the current owner; toast on new rows.

**UI polish (no full redesign; keep existing glassmorphism + violet/cyan tokens):**
- Tighten typography (display weight, tracking).
- Add subtle animated mesh-gradient background + particles via lightweight canvas (no Three.js — agreed cost/benefit; current `--gradient-*` tokens stay).
- Magnetic hover + shimmer on stat cards and primary CTAs (Framer Motion only).
- Skeleton loaders on every async list.

## 5. Security
- All new tables: RLS `owner_id = auth.uid()`; `cabin_history` has **no delete policy**.
- `/api/public/hooks/send-reminders` validates `apikey` header against `SUPABASE_PUBLISHABLE_KEY` (or a dedicated `CRON_SECRET` if user prefers).
- Twilio + Google Sheets called through Lovable connector gateway only — no provider keys in client bundle.
- Zod validation on every server-fn input (imports, reminders, history filters).
- Auth gate already in `_authenticated` pattern via `Shell.tsx`; tighten by moving routes under `src/routes/_authenticated/*` so `beforeLoad` redirects pre-render (avoids flash + SSR 401).

## 6. Phasing inside this single turn
Order of execution after plan approval:
1. Run migration (schema + triggers + cron).
2. Prompt to connect **Twilio**, then **Google Sheets**.
3. Build server functions + public hook route.
4. Build/upgrade pages (cabins history modal, analytics, imports, notifications logs, settings).
5. Add toast system + realtime listeners + UI polish.
6. Smoke-test build; verify cron job scheduled.

## What I'm NOT doing (and why)
- **No Three.js / R3F**: heavy on mobile, low ROI vs animated gradient + parallax. Can add later in a dedicated pass.
- **No Firebase migration**: stack is Lovable Cloud per your answer; everything above is functionally equivalent (Postgres + RLS + pg_cron + Auth).
- **No new auth UI**: existing email/password + Google flow is kept; only hardened.

After you approve, I'll execute steps 1–6 in order and ask for the Twilio/Google Sheets connections inline.
