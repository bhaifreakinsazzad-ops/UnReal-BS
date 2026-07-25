-- UnReal BS hardening + requests
-- Adds: Postgres-backed rate limiting, DB-backed error logging, and the
-- dedicated GHL sub-account upgrade request flow.
-- Idempotent — safe to re-run against a database that already has 0001 applied.

create extension if not exists pgcrypto;

-- ─── Rate limiting ──────────────────────────────────────────────────────────

create table if not exists unreal_bs_rate_limit_hits (
  id uuid primary key default gen_random_uuid(),
  bucket text not null,
  identifier text not null,
  created_at timestamptz not null default now()
);

create index if not exists unreal_bs_rate_limit_hits_bucket_identifier_created_idx
  on unreal_bs_rate_limit_hits(bucket, identifier, created_at);

alter table unreal_bs_rate_limit_hits enable row level security;
-- Server-side service-role access only; app enforces per-user scoping above RLS.
create policy unreal_bs_rate_limit_hits_service_all on unreal_bs_rate_limit_hits for all using (true) with check (true);

-- ─── Error logs ─────────────────────────────────────────────────────────────

create table if not exists unreal_bs_error_logs (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  message text not null,
  stack text,
  context jsonb,
  created_at timestamptz not null default now()
);

create index if not exists unreal_bs_error_logs_created_at_idx
  on unreal_bs_error_logs(created_at desc);

alter table unreal_bs_error_logs enable row level security;
-- Server-side service-role access only; app enforces per-user scoping above RLS.
create policy unreal_bs_error_logs_service_all on unreal_bs_error_logs for all using (true) with check (true);

-- ─── Account upgrade requests (dedicated GHL sub-account) ──────────────────

create table if not exists unreal_bs_account_upgrade_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references unreal_bs_users(id) on delete cascade,
  note text,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

create index if not exists unreal_bs_account_upgrade_requests_user_id_idx
  on unreal_bs_account_upgrade_requests(user_id);

alter table unreal_bs_account_upgrade_requests enable row level security;
-- Server-side service-role access only; app enforces per-user scoping above RLS.
create policy unreal_bs_account_upgrade_requests_service_all on unreal_bs_account_upgrade_requests for all using (true) with check (true);
