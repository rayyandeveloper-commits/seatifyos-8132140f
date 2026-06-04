-- ============================================================
-- Study Lounge OS — V2 Upgrade Migration
-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- 1. PAYMENTS TABLE
CREATE TABLE IF NOT EXISTS public.payments (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id        UUID NOT NULL,
  student_id      UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  amount          NUMERIC(10,2) NOT NULL CHECK (amount >= 0),
  payment_type    TEXT NOT NULL DEFAULT 'monthly_fee',   -- monthly_fee | admission | security_deposit | misc
  payment_method  TEXT NOT NULL DEFAULT 'cash',          -- cash | upi | bank_transfer
  payment_date    DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date        DATE,
  notes           TEXT,
  status          TEXT NOT NULL DEFAULT 'paid',           -- paid | partial | overdue
  receipt_number  TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "owner_payments_all" ON public.payments;
CREATE POLICY "owner_payments_all" ON public.payments
  FOR ALL USING (owner_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_payments_owner ON public.payments(owner_id);
CREATE INDEX IF NOT EXISTS idx_payments_student ON public.payments(student_id);
CREATE INDEX IF NOT EXISTS idx_payments_date ON public.payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);

-- 2. ATTENDANCE LOGS TABLE
CREATE TABLE IF NOT EXISTS public.attendance_logs (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id    UUID NOT NULL,
  student_id  UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  date        DATE NOT NULL DEFAULT CURRENT_DATE,
  check_in    TIMESTAMPTZ,
  check_out   TIMESTAMPTZ,
  method      TEXT DEFAULT 'manual',   -- manual | biometric
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT attendance_unique_student_day UNIQUE (student_id, date)
);

ALTER TABLE public.attendance_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "owner_attendance_all" ON public.attendance_logs;
CREATE POLICY "owner_attendance_all" ON public.attendance_logs
  FOR ALL USING (owner_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_attendance_owner ON public.attendance_logs(owner_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date  ON public.attendance_logs(date);
CREATE INDEX IF NOT EXISTS idx_attendance_student ON public.attendance_logs(student_id);

-- 3. ENHANCED STUDENT COLUMNS (optional enrichment)
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS father_name       TEXT;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS address           TEXT;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS aadhaar           TEXT;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS alternate_phone   TEXT;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS emergency_contact TEXT;

-- Done! ✅
