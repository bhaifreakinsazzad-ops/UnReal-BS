-- ============================================================================
-- 0012 — Charge and refund the managed-ads service fee
--
-- The fee for RUNNING a campaign is taken from the UnReal BS wallet, because
-- that path is already atomic, already writes a ledger row, and the customer
-- already has a balance there. Ad SPEND still never touches the wallet — that
-- settles with the operator or on the customer's own Meta payment method.
--
-- Two timestamps rather than a status enum: they answer "was this charged?"
-- and "was it given back?" without a state machine, and they make the ledger
-- reconcilable by eye during a dispute.
--
-- Fee is charged when the customer submits, and refunded in full if we reject
-- the campaign. Rejecting a campaign we were paid to run and keeping the money
-- would be indefensible, and doing the refund by hand would eventually be
-- forgotten.
--
-- Safe to run more than once.
-- ============================================================================

alter table unreal_bs_ad_campaigns
  add column if not exists service_fee_charged_at timestamptz;

alter table unreal_bs_ad_campaigns
  add column if not exists service_fee_refunded_at timestamptz;

-- Finds campaigns that were charged and later rejected/cancelled without the
-- fee being returned — i.e. money we owe back. Should always be empty; if it
-- is not, something bypassed the refund path.
create index if not exists unreal_bs_ad_campaigns_fee_owed_idx
  on unreal_bs_ad_campaigns(user_id)
  where service_fee_charged_at is not null
    and service_fee_refunded_at is null
    and status in ('rejected', 'cancelled');
