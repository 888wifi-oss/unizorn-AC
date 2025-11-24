-- Enhanced Bank Reconciliation System
-- This script creates/updates the bank_reconciliation_matches table with improved tracking and security

-- Create reconciliation status enum
do $$ begin
  if not exists (select 1 from pg_type where typname = 'reconciliation_status') then
    create type reconciliation_status as enum ('pending', 'matched', 'reviewed', 'rejected');
  end if;
end $$;

-- Create or update bank_reconciliation_matches table
create table if not exists public.bank_reconciliation_matches (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete set null,
  
  -- Bank transaction details
  bank_date date not null,
  bank_description text,
  bank_amount numeric(18,2) not null,
  bank_reference text,
  bank_account text,
  
  -- Matching details
  payment_id uuid references public.payments(id) on delete cascade,
  match_confidence integer default 0 check (match_confidence >= 0 and match_confidence <= 100),
  status reconciliation_status default 'pending',
  notes text,
  
  -- Audit trail
  matched_by_user_id uuid references auth.users(id) on delete set null,
  reviewed_by_user_id uuid references auth.users(id) on delete set null,
  reviewed_at timestamp with time zone,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Add new columns to existing table if they don't exist
do $$ begin
  if not exists (select 1 from information_schema.columns where table_name = 'bank_reconciliation_matches' and column_name = 'match_confidence') then
    alter table public.bank_reconciliation_matches add column match_confidence integer default 0 check (match_confidence >= 0 and match_confidence <= 100);
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'bank_reconciliation_matches' and column_name = 'status') then
    alter table public.bank_reconciliation_matches add column status reconciliation_status default 'pending';
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'bank_reconciliation_matches' and column_name = 'notes') then
    alter table public.bank_reconciliation_matches add column notes text;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'bank_reconciliation_matches' and column_name = 'reviewed_by_user_id') then
    alter table public.bank_reconciliation_matches add column reviewed_by_user_id uuid references auth.users(id) on delete set null;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'bank_reconciliation_matches' and column_name = 'reviewed_at') then
    alter table public.bank_reconciliation_matches add column reviewed_at timestamp with time zone;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'bank_reconciliation_matches' and column_name = 'updated_at') then
    alter table public.bank_reconciliation_matches add column updated_at timestamp with time zone default now();
  end if;
end $$;

-- Helpful indexes
create index if not exists idx_bank_rec_project on public.bank_reconciliation_matches(project_id);
create index if not exists idx_bank_rec_payment on public.bank_reconciliation_matches(payment_id);
create index if not exists idx_bank_rec_date on public.bank_reconciliation_matches(bank_date);
create index if not exists idx_bank_rec_status on public.bank_reconciliation_matches(status);
create index if not exists idx_bank_rec_confidence on public.bank_reconciliation_matches(match_confidence);

-- Function to update updated_at timestamp
create or replace function update_bank_reconciliation_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger to auto-update updated_at
drop trigger if exists update_bank_reconciliation_matches_updated_at on public.bank_reconciliation_matches;
create trigger update_bank_reconciliation_matches_updated_at
  before update on public.bank_reconciliation_matches
  for each row
  execute function update_bank_reconciliation_updated_at();

-- Row Level Security
alter table public.bank_reconciliation_matches enable row level security;

-- Drop old permissive policies
drop policy if exists allow_select_by_project on public.bank_reconciliation_matches;
drop policy if exists allow_insert_by_project on public.bank_reconciliation_matches;

-- Create proper RLS policies (matching the project's security model)
-- Note: Using permissive policies for development with mock auth, similar to other tables
create policy bank_rec_select_policy on public.bank_reconciliation_matches
  for select
  using (true);

create policy bank_rec_insert_policy on public.bank_reconciliation_matches
  for insert
  with check (true);

create policy bank_rec_update_policy on public.bank_reconciliation_matches
  for update
  using (true)
  with check (true);

create policy bank_rec_delete_policy on public.bank_reconciliation_matches
  for delete
  using (true);

-- Grant permissions
grant select, insert, update, delete on public.bank_reconciliation_matches to authenticated;
grant select, insert, update, delete on public.bank_reconciliation_matches to service_role;


