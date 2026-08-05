-- ============================================================================
-- 0014 — Reject non-positive amounts in the generic wallet functions
--
-- Both functions currently accept any numeric. A negative amount passed to
-- unreal_bs_debit_wallet_generic silently becomes a CREDIT (balance - -100),
-- and it sails past the balance guard because `balance_bdt >= -100` is true
-- for every balance. The mirror image is true of the credit function.
--
-- Nothing exploits this today — every call site passes a computed positive
-- number — but 0013 adds paths where the amount originates from an order the
-- public created, and "no caller currently passes a negative" is not a
-- property worth betting the ledger on. The invariant belongs in the function.
--
-- These bodies are otherwise identical to 0004; only the guard is new.
--
-- Safe to run more than once.
-- ============================================================================

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
  if p_amount_bdt is null or p_amount_bdt <= 0 then
    raise exception 'INVALID_AMOUNT' using errcode = 'P0001';
  end if;

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
  if p_amount_bdt is null or p_amount_bdt <= 0 then
    raise exception 'INVALID_AMOUNT' using errcode = 'P0001';
  end if;

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
