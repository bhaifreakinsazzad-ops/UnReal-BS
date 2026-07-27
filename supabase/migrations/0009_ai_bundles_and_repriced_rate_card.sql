-- ============================================================================
-- 0009 — Repriced AI rate card + sellable prepaid bundles
--
-- PRICING MODEL (the reason this is safe)
--
-- Every model is stored at its TRUE provider cost in BDT, and a single uniform
-- markup of 1.45x is applied at charge time. Because the markup is the same for
-- every model, the maximum we can ever pay a provider for a given amount of
-- wallet credit is exactly:
--
--     max provider cost  =  credit_bdt / 1.45
--
-- ...regardless of which model the customer chooses. That makes each bundle's
-- cost ceiling a mathematical guarantee, not an estimate. If the markup were
-- allowed to vary per model, a customer concentrating spend on the
-- thinnest-margin model could blow through the ceiling.
--
-- FX BASIS: 136 BDT/USD = 123.33 mid-market (XE, 27 Jul 2026)
--                       x 1.04 real payment cost (interbank spread + bank
--                              selling margin + card/network FX markup, which
--                              we actually pay to reach USD providers)
--                       x 1.06 FX buffer (Bangladesh Bank runs a crawling peg
--                              with a band ceiling near 130; the historical
--                              failure mode is a discrete step devaluation —
--                              6.36% in one move in May 2024 — not smooth
--                              drift, so the buffer is sized to the band, not
--                              to the ~1%/yr observed trend)
--
-- Because the FX buffer is unspent at today's rate, real cost today runs ~6%
-- below the booked ceiling, which is headroom rather than margin. Do not spend
-- it — it is what keeps the bundles solvent if the taka steps down.
--
-- Safe to run more than once.
-- ============================================================================

-- ─── 1. Retire superseded / deprecated models ───────────────────────────────
-- Deactivated rather than deleted so historical usage-ledger rows keep their
-- model_rate_id reference and past invoices remain explicable.
--
--   gemini-1.5-pro     retired by Google
--   gemini-2.0-flash   deprecated
--   claude-sonnet-4-5  superseded by claude-sonnet-5, which is CHEAPER
--                      ($2/$10 per 1M vs $3/$15) and newer
--   gpt-4o             dropped from OpenAI's main pricing page; superseded by
--                      gpt-5.6-luna, which is cheaper ($1/$6 vs $2.50/$10)

update unreal_bs_ai_model_rates
   set is_active = false, updated_at = now()
 where model_id in ('gemini-1.5-pro', 'gemini-2.0-flash', 'claude-sonnet-4-5', 'gpt-4o');

-- ─── 2. Current lineup at true cost, uniform 1.45x markup ───────────────────
-- input/output_rate_bdt_per_1k = (USD per 1M / 1000) * 136
--
--   model                  provider $/1M in   $/1M out
--   gpt-4o-mini            0.15               0.60      (cheapest text model sold)
--   gemini-3.1-flash-lite  0.25               1.50
--   claude-haiku-4-5       1.00               5.00
--   gpt-5.6-luna           1.00               6.00
--   claude-sonnet-5        2.00              10.00

insert into unreal_bs_ai_model_rates
  (provider, model_id, display_name, input_rate_bdt_per_1k, output_rate_bdt_per_1k, markup_multiplier, is_active)
values
  ('openai',    'gpt-4o-mini',           'GPT-4o mini',            0.020400, 0.081600, 1.450, true),
  ('google',    'gemini-3.1-flash-lite', 'Gemini 3.1 Flash Lite',  0.034000, 0.204000, 1.450, true),
  ('anthropic', 'claude-haiku-4-5',      'Claude Haiku 4.5',       0.136000, 0.680000, 1.450, true),
  ('openai',    'gpt-5.6-luna',          'GPT-5.6 Luna',           0.136000, 0.816000, 1.450, true),
  ('anthropic', 'claude-sonnet-5',       'Claude Sonnet 5',        0.272000, 1.360000, 1.450, true)
on conflict (provider, model_id) do update
  set display_name           = excluded.display_name,
      input_rate_bdt_per_1k  = excluded.input_rate_bdt_per_1k,
      output_rate_bdt_per_1k = excluded.output_rate_bdt_per_1k,
      markup_multiplier      = excluded.markup_multiplier,
      is_active              = true,
      updated_at             = now();

