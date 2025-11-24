-- Add reconciliation status columns to payments
alter table public.payments
  add column if not exists reconciled boolean not null default false,
  add column if not exists reconciliation_date date;

create index if not exists idx_payments_reconciled on public.payments(reconciled);
create index if not exists idx_payments_reconciliation_date on public.payments(reconciliation_date);

