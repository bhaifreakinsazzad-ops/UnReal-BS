-- 0003_ai_subscriptions.sql
-- AI Subscriptions: token-wallet, provider/model pricing, usage ledger, and
-- manual top-up request flow for the metered "real top-tier models" chat
-- product. Separate and parallel to the free client-side BhaiFreakin AI
-- (Puter.js) feature — this schema is never touched by that code path.
-- Idempotent — safe to re-run against a database that already has 0001/0002 applied.

create extension if not exists pgcrypto;

-- ─── Wallets ────────────────────────────────────────────────────────────────
-- One row per user. balance_bdt is the spendable credit balance in BDT (৳).

create table if not exists unreal_bs_ai_wallets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references unreal_bs_users(id) on delete cascade,
  balance_bdt numeric(12,2) not null default 0,
  low_balance_threshold_bdt numeric(12,2) not null default 50,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id)
);

create index if not exists unreal_bs_ai_wallets_user_id_idx
  on unreal_bs_ai_wallets(user_id);

-- ─── Provider / model pricing (admin-editable via SQL for v1) ──────────────
-- Rates are $/1K tokens at the provider's real cost, converted to BDT input/
-- output rates per 1K tokens, plus a markup multiplier applied on top.
-- numeric(12,6) here (not the usual numeric(12,2)) because per-token BDT
-- rates are sub-cent and would round to zero at 2dp.

create table if not exists unreal_bs_ai_model_rates (
  id uuid primary key default gen_random_uuid(),
  provider text not null,               -- 'openai' | 'anthropic' | 'google' | 'moonshot'
  model_id text not null,               -- provider's API model identifier, e.g. 'gpt-4o-mini'
  display_name text not null,           -- shown in the model picker
  input_rate_bdt_per_1k numeric(12,6) not null,
  output_rate_bdt_per_1k numeric(12,6) not null,
  markup_multiplier numeric(6,3) not null default 1.300,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(provider, model_id)
);

create index if not exists unreal_bs_ai_model_rates_active_idx
  on unreal_bs_ai_model_rates(is_active);

-- ─── Usage ledger ───────────────────────────────────────────────────────────
-- Append-only log of every metered chat call. This IS the transaction
-- history the wallet balance is derived from (source of truth for support/
-- disputes), and also the substitute for conversation history in v1.

create table if not exists unreal_bs_ai_usage_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references unreal_bs_users(id) on delete cascade,
  wallet_id uuid not null references unreal_bs_ai_wallets(id) on delete cascade,
  model_rate_id uuid references unreal_bs_ai_model_rates(id) on delete set null,
  provider text not null,
  model_id text not null,
  input_tokens integer not null,
  output_tokens integer not null,
  cost_bdt numeric(12,2) not null,
  balance_after_bdt numeric(12,2) not null,
  status text not null default 'completed',  -- 'completed' | 'failed'
  error_message text,
  created_at timestamptz not null default now()
);

create index if not exists unreal_bs_ai_usage_ledger_user_id_idx
  on unreal_bs_ai_usage_ledger(user_id);

create index if not exists unreal_bs_ai_usage_ledger_created_at_idx
  on unreal_bs_ai_usage_ledger(created_at desc);

-- ─── Top-up requests (mirrors unreal_bs_account_upgrade_requests) ─────────

create table if not exists unreal_bs_ai_bundle_topup_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references unreal_bs_users(id) on delete cascade,
  requested_amount_bdt numeric(12,2) not null,
  note text,
  status text not null default 'pending',   -- 'pending' | 'fulfilled' | 'rejected'
  fulfilled_amount_bdt numeric(12,2),
  fulfilled_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists unreal_bs_ai_bundle_topup_requests_user_id_idx
  on unreal_bs_ai_bundle_topup_requests(user_id);

-- ─── Atomic wallet operations ───────────────────────────────────────────────
-- Both functions run inside a single implicit transaction (the function
-- body), so the balance mutation and its corresponding ledger/request row
-- either both commit or both roll back. Called via supabase.rpc(...) from
-- the service-role client — never exposed to anon/authenticated roles.