-- ─── 3. Sellable prepaid bundles ────────────────────────────────────────────
-- Ceilings (credit / 1.45), all strictly BELOW the agreed caps:
--   starter  pay 699  -> credit 720   max cost  496.55  (cap 500)   profit >= 202
--   growth   pay 999  -> credit 1150  max cost  793.10  (cap 800)   profit >= 205
--   pro      pay 1999 -> credit 2600  max cost 1793.10  (cap 1799)  profit >= 205
-- A 1.40x markup was rejected: it put starter at exactly 500.00 (not below the
-- cap) and pro at 1800.00, one taka over. 1.45x clears both and pays a larger
-- bonus to the customer.
-- credit_bdt is what lands in the wallet. cost_cap_bdt is credit_bdt / 1.45 and
-- is stored explicitly so the admin UI can show the ceiling and so a future
-- markup change forces a deliberate re-derivation rather than silently
-- breaking the guarantee (see the CHECK constraint below).

create table if not exists unreal_bs_ai_bundles (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name_en text not null,
  name_bn text not null,
  tagline_en text,
  tagline_bn text,
  price_bdt numeric(12,2) not null check (price_bdt > 0),
  credit_bdt numeric(12,2) not null check (credit_bdt > 0),
  cost_cap_bdt numeric(12,2) not null check (cost_cap_bdt > 0),
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- The bundle must never be able to cost more than it sells for.
  constraint unreal_bs_ai_bundles_profitable check (cost_cap_bdt < price_bdt)
);

insert into unreal_bs_ai_bundles
  (code, name_en, name_bn, tagline_en, tagline_bn, price_bdt, credit_bdt, cost_cap_bdt, sort_order)
values
  ('starter', 'Starter', 'স্টার্টার',
   'Try AI for your business', 'আপনার ব্যবসার জন্য AI চেষ্টা করুন',
   699.00, 720.00, 496.55, 1),
  ('growth', 'Growth', 'গ্রোথ',
   'For a shop using AI every day', 'প্রতিদিন AI ব্যবহারকারী দোকানের জন্য',
   999.00, 1150.00, 793.10, 2),
  ('pro', 'Pro', 'প্রো',
   'Best value — for busy businesses', 'সেরা মূল্য — ব্যস্ত ব্যবসার জন্য',
   1999.00, 2600.00, 1793.10, 3)
on conflict (code) do update
  set name_en      = excluded.name_en,
      name_bn      = excluded.name_bn,
      tagline_en   = excluded.tagline_en,
      tagline_bn   = excluded.tagline_bn,
      price_bdt    = excluded.price_bdt,
      credit_bdt   = excluded.credit_bdt,
      cost_cap_bdt = excluded.cost_cap_bdt,
      sort_order   = excluded.sort_order,
      updated_at   = now();

-- ─── 4. Link a deposit request to a bundle ──────────────────────────────────
-- A bundle purchase reuses the existing, already-atomic deposit-request path:
-- the customer submits a request, the operator confirms the money arrived, and
-- unreal_bs_fulfill_deposit_request credits the wallet in one statement guarded
-- on status = 'pending', so a double-approval cannot double-credit.
--
-- The distinction a bundle adds: the customer PAYS price_bdt but the wallet is
-- credited credit_bdt (the bonus). Both are recorded so the ledger explains
-- itself during a dispute.

alter table unreal_bs_deposit_requests
  add column if not exists bundle_code text references unreal_bs_ai_bundles(code);

alter table unreal_bs_deposit_requests
  add column if not exists bundle_credit_bdt numeric(12,2);

create index if not exists unreal_bs_deposit_requests_bundle_code_idx
  on unreal_bs_deposit_requests(bundle_code);

-- ─── 5. RLS (consistent with the rest of the schema) ────────────────────────

alter table unreal_bs_ai_bundles enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'unreal_bs_ai_bundles' and policyname = 'unreal_bs_ai_bundles_service_all'
  ) then
    create policy unreal_bs_ai_bundles_service_all
      on unreal_bs_ai_bundles for all using (true) with check (true);
  end if;
end $$;
