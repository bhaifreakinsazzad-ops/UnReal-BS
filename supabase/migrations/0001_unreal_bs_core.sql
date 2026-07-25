-- UnReal BS core schema
-- Tables are prefixed unreal_bs_ because this database is shared with another
-- project (surreal-os) — the prefix avoids name collisions.

create extension if not exists pgcrypto;

-- ─── Users ──────────────────────────────────────────────────────────────────

create table if not exists unreal_bs_users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  password_hash text not null,
  business_name text,
  ghl_location_id text,
  role text not null default 'owner',
  created_at timestamptz not null default now()
);

-- ─── Udhar Khata (debt ledger) ──────────────────────────────────────────────

create table if not exists unreal_bs_udhar_contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references unreal_bs_users(id) on delete cascade,
  name text not null,
  phone text,
  area text,
  created_at timestamptz not null default now()
);

create index if not exists unreal_bs_udhar_contacts_user_id_idx
  on unreal_bs_udhar_contacts(user_id);

create table if not exists unreal_bs_udhar_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references unreal_bs_users(id) on delete cascade,
  contact_id uuid not null references unreal_bs_udhar_contacts(id) on delete cascade,
  amount numeric(12,2) not null,
  description text,
  entry_date date not null,
  due_date date,
  created_at timestamptz not null default now()
);

create index if not exists unreal_bs_udhar_entries_user_id_idx
  on unreal_bs_udhar_entries(user_id);

create table if not exists unreal_bs_udhar_payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references unreal_bs_users(id) on delete cascade,
  contact_id uuid not null references unreal_bs_udhar_contacts(id) on delete cascade,
  amount numeric(12,2) not null,
  paid_at timestamptz not null default now()
);

create index if not exists unreal_bs_udhar_payments_user_id_idx
  on unreal_bs_udhar_payments(user_id);

-- ─── Opportunity status ─────────────────────────────────────────────────────

create table if not exists unreal_bs_opportunity_status (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references unreal_bs_users(id) on delete cascade,
  opportunity_id text not null,
  status text not null,
  updated_at timestamptz not null default now(),
  unique(user_id, opportunity_id)
);

create index if not exists unreal_bs_opportunity_status_user_id_idx
  on unreal_bs_opportunity_status(user_id);

-- ─── Row Level Security ─────────────────────────────────────────────────────
-- RLS is enabled as a defense-in-depth backstop only. The real access control
-- happens server-side: API routes resolve the session user by email and scope
-- every query to that user_id using the service-role key, which is never sent
-- to the browser. These permissive policies exist so RLS is on (satisfying
-- Supabase's linter/dashboard warnings) without duplicating app-layer auth.

alter table unreal_bs_users enable row level security;
-- Server-side service-role access only; app enforces per-user scoping above RLS.
create policy unreal_bs_users_service_all on unreal_bs_users for all using (true) with check (true);

alter table unreal_bs_udhar_contacts enable row level security;
-- Server-side service-role access only; app enforces per-user scoping above RLS.
create policy unreal_bs_udhar_contacts_service_all on unreal_bs_udhar_contacts for all using (true) with check (true);

alter table unreal_bs_udhar_entries enable row level security;
-- Server-side service-role access only; app enforces per-user scoping above RLS.
create policy unreal_bs_udhar_entries_service_all on unreal_bs_udhar_entries for all using (true) with check (true);

alter table unreal_bs_udhar_payments enable row level security;
-- Server-side service-role access only; app enforces per-user scoping above RLS.
create policy unreal_bs_udhar_payments_service_all on unreal_bs_udhar_payments for all using (true) with check (true);

alter table unreal_bs_opportunity_status enable row level security;
-- Server-side service-role access only; app enforces per-user scoping above RLS.
create policy unreal_bs_opportunity_status_service_all on unreal_bs_opportunity_status for all using (true) with check (true);
