-- scripts/182_create_payments_report_schedules.sql
-- สร้างตารางกำหนดการส่งรายงานการชำระเงินอัตโนมัติ

CREATE TABLE IF NOT EXISTS public.payments_report_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  recipients TEXT[] NOT NULL,
  send_format TEXT NOT NULL DEFAULT 'csv', -- csv | xlsx
  run_time TIME NOT NULL DEFAULT '08:00', -- เวลาในโซนที่กำหนด
  timezone TEXT NOT NULL DEFAULT 'Asia/Bangkok',
  include_legacy BOOLEAN NOT NULL DEFAULT FALSE,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  last_run_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(project_id)
);

CREATE INDEX IF NOT EXISTS idx_payments_report_schedules_project
  ON public.payments_report_schedules(project_id);

