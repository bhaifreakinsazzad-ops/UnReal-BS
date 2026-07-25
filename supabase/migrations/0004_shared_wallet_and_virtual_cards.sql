-- 0004_shared_wallet_and_virtual_cards.sql
-- Generalizes the AI-subscriptions-only wallet into a shared wallet used by
-- two products: metered AI chat (unchanged, still logs to
-- unreal_bs_ai_usage_ledger) and a new virtual-card reselling feature.
--
-- unreal_bs_ai_wallets / unreal_bs_ai_bundle_topup_requests have real live
-- balances and are NEVER dropped here. Rows are copied to the new generic
-- tables preserving the same id values, so unreal_bs_ai_usage_ledger.wallet_id
-- (which references the old table) keeps working unmodified — it's a
-- historical detail log, not something that needs to move. The old tables
-- become frozen/unused going forward; a future cleanup migration can drop
-- them once confirmed safe.
--
-- Wallet stays BDT-denominated. No FX logic lives in the app — every ৳
-- amount (deposit credit, card charge) is a number the business owner
-- decides and enters manually at fulfillment time.
-- Idempotent — safe to re-run.

create extension if not exists pgcrypto;

-- ─── Generalized wallet ─────────────────────────────────────────────────────

create table if not exists unreal_bs_wallets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references unreal_bs_users(id) on delete cascade,
  balance_bdt numeric(12,2) not null default 0,
  low_balance_threshold_bdt numeric(12,2) not null default 50,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id)
);

create index if not exists unreal_bs_wallets_user_id_idx
  on unreal_bs_wallets(user_id);

-- Lossless copy from the old AI-specific table, preserving ids.
insert into unreal_bs_wallets (id, user_id, balance_bdt, low_balance_threshold_bdt, created_at, updated_at)
select id, user_id, balance_bdt, low_balance_threshold_bdt, created_at, updated_at
from unreal_bs_ai_wallets
on conflict (user_id) do nothing;

-- ─── Generalized deposit requests (renamed from AI top-up requests) ────────

create table if not exists unreal_bs_deposit_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references unreal_bs_users(id) on delete cascade,
  requested_amount_bdt numeric(12,2) not null,
  method text,   -- free text, e.g. 'bkash' | 'nagad' | 'rocket' | 'upay' | 'bank' | 'cash' | 'other'
  note text,
  status text not null default 'pending',   -- 'pending' | 'fulfilled' | 'rejected'
  fulfilled_amount_bdt numeric(12,2),
  fulfilled_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists unreal_bs_deposit_requests_user_id_idx
  on unreal_bs_deposit_requests(user_id);

insert into unreal_bs_deposit_requests (id, user_id, requested_amount_bdt, method, note, status, fulfilled_amount_bdt, fulfilled_at, created_at)
select id, user_id, requested_amount_bdt, null, note, status, fulfilled_amount_bdt, fulfilled_at, created_at
from unreal_bs_ai_bundle_topup_requests
on conflict (id) do nothing;

-- ─── Generic wallet ledger ──────────────────────────────────────────────────
-- Deposits (credits) and virtual-card purchases (debits) land here.
-- AI usage keeps its own detail log (unreal_bs_ai_usage_ledger, unchanged) —
-- it has AI-specific required columns that don't belong on a generic ledger.
-- A merged statement view, if ever needed, is a client-side UNION of both.

create table if not exists unreal_bs_wallet_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references unreal_bs_users(id) on delete cascade,
  wallet_id uuid not null references unreal_bs_wallets(id) on delete cascade,
  kind text not null,        -- 'deposit' | 'card_purchase' | 'card_refund'
  direction text not null,   -- 'credit' | 'debit'
  amount_bdt numeric(12,2) not null,
  balance_after_bdt numeric(12,2) not null,
  reference_type text,       -- 'deposit_request' | 'virtual_card_order'
  reference_id uuid,         -- soft reference, no FK (polymorphic)
  note text,
  created_at timestamptz not null default now()
);

create index if not exists unreal_bs_wallet_ledger_user_id_idx
  on unreal_bs_wallet_ledger(user_id);

create index if not exists unreal_bs_wallet_ledger_wallet_id_idx
  on unreal_bs_wallet_ledger(wallet_id);

create index if not exists unreal_bs_wallet_ledger_created_at_idx
  on unreal_bs_wallet_ledger(created_at desc);

create index if not exists unreal_bs_wallet_ledger_kind_idx
  on unreal_bs_wallet_ledger(kind);

-- ─── Virtual card inventory ─────────────────────────────────────────────────
-- Raw card number/expiry/CVV are NEVER stored in the clear. Only masked
-- display fields live in normal columns; the real credentials live encrypted
-- in credential_secret_encrypted (AES-256-GCM, app-layer key), and are
-- cleared the moment the customer reveals them once.

