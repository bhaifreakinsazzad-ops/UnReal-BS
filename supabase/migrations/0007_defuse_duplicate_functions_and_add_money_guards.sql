-- ============================================================================
-- 0007 — Defuse duplicate function definitions, and add database-level guards
--        that make double-charging and double-crediting impossible.
--
-- WHY THIS EXISTS
--
-- Two money functions are currently defined MORE THAN ONCE across the migration
-- folder, both with `create or replace` and identical signatures. Whichever
-- file runs last silently wins. That makes replaying the migrations folder
-- against a new environment a coin flip on correctness:
--
--   1. unreal_bs_ai_debit_wallet
--        0003:98  debits unreal_bs_ai_wallets   (the ABANDONED table)
--        0004:277 debits unreal_bs_wallets      (the LIVE shared wallet)
--      Replaying 0003 after 0004 points all metered AI billing at a table the
--      product no longer reads, so customers would be charged against a
--      balance nobody can see or top up.
--
--   2. unreal_bs_reveal_card_credential
--        0004:250 nulls the ciphertext and returns nothing (the RETURNING bug)
--        0005:16  the corrected version
--      Replaying 0004 after 0005 reinstalls the broken one, which permanently
--      destroys paid-for card credentials on the next reveal.
--
-- This migration re-declares BOTH functions authoritatively. Because it is
-- numbered last, it wins under lexical replay. Run it after any future replay
-- of 0003 or 0004.
--
-- Safe to run more than once.
-- ============================================================================

-- ─── 1. Authoritative unreal_bs_ai_debit_wallet (shared wallet) ─────────────
-- Charges the LIVE unreal_bs_wallets table. The balance guard lives inside the
-- UPDATE predicate, so it cannot be raced and cannot overdraw.

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
  if p_cost_bdt < 0 then
    raise exception 'NEGATIVE_COST' using errcode = 'P0001';
  end if;

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

-- The usage ledger's wallet_id still references the abandoned
-- unreal_bs_ai_wallets table. Repoint it at the live wallet table so the
-- function above can record which wallet was actually charged, and so a
-- future status='failed' row can be written when a provider call succeeds but
-- the charge does not (see the TODO in app/api/ai-subscriptions/chat/route.ts).
do $$
begin
  if exists (
    select 1 from information_schema.table_constraints
    where constraint_name = 'unreal_bs_ai_usage_ledger_wallet_id_fkey'
      and table_name = 'unreal_bs_ai_usage_ledger'
  ) then
    alter table unreal_bs_ai_usage_ledger
      drop constraint unreal_bs_ai_usage_ledger_wallet_id_fkey;
  end if;

  alter table unreal_bs_ai_usage_ledger
    add constraint unreal_bs_ai_usage_ledger_wallet_id_fkey
    foreign key (wallet_id) references unreal_bs_wallets(id) on delete cascade;
exception
  when others then
    -- Leave the old constraint in place rather than fail the whole migration.
    raise notice 'Could not repoint unreal_bs_ai_usage_ledger.wallet_id: %', sqlerrm;
end $$;

-- ─── 2. Authoritative unreal_bs_reveal_card_credential ──────────────────────
-- Row-locked read-then-clear. The application layer now decrypts BEFORE
-- calling this, so a decryption failure can no longer destroy a paid-for card.

create or replace function unreal_bs_reveal_card_credential(p_card_id uuid)
returns text
language plpgsql
as $$
declare
  v_secret text;
begin
  select credential_secret_encrypted into v_secret
  from unreal_bs_virtual_cards
  where id = p_card_id
    and credential_revealed_at is null
    and credential_secret_encrypted is not null
  for update;

  if not found then
    raise exception 'ALREADY_REVEALED_OR_NOT_FOUND' using errcode = 'P0001';
  end if;

  update unreal_bs_virtual_cards
     set credential_secret_encrypted = null,
         credential_revealed_at = now()
   where id = p_card_id;

  return v_secret;
end;
$$;

-- ─── 3. One card per order, enforced by the database ────────────────────────
-- assigned_order_id was a soft reference with no unique index, so retrying a
-- failed assignment could issue a SECOND card against the same order and debit
-- the customer twice. The application now auto-refunds on failure, but this is
-- the guarantee that does not depend on application code being correct.

create unique index if not exists unreal_bs_virtual_cards_assigned_order_uniq
  on unreal_bs_virtual_cards(assigned_order_id)
  where assigned_order_id is not null;

-- ─── 4. One pending deposit request per user ────────────────────────────────
-- The "is there already a pending request" check was read-then-insert across
-- two statements, so two taps 200ms apart produced two identical pending
-- claims — and each could be approved separately, crediting one real payment
-- twice.

create unique index if not exists unreal_bs_deposit_requests_one_pending_per_user
  on unreal_bs_deposit_requests(user_id)
  where status = 'pending';

-- Same shape for card orders.
create unique index if not exists unreal_bs_virtual_card_orders_one_pending_per_user
  on unreal_bs_virtual_card_orders(user_id)
  where status = 'pending';

-- ─── 5. Money sign guards ───────────────────────────────────────────────────
-- unreal_bs_credit_wallet_generic accepted a negative "credit", which is a
-- silent debit with no ledger trail of intent.

do $$
begin
  if not exists (
    select 1 from information_schema.constraint_column_usage
    where constraint_name = 'unreal_bs_deposit_requests_amount_positive'
  ) then
    alter table unreal_bs_deposit_requests
      add constraint unreal_bs_deposit_requests_amount_positive
      check (requested_amount_bdt > 0);
  end if;
exception
  when others then raise notice 'deposit amount check skipped: %', sqlerrm;
end $$;

do $$
begin
  if not exists (
    select 1 from information_schema.constraint_column_usage
    where constraint_name = 'unreal_bs_wallets_balance_non_negative'
  ) then
    alter table unreal_bs_wallets
      add constraint unreal_bs_wallets_balance_non_negative
      check (balance_bdt >= 0);
  end if;
exception
  when others then raise notice 'wallet balance check skipped: %', sqlerrm;
end $$;

-- ─── 6. Rate-limit hit retention ────────────────────────────────────────────
-- unreal_bs_rate_limit_hits has no TTL and no cleanup anywhere in the repo, so
-- it grows forever and slows the COUNT that gates every rate-limited endpoint.
-- This index keeps the window query fast; schedule a periodic delete of rows
-- older than the longest window (currently 900s) via pg_cron or an external job.

create index if not exists unreal_bs_rate_limit_hits_created_at_idx
  on unreal_bs_rate_limit_hits(created_at);

-- Immediate one-off cleanup of anything already older than a day.
delete from unreal_bs_rate_limit_hits where created_at < now() - interval '1 day';
