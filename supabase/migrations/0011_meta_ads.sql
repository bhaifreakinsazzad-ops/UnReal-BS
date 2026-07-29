-- ============================================================================
-- 0011 — Meta (Facebook / Instagram) advertising
--
-- HOW THIS SHIPS, AND WHY IT IS BUILT THIS WAY
--
-- Publishing directly through Meta's Marketing API is gated on things we cannot
-- code around:
--   • the `ads_management` permission requires Meta App Review
--   • managing a CUSTOMER's ad account (not our own) requires Advanced Access
--   • the business entity must pass Meta Business Verification
--   • each user must OAuth their own Facebook account and ad account
--   • the ad spend itself is charged to the user's own Meta payment method
--
-- None of that completes on a launch timeline. So the campaign is modelled once
-- and fulfilled one of two ways, recorded in fulfilment_mode:
--
--   'managed'  the operator runs the campaign in Meta Ads Manager on the
--              customer's behalf. Works from day one. This is also how most
--              Bangladeshi agencies already operate, so it matches the market.
--   'api'      published straight through the Marketing API. The columns are
--              here now (meta_*_id) so the switch is a code change behind
--              lib/meta/, with no schema migration and no UI rework.
--
-- The customer-facing flow is identical either way. What changes is who
-- presses the button — and the status column tells the truth about it.
--
-- Safe to run more than once.
-- ============================================================================

create table if not exists unreal_bs_ad_campaigns (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references unreal_bs_users(id) on delete cascade,

  name text not null,
  -- Mirrors Meta's objective taxonomy so a managed campaign maps 1:1 onto what
  -- the operator selects in Ads Manager, and onto the API later.
  objective text not null check (objective in (
    'awareness', 'traffic', 'engagement', 'leads', 'sales', 'messages'
  )),
  platforms text[] not null default array['facebook'],

  -- Budget is what the CUSTOMER pays Meta for reach. It is deliberately NOT
  -- taken from the UnReal BS wallet: ad spend sits on the customer's own Meta
  -- payment method (or is settled with the operator for managed campaigns), and
  -- conflating the two would make the wallet ledger unreconcilable.
  daily_budget_bdt numeric(12,2) not null check (daily_budget_bdt > 0),
  duration_days integer not null check (duration_days between 1 and 365),

  -- Targeting, kept in the vocabulary a shop owner actually uses.
  audience_location text not null,
  audience_age_min integer not null default 18 check (audience_age_min >= 13),
  audience_age_max integer not null default 65 check (audience_age_max <= 65),
  audience_gender text not null default 'all' check (audience_gender in ('all', 'male', 'female')),
  audience_interests text,

  -- Creative
  headline text not null,
  primary_text text not null,
  call_to_action text not null default 'LEARN_MORE',
  destination_url text,
  whatsapp_number text,
  creative_image_url text,

  status text not null default 'draft' check (status in (
    'draft', 'submitted', 'in_review', 'scheduled', 'live',
    'paused', 'completed', 'rejected', 'cancelled'
  )),
  fulfilment_mode text not null default 'managed' check (fulfilment_mode in ('managed', 'api')),

  -- Populated only when a campaign is actually published through the Marketing
  -- API. Null on every managed campaign, which is how reporting tells them apart.
  meta_campaign_id text,
  meta_adset_id text,
  meta_ad_id text,

  -- What WE charge to set up and run it. Separate from ad spend.
  service_fee_bdt numeric(12,2) not null default 0 check (service_fee_bdt >= 0),

  -- Results. Written by the operator for managed campaigns, by the API later.
  -- Nullable on purpose: null means "not reported yet", which must never render
  -- as a zero, or a user reads "0 clicks" as a failed campaign.
  reported_reach integer,
  reported_impressions integer,
  reported_clicks integer,
  reported_spend_bdt numeric(12,2),
  results_updated_at timestamptz,

  rejection_reason text,
  operator_note text,

  submitted_at timestamptz,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint unreal_bs_ad_campaigns_age_range check (audience_age_min <= audience_age_max),
  -- Every objective needs somewhere for the click to land.
  constraint unreal_bs_ad_campaigns_destination check (
    destination_url is not null or whatsapp_number is not null or objective = 'awareness'
  )
);

create index if not exists unreal_bs_ad_campaigns_user_id_idx
  on unreal_bs_ad_campaigns(user_id, created_at desc);

create index if not exists unreal_bs_ad_campaigns_status_idx
  on unreal_bs_ad_campaigns(status)
  where status in ('submitted', 'in_review', 'live');

-- ─── Status transitions, enforced in one place ──────────────────────────────
-- A campaign that is already live must not be silently rewound to draft, and a
-- rejected one must not jump to live without going back through review. Doing
-- this in the database means it holds regardless of which route calls it.

create or replace function unreal_bs_ad_campaign_set_status(
  p_campaign_id uuid,
  p_status text,
  p_note text default null
) returns unreal_bs_ad_campaigns
language plpgsql
as $$
declare
  v_campaign unreal_bs_ad_campaigns;
  v_allowed text[];
begin
  select * into v_campaign from unreal_bs_ad_campaigns where id = p_campaign_id for update;
  if not found then
    raise exception 'CAMPAIGN_NOT_FOUND' using errcode = 'P0001';
  end if;

  v_allowed := case v_campaign.status
    when 'draft'     then array['submitted', 'cancelled']
    when 'submitted' then array['in_review', 'rejected', 'cancelled']
    when 'in_review' then array['scheduled', 'live', 'rejected', 'cancelled']
    when 'scheduled' then array['live', 'cancelled', 'paused']
    when 'live'      then array['paused', 'completed', 'cancelled']
    when 'paused'    then array['live', 'completed', 'cancelled']
    else array[]::text[]
  end;

  if not (p_status = any(v_allowed)) then
    raise exception 'INVALID_TRANSITION' using errcode = 'P0001';
  end if;

  update unreal_bs_ad_campaigns
     set status = p_status,
         operator_note = coalesce(p_note, operator_note),
         rejection_reason = case when p_status = 'rejected' then p_note else rejection_reason end,
         submitted_at = case when p_status = 'submitted' then now() else submitted_at end,
         published_at = case when p_status = 'live' and published_at is null then now() else published_at end,
         updated_at = now()
   where id = p_campaign_id
  returning * into v_campaign;

  return v_campaign;
end;
$$;

-- ─── RLS (consistent with the rest of the schema) ───────────────────────────

alter table unreal_bs_ad_campaigns enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'unreal_bs_ad_campaigns' and policyname = 'unreal_bs_ad_campaigns_service_all'
  ) then
    create policy unreal_bs_ad_campaigns_service_all
      on unreal_bs_ad_campaigns for all using (true) with check (true);
  end if;
end $$;
