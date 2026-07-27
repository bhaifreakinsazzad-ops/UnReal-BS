-- ============================================================================
-- 0010 — Per-user daily spend cap + a free tier for registered users
--
-- WHY A DAILY CAP, AND WHY 500 BDT
--
-- Credit is PREPAID, so fast spending does not put us out of pocket — the money
-- was already collected. The cap therefore exists to protect (a) the customer,
-- from a runaway script or a mistake draining a package in minutes, and (b) us,
-- from provider cost concentrating faster than we can notice.
--
-- Sizing, at the current 1.45x rate card:
--   500 BDT/day buys ~8,450 cheap-model chats or ~539 premium chats per day.
--   No human reaches that; a heavy manual day is 100-200 chats. So the cap is
--   roughly 3-10x any realistic human ceiling — invisible in normal use.
--   Meanwhile it bounds runaway damage at 500 BDT/day instead of the whole
--   balance (a Pro package is 2,600 BDT of credit).
--   Pro still burns down in a minimum of ~5 days, which is not a real
--   constraint since packages have no expiry.
--
-- Lower caps were rejected: 300/day starts to bite a genuinely heavy premium
-- user (324 chats/day). Higher caps stop bounding anything useful.
--
-- daily_spend_cap_bdt is nullable — NULL means "use the application default"
-- so the number can be tuned globally without a migration, and overridden per
-- user (set 0 to freeze an account's spending without deleting it).
--
-- WHY A FREE TIER, AND WHY 10 MESSAGES
--
-- Registered users get a small daily allowance on the cheapest model so they
-- can genuinely try the product before paying. True provider cost is ~0.041 BDT
-- per message, so 10/day is ~0.41 BDT/day, or ~12 BDT/month for someone who
-- uses it every single day (most will not). At 1,000 daily-active free users
-- that is ~12,000 BDT/month of customer-acquisition cost — real, but bounded
-- and adjustable from the admin screens if it runs hot.
--
-- Free usage is written to the SAME ledger with is_free = true, so it is
-- visible in reporting and can never be confused with paid usage.
--
-- Safe to run more than once.
-- ============================================================================

-- ─── 1. Per-user spend cap ──────────────────────────────────────────────────

alter table unreal_bs_users
  add column if not exists daily_spend_cap_bdt numeric(12,2);

alter table unreal_bs_users
  add column if not exists free_daily_messages integer;

do $$
begin
  if not exists (
    select 1 from information_schema.constraint_column_usage
    where constraint_name = 'unreal_bs_users_daily_cap_non_negative'
  ) then
    alter table unreal_bs_users
      add constraint unreal_bs_users_daily_cap_non_negative
      check (daily_spend_cap_bdt is null or daily_spend_cap_bdt >= 0);
  end if;
exception
  when others then raise notice 'daily cap check skipped: %', sqlerrm;
end $$;

do $$
begin
  if not exists (
    select 1 from information_schema.constraint_column_usage
    where constraint_name = 'unreal_bs_users_free_messages_non_negative'
  ) then
    alter table unreal_bs_users
      add constraint unreal_bs_users_free_messages_non_negative
      check (free_daily_messages is null or free_daily_messages >= 0);
  end if;
exception
  when others then raise notice 'free messages check skipped: %', sqlerrm;
end $$;

-- ─── 2. Mark which models the free tier may use ─────────────────────────────
-- Only the cheapest model, so the free tier's cost is predictable. Anything
-- else would let a free user consume premium-model cost at our expense.

alter table unreal_bs_ai_model_rates
  add column if not exists free_tier_eligible boolean not null default false;

update unreal_bs_ai_model_rates
   set free_tier_eligible = (model_id = 'gpt-4o-mini'),
       updated_at = now();

-- ─── 3. Flag free usage in the ledger ───────────────────────────────────────
-- Same table so free and paid usage report together, with a flag so they can
-- never be mistaken for one another.

alter table unreal_bs_ai_usage_ledger
  add column if not exists is_free boolean not null default false;

-- Supports the per-day aggregate the chat route runs before every request.
create index if not exists unreal_bs_ai_usage_ledger_user_created_idx
  on unreal_bs_ai_usage_ledger(user_id, created_at desc);

-- ─── 4. Log a free message without touching the wallet ──────────────────────
-- Mirrors unreal_bs_ai_debit_wallet's ledger shape so reporting is uniform,
-- but performs NO balance mutation: cost_bdt is 0 and the wallet is only read
-- to satisfy the ledger's NOT NULL wallet_id / balance_after_bdt.

create or replace function unreal_bs_ai_log_free_usage(
  p_user_id uuid,
  p_model_rate_id uuid,
  p_provider text,
  p_model_id text,
  p_input_tokens integer,
  p_output_tokens integer
) returns unreal_bs_ai_usage_ledger
language plpgsql
as $$
declare
  v_wallet unreal_bs_wallets;
  v_ledger unreal_bs_ai_usage_ledger;
begin
  select * into v_wallet from unreal_bs_wallets where user_id = p_user_id;

  if not found then
    insert into unreal_bs_wallets (user_id, balance_bdt)
    values (p_user_id, 0)
    on conflict (user_id) do nothing;

    select * into v_wallet from unreal_bs_wallets where user_id = p_user_id;
  end if;

  insert into unreal_bs_ai_usage_ledger (
    user_id, wallet_id, model_rate_id, provider, model_id,
    input_tokens, output_tokens, cost_bdt, balance_after_bdt, status, is_free
  ) values (
    p_user_id, v_wallet.id, p_model_rate_id, p_provider, p_model_id,
    p_input_tokens, p_output_tokens, 0, v_wallet.balance_bdt, 'completed', true
  ) returning * into v_ledger;

  return v_ledger;
end;
$$;