create or replace function unreal_bs_ai_debit_wallet(
  p_user_id uuid,
  p_model_rate_id uuid,
  p_provider text,
  p_model_id text,
  p_input_tokens integer,
  p_output_tokens integer,
  p_cost_bdt numeric
) returns unreal_bs_ai_usage_ledger
language plpgsql
as $$
declare
  v_wallet unreal_bs_ai_wallets;
  v_ledger unreal_bs_ai_usage_ledger;
begin
  update unreal_bs_ai_wallets
     set balance_bdt = balance_bdt - p_cost_bdt,
         updated_at = now()
   where user_id = p_user_id
     and balance_bdt >= p_cost_bdt
  returning * into v_wallet;

  if not found then
    raise exception 'INSUFFICIENT_BALANCE' using errcode = 'P0001';
  end if;

  insert into unreal_bs_ai_usage_ledger (
    user_id, wallet_id, model_rate_id, provider, model_id,
    input_tokens, output_tokens, cost_bdt, balance_after_bdt, status
  ) values (
    p_user_id, v_wallet.id, p_model_rate_id, p_provider, p_model_id,
    p_input_tokens, p_output_tokens, p_cost_bdt, v_wallet.balance_bdt, 'completed'
  ) returning * into v_ledger;

  return v_ledger;
end;
$$;

create or replace function unreal_bs_ai_credit_wallet_from_topup(
  p_request_id uuid,
  p_fulfilled_amount_bdt numeric
) returns unreal_bs_ai_bundle_topup_requests
language plpgsql
as $$
declare
  v_request unreal_bs_ai_bundle_topup_requests;
begin
  update unreal_bs_ai_bundle_topup_requests
     set status = 'fulfilled',
         fulfilled_amount_bdt = p_fulfilled_amount_bdt,
         fulfilled_at = now()
   where id = p_request_id
     and status = 'pending'
  returning * into v_request;

  if not found then
    raise exception 'REQUEST_NOT_PENDING' using errcode = 'P0001';
  end if;

  insert into unreal_bs_ai_wallets (user_id, balance_bdt)
  values (v_request.user_id, p_fulfilled_amount_bdt)
  on conflict (user_id) do update
    set balance_bdt = unreal_bs_ai_wallets.balance_bdt + excluded.balance_bdt,
        updated_at = now();

  return v_request;
end;
$$;

-- ─── Seed starting model rates ──────────────────────────────────────────────
-- STARTING VALUES TO REVIEW — NOT VERIFIED CURRENT PRICING.

insert into unreal_bs_ai_model_rates (provider, model_id, display_name, input_rate_bdt_per_1k, output_rate_bdt_per_1k, markup_multiplier)
values
  ('openai',    'gpt-4o',            'GPT-4o',              0.605, 2.420, 1.300),
  ('openai',    'gpt-4o-mini',       'GPT-4o mini',          0.036, 0.145, 1.300),
  ('anthropic', 'claude-sonnet-4-5', 'Claude Sonnet 4.5',    0.363, 1.815, 1.300),
  ('anthropic', 'claude-haiku-4-5',  'Claude Haiku 4.5',     0.121, 0.605, 1.300),
  ('google',    'gemini-2.0-flash',  'Gemini 2.0 Flash',     0.018, 0.073, 1.300),
  ('google',    'gemini-1.5-pro',    'Gemini 1.5 Pro',       0.303, 1.210, 1.300)
on conflict (provider, model_id) do nothing;

-- ─── Row Level Security ─────────────────────────────────────────────────────

alter table unreal_bs_ai_wallets enable row level security;
create policy unreal_bs_ai_wallets_service_all on unreal_bs_ai_wallets for all using (true) with check (true);

alter table unreal_bs_ai_model_rates enable row level security;
create policy unreal_bs_ai_model_rates_service_all on unreal_bs_ai_model_rates for all using (true) with check (true);

alter table unreal_bs_ai_usage_ledger enable row level security;
create policy unreal_bs_ai_usage_ledger_service_all on unreal_bs_ai_usage_ledger for all using (true) with check (true);

alter table unreal_bs_ai_bundle_topup_requests enable row level security;
create policy unreal_bs_ai_bundle_topup_requests_service_all on unreal_bs_ai_bundle_topup_requests for all using (true) with check (true);