create table if not exists unreal_bs_virtual_cards (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  card_brand text,
  last4 text not null,
  expiry_month smallint,
  expiry_year smallint,
  status text not null default 'available',   -- 'available' | 'assigned' | 'expired' | 'retired'
  assigned_user_id uuid references unreal_bs_users(id) on delete set null,
  assigned_order_id uuid,   -- soft reference to unreal_bs_virtual_card_orders, no FK
  credential_secret_encrypted text,
  credential_revealed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists unreal_bs_virtual_cards_status_idx
  on unreal_bs_virtual_cards(status);

create index if not exists unreal_bs_virtual_cards_assigned_user_id_idx
  on unreal_bs_virtual_cards(assigned_user_id);

-- ─── Virtual card orders ────────────────────────────────────────────────────

create table if not exists unreal_bs_virtual_card_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references unreal_bs_users(id) on delete cascade,
  card_id uuid references unreal_bs_virtual_cards(id) on delete set null,
  requested_note text,
  marketed_price_usd numeric(10,2),
  charged_amount_bdt numeric(12,2),
  status text not null default 'pending',   -- 'pending' | 'fulfilled' | 'rejected'
  fulfilled_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists unreal_bs_virtual_card_orders_user_id_idx
  on unreal_bs_virtual_card_orders(user_id);

create index if not exists unreal_bs_virtual_card_orders_status_idx
  on unreal_bs_virtual_card_orders(status);

-- ─── Atomic wallet operations (generic) ─────────────────────────────────────

create or replace function unreal_bs_debit_wallet_generic(
  p_user_id uuid,
  p_amount_bdt numeric,
  p_kind text,
  p_reference_type text,
  p_reference_id uuid,
  p_note text
) returns unreal_bs_wallet_ledger
language plpgsql
as $$
declare
  v_wallet unreal_bs_wallets;
  v_ledger unreal_bs_wallet_ledger;
begin
  update unreal_bs_wallets
     set balance_bdt = balance_bdt - p_amount_bdt,
         updated_at = now()
   where user_id = p_user_id
     and balance_bdt >= p_amount_bdt
  returning * into v_wallet;

  if not found then
    raise exception 'INSUFFICIENT_BALANCE' using errcode = 'P0001';
  end if;

  insert into unreal_bs_wallet_ledger (
    user_id, wallet_id, kind, direction, amount_bdt, balance_after_bdt,
    reference_type, reference_id, note
  ) values (
    p_user_id, v_wallet.id, p_kind, 'debit', p_amount_bdt, v_wallet.balance_bdt,
    p_reference_type, p_reference_id, p_note
  ) returning * into v_ledger;

  return v_ledger;
end;
$$;

create or replace function unreal_bs_credit_wallet_generic(
  p_user_id uuid,
  p_amount_bdt numeric,
  p_kind text,
  p_reference_type text,
  p_reference_id uuid,
  p_note text
) returns unreal_bs_wallet_ledger
language plpgsql
as $$
declare
  v_wallet unreal_bs_wallets;
  v_ledger unreal_bs_wallet_ledger;
begin
  insert into unreal_bs_wallets (user_id, balance_bdt)
  values (p_user_id, p_amount_bdt)
  on conflict (user_id) do update
    set balance_bdt = unreal_bs_wallets.balance_bdt + excluded.balance_bdt,
        updated_at = now()
  returning * into v_wallet;

  insert into unreal_bs_wallet_ledger (
    user_id, wallet_id, kind, direction, amount_bdt, balance_after_bdt,
    reference_type, reference_id, note
  ) values (
    p_user_id, v_wallet.id, p_kind, 'credit', p_amount_bdt, v_wallet.balance_bdt,
    p_reference_type, p_reference_id, p_note
  ) returning * into v_ledger;

  return v_ledger;
end;
$$;

create or replace function unreal_bs_fulfill_deposit_request(
  p_request_id uuid,
  p_fulfilled_amount_bdt numeric,
  p_method text
) returns unreal_bs_deposit_requests
language plpgsql
as $$
declare
  v_request unreal_bs_deposit_requests;
begin
  update unreal_bs_deposit_requests
     set status = 'fulfilled',
         fulfilled_amount_bdt = p_fulfilled_amount_bdt,
         fulfilled_at = now(),
         method = coalesce(p_method, method)
   where id = p_request_id
     and status = 'pending'
  returning * into v_request;

  if not found then
    raise exception 'REQUEST_NOT_PENDING' using errcode = 'P0001';
  end if;

  perform unreal_bs_credit_wallet_generic(
    v_request.user_id, p_fulfilled_amount_bdt, 'deposit',
    'deposit_request', v_request.id, p_method
  );

  return v_request;
end;
$$;

-- Atomic read-and-clear: this single statement is what makes the reveal
-- single-use even under concurrent requests.
create or replace function unreal_bs_reveal_card_credential(
  p_card_id uuid
) returns text
language plpgsql
as $$
declare
  v_secret text;
begin
  update unreal_bs_virtual_cards
     set credential_secret_encrypted = null,
         credential_revealed_at = now()
   where id = p_card_id
     and credential_revealed_at is null
     and credential_secret_encrypted is not null
  returning credential_secret_encrypted into v_secret;

  if not found then
    raise exception 'ALREADY_REVEALED_OR_NOT_FOUND' using errcode = 'P0001';
  end if;

  return v_secret;
end;
$$;

-- Repoint the existing AI-debit function to the new shared wallet table.
-- Name/signature unchanged — the chat route's supabase.rpc(...) call keeps
-- working as-is. Still logs to unreal_bs_ai_usage_ledger, unchanged.
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
  v_wallet unreal_bs_wallets;
  v_ledger unreal_bs_ai_usage_ledger;
begin
  update unreal_bs_wallets
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

-- ─── Row Level Security ─────────────────────────────────────────────────────

alter table unreal_bs_wallets enable row level security;
create policy unreal_bs_wallets_service_all on unreal_bs_wallets for all using (true) with check (true);

alter table unreal_bs_deposit_requests enable row level security;
create policy unreal_bs_deposit_requests_service_all on unreal_bs_deposit_requests for all using (true) with check (true);

alter table unreal_bs_wallet_ledger enable row level security;
create policy unreal_bs_wallet_ledger_service_all on unreal_bs_wallet_ledger for all using (true) with check (true);

alter table unreal_bs_virtual_cards enable row level security;
create policy unreal_bs_virtual_cards_service_all on unreal_bs_virtual_cards for all using (true) with check (true);

alter table unreal_bs_virtual_card_orders enable row level security;
create policy unreal_bs_virtual_card_orders_service_all on unreal_bs_virtual_card_orders for all using (true) with check (true);
