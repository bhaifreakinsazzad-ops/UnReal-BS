-- ============================================================================
-- 0013 — Digital products, courses, and the first real checkout
--
-- WHY ONE TABLE FOR EVERYTHING
--
-- A course, a downloadable ebook, a fixed-price service and a paid
-- consultation are the same object from the platform's point of view: a thing
-- with a price, a public page, an order, and a way to deliver it. Only the
-- delivery differs. Modelling them as one table with a `kind` discriminator
-- means checkout, commission, refunds, the buyer's access page and the admin
-- queue are written once and cannot drift apart between product types.
--
-- WHY THE COURSE ENGINE IS OURS AND NOT GHL'S
--
-- GoHighLevel's public API cannot create courses. Its Memberships API is a
-- single bulk-import endpoint with no CRUD for courses, modules or lessons —
-- so a course that lives in GHL cannot be edited or deleted by us afterwards.
-- The course engine is therefore ours, and GHL is used for the part its API
-- genuinely does well: every buyer becomes a tagged contact in the seller's
-- own sub-account, so the seller's existing follow-up automation fires.
--
-- WHY ORDERS ARE THEIR OWN TABLE
--
-- Every existing money path is keyed to unreal_bs_users(id). A buyer is not a
-- user — they arrive from a Facebook link with a phone number. Orders are the
-- first anonymous-purchase primitive in the schema. They deliberately do NOT
-- reuse unreal_bs_deposit_requests, which carries a one-pending-per-user
-- unique index that would cap a seller at a single pending sale platform-wide.
--
-- WHERE THE MONEY GOES
--
-- The buyer pays the PLATFORM's bKash/Nagad number. We confirm, keep the
-- commission, and credit the rest to the seller's existing wallet. That is the
-- only arrangement where commission is collected by construction rather than
-- invoiced to the seller and hoped for, and it reuses a wallet + ledger that
-- is already atomic and already reconcilable during a dispute.
--
-- Safe to run more than once.
-- ============================================================================

-- ─── Seller storefront identity ─────────────────────────────────────────────
-- A seller needs a public handle before they can have a public shop page.

alter table unreal_bs_users add column if not exists store_slug text;
alter table unreal_bs_users add column if not exists store_name text;
alter table unreal_bs_users add column if not exists store_bio text;

create unique index if not exists unreal_bs_users_store_slug_key
  on unreal_bs_users(store_slug)
  where store_slug is not null;

-- ─── Products ───────────────────────────────────────────────────────────────

create table if not exists unreal_bs_digital_products (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references unreal_bs_users(id) on delete cascade,

  kind text not null check (kind in ('course', 'download', 'service', 'consultation')),
  slug text not null,
  title text not null,
  subtitle text,
  description text,
  cover_image_url text,

  -- Whole taka in practice (the pricing module rounds), numeric for safety.
  -- Zero is allowed on purpose: a free ebook that builds a tagged contact list
  -- is the highest-leverage thing a small Bangladeshi seller can ship, and it
  -- runs through exactly the same order pipeline as a paid one.
  price_bdt numeric(12,2) not null default 0 check (price_bdt >= 0),
  compare_at_price_bdt numeric(12,2) check (compare_at_price_bdt is null or compare_at_price_bdt >= 0),

  -- For 'service' / 'consultation': how the buyer reaches the seller after
  -- paying. Delivery for these kinds is a conversation, not a file.
  delivery_note text,
  contact_whatsapp text,

  status text not null default 'draft' check (status in (
    'draft', 'pending_review', 'published', 'unpublished', 'rejected'
  )),
  review_note text,

  sales_count integer not null default 0 check (sales_count >= 0),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists unreal_bs_digital_products_slug_key
  on unreal_bs_digital_products(slug);

create index if not exists unreal_bs_digital_products_seller_idx
  on unreal_bs_digital_products(seller_id, created_at desc);

create index if not exists unreal_bs_digital_products_published_idx
  on unreal_bs_digital_products(status, published_at desc)
  where status = 'published';

-- ─── Course curriculum ──────────────────────────────────────────────────────
-- Video is an embed URL, never an upload. Hosting video would cost more than
-- the platform earns and would be slower on Bangladeshi mobile data than
-- YouTube, which is already CDN-cached in-country.

create table if not exists unreal_bs_product_lessons (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references unreal_bs_digital_products(id) on delete cascade,

  module_title text,
  title text not null,
  video_url text,
  video_provider text check (video_provider is null or video_provider in ('youtube', 'vimeo')),
  duration_minutes integer check (duration_minutes is null or duration_minutes >= 0),
  content_md text,
  resource_url text,

  position integer not null default 0,
  -- One free lesson is the single biggest conversion lever a course has: it
  -- lets a stranger judge the teaching before paying.
  is_preview boolean not null default false,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists unreal_bs_product_lessons_product_idx
  on unreal_bs_product_lessons(product_id, position);

-- ─── Downloadable files ─────────────────────────────────────────────────────
-- Only the storage path is kept. The bucket is private and every download is
-- served as a short-lived signed URL after the order is checked, so a leaked
-- row is not a leaked file.

create table if not exists unreal_bs_product_assets (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references unreal_bs_digital_products(id) on delete cascade,

  storage_path text not null,
  file_name text not null,
  size_bytes bigint check (size_bytes is null or size_bytes >= 0),
  mime_type text,
  position integer not null default 0,

  created_at timestamptz not null default now()
);

create index if not exists unreal_bs_product_assets_product_idx
  on unreal_bs_product_assets(product_id, position);

-- ─── Orders ─────────────────────────────────────────────────────────────────

create table if not exists unreal_bs_orders (
  id uuid primary key default gen_random_uuid(),

  -- restrict, not cascade: a product with paid orders must not be deletable,
  -- because deleting it would silently revoke access somebody paid for. The
  -- API turns delete into unpublish when orders exist.
  product_id uuid not null references unreal_bs_digital_products(id) on delete restrict,
  seller_id uuid not null references unreal_bs_users(id) on delete cascade,

  -- Snapshots. An order is a receipt: renaming or repricing the product later
  -- must never rewrite what somebody actually bought.
  product_title text not null,
  product_kind text not null,

  -- Nullable: most buyers arrive from a shared Facebook/WhatsApp link and
  -- never create an account. Phone is the required identity because in
  -- Bangladesh everyone has one and not everyone has email.
  buyer_user_id uuid references unreal_bs_users(id) on delete set null,
  buyer_name text not null,
  buyer_phone text not null,
  buyer_email text,

  -- The buyer's only credential. Unguessable, so the access link can be sent
  -- over SMS/WhatsApp without an account or a password.
  access_token uuid not null default gen_random_uuid(),

  price_bdt numeric(12,2) not null check (price_bdt >= 0),
  commission_bdt numeric(12,2) not null default 0 check (commission_bdt >= 0),
  seller_payout_bdt numeric(12,2) not null default 0 check (seller_payout_bdt >= 0),

  status text not null default 'pending_payment' check (status in (
    'pending_payment', 'awaiting_confirmation', 'paid', 'rejected', 'refunded'
  )),

  payment_method text,
  payer_reference text,   -- bKash / Nagad TrxID
  payer_msisdn text,      -- the number the buyer sent from

  -- Reserved for a real gateway (SSLCommerz / aamarPay). Present now so
  -- switching is a code change behind lib/commerce/payment-provider.ts with no
  -- migration and no UI rework — the same approach taken for Meta ads.
  gateway_provider text,
  gateway_ref text,

  ghl_contact_id text,
  ghl_synced_at timestamptz,

  admin_note text,
  paid_at timestamptz,
  refunded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Money must add up on every row, at write time, for every path.
  constraint unreal_bs_orders_split_adds_up
    check (commission_bdt + seller_payout_bdt = price_bdt)
);

create unique index if not exists unreal_bs_orders_access_token_key
  on unreal_bs_orders(access_token);

create index if not exists unreal_bs_orders_seller_idx
  on unreal_bs_orders(seller_id, created_at desc);

create index if not exists unreal_bs_orders_product_idx
  on unreal_bs_orders(product_id, created_at desc);

-- The admin confirmation queue.
create index if not exists unreal_bs_orders_awaiting_idx
  on unreal_bs_orders(created_at)
  where status = 'awaiting_confirmation';

-- ─── Seller payouts ─────────────────────────────────────────────────────────
-- Selling without being able to take the money out is not a feature.
--
-- The wallet is debited when the request is CREATED, not when it is settled.
-- That way the balance guard inside the debit RPC does the reservation, and a
-- seller cannot request a payout and then spend the same taka on AI credit
-- before the operator gets to it.

create table if not exists unreal_bs_payout_requests (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references unreal_bs_users(id) on delete cascade,

  amount_bdt numeric(12,2) not null check (amount_bdt > 0),
  method text not null check (method in ('bkash', 'nagad', 'rocket', 'bank')),
  account_number text not null,
  account_name text,

  status text not null default 'pending' check (status in ('pending', 'paid', 'rejected')),
  admin_note text,
  operator_reference text,

  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists unreal_bs_payout_requests_seller_idx
  on unreal_bs_payout_requests(seller_id, created_at desc);

create index if not exists unreal_bs_payout_requests_pending_idx
  on unreal_bs_payout_requests(created_at)
  where status = 'pending';

-- ============================================================================
-- Functions
-- ============================================================================

-- ─── Product status transitions ─────────────────────────────────────────────
-- Enforced in the database so it holds no matter which route calls it.

create or replace function unreal_bs_product_set_status(
  p_product_id uuid,
  p_status text,
  p_note text default null
) returns unreal_bs_digital_products
language plpgsql
as $$
declare
  v_product unreal_bs_digital_products;
  v_allowed text[];
begin
  select * into v_product from unreal_bs_digital_products where id = p_product_id for update;
  if not found then
    raise exception 'PRODUCT_NOT_FOUND' using errcode = 'P0001';
  end if;

  -- 'rejected' is reachable from anything live because it is also how the
  -- operator takes something down WITH A REASON. A plain unpublish looks
  -- identical to the seller doing it themselves, which is the wrong signal
  -- when the product broke a rule.
  v_allowed := case v_product.status
    when 'draft'          then array['pending_review', 'published']
    when 'pending_review' then array['published', 'rejected', 'draft']
    when 'published'      then array['unpublished', 'rejected']
    when 'unpublished'    then array['published', 'draft', 'rejected']
    when 'rejected'       then array['draft', 'pending_review']
    else array[]::text[]
  end;

  if not (p_status = any(v_allowed)) then
    raise exception 'INVALID_TRANSITION' using errcode = 'P0001';
  end if;

  update unreal_bs_digital_products
     set status = p_status,
         review_note = case when p_status = 'rejected' then p_note else review_note end,
         published_at = case
           when p_status = 'published' and published_at is null then now()
           else published_at
         end,
         updated_at = now()
   where id = p_product_id
  returning * into v_product;

  return v_product;
end;
$$;

-- ─── Confirm a sale ─────────────────────────────────────────────────────────
-- The ONLY function that moves sale money.
--
-- The guard lives inside the UPDATE predicate rather than in a preceding
-- SELECT: two operators clicking "Confirm" at the same moment both run this,
-- but only one UPDATE can match a row that is not yet paid. The loser finds no
-- row and raises, so the seller can never be credited twice for one order.

create or replace function unreal_bs_order_mark_paid(
  p_order_id uuid,
  p_method text default null,
  p_reference text default null,
  p_note text default null
) returns unreal_bs_orders
language plpgsql
as $$
declare
  v_order unreal_bs_orders;
begin
  update unreal_bs_orders
     set status = 'paid',
         payment_method = coalesce(p_method, payment_method),
         payer_reference = coalesce(p_reference, payer_reference),
         admin_note = coalesce(p_note, admin_note),
         paid_at = now(),
         updated_at = now()
   where id = p_order_id
     and status in ('pending_payment', 'awaiting_confirmation')
  returning * into v_order;

  if not found then
    raise exception 'ORDER_NOT_PAYABLE' using errcode = 'P0001';
  end if;

  -- Free products still produce an order (and a GHL contact), they just move
  -- no money.
  if v_order.seller_payout_bdt > 0 then
    perform unreal_bs_credit_wallet_generic(
      v_order.seller_id,
      v_order.seller_payout_bdt,
      'product_sale',
      'product_order',
      v_order.id,
      'Sale: ' || v_order.product_title
    );
  end if;

  update unreal_bs_digital_products
     set sales_count = sales_count + 1,
         updated_at = now()
   where id = v_order.product_id;

  return v_order;
end;
$$;

-- ─── Refund a sale ──────────────────────────────────────────────────────────
-- If the seller has already withdrawn the money the debit raises
-- INSUFFICIENT_BALANCE and the WHOLE transaction rolls back, including the
-- status change. That is deliberate: an order must never show as refunded
-- when the money was not actually clawed back. The route surfaces this to the
-- operator so it can be settled by hand.

create or replace function unreal_bs_order_refund(
  p_order_id uuid,
  p_note text default null
) returns unreal_bs_orders
language plpgsql
as $$
declare
  v_order unreal_bs_orders;
begin
  update unreal_bs_orders
     set status = 'refunded',
         admin_note = coalesce(p_note, admin_note),
         refunded_at = now(),
         updated_at = now()
   where id = p_order_id
     and status = 'paid'
  returning * into v_order;

  if not found then
    raise exception 'ORDER_NOT_REFUNDABLE' using errcode = 'P0001';
  end if;

  if v_order.seller_payout_bdt > 0 then
    perform unreal_bs_debit_wallet_generic(
      v_order.seller_id,
      v_order.seller_payout_bdt,
      'product_sale_refund',
      'product_order',
      v_order.id,
      'Refunded: ' || v_order.product_title
    );
  end if;

  update unreal_bs_digital_products
     set sales_count = greatest(sales_count - 1, 0),
         updated_at = now()
   where id = v_order.product_id;

  return v_order;
end;
$$;

-- ─── Payout requested (money leaves the wallet now) ─────────────────────────

create or replace function unreal_bs_payout_request_create(
  p_seller_id uuid,
  p_amount_bdt numeric,
  p_method text,
  p_account_number text,
  p_account_name text default null
) returns unreal_bs_payout_requests
language plpgsql
as $$
declare
  v_request unreal_bs_payout_requests;
begin
  insert into unreal_bs_payout_requests (
    seller_id, amount_bdt, method, account_number, account_name
  ) values (
    p_seller_id, p_amount_bdt, p_method, p_account_number, p_account_name
  ) returning * into v_request;

  -- Raises INSUFFICIENT_BALANCE and rolls the request back if the seller does
  -- not actually have the money. The balance guard is inside the debit's own
  -- UPDATE predicate, so this is race-safe against a concurrent AI spend.
  perform unreal_bs_debit_wallet_generic(
    p_seller_id,
    p_amount_bdt,
    'payout_request',
    'payout_request',
    v_request.id,
    'Payout requested to ' || p_method || ' ' || p_account_number
  );

  return v_request;
end;
$$;

-- ─── Payout settled ─────────────────────────────────────────────────────────
-- 'paid'    the operator has sent the money; the wallet was already debited at
--           request time, so there is nothing left to move.
-- 'rejected' the money goes back to the seller.

create or replace function unreal_bs_payout_request_settle(
  p_request_id uuid,
  p_status text,
  p_note text default null,
  p_reference text default null
) returns unreal_bs_payout_requests
language plpgsql
as $$
declare
  v_request unreal_bs_payout_requests;
begin
  if p_status not in ('paid', 'rejected') then
    raise exception 'INVALID_TRANSITION' using errcode = 'P0001';
  end if;

  update unreal_bs_payout_requests
     set status = p_status,
         admin_note = coalesce(p_note, admin_note),
         operator_reference = coalesce(p_reference, operator_reference),
         paid_at = case when p_status = 'paid' then now() else paid_at end,
         updated_at = now()
   where id = p_request_id
     and status = 'pending'
  returning * into v_request;

  if not found then
    raise exception 'PAYOUT_NOT_PENDING' using errcode = 'P0001';
  end if;

  if p_status = 'rejected' then
    perform unreal_bs_credit_wallet_generic(
      v_request.seller_id,
      v_request.amount_bdt,
      'payout_rejected',
      'payout_request',
      v_request.id,
      'Payout request returned'
    );
  end if;

  return v_request;
end;
$$;

-- ============================================================================
-- RLS — consistent with the rest of the schema: service-role only, with
-- per-user scoping enforced in route code.
-- ============================================================================

do $$
declare
  t text;
begin
  foreach t in array array[
    'unreal_bs_digital_products',
    'unreal_bs_product_lessons',
    'unreal_bs_product_assets',
    'unreal_bs_orders',
    'unreal_bs_payout_requests'
  ] loop
    execute format('alter table %I enable row level security', t);
    if not exists (
      select 1 from pg_policies where tablename = t and policyname = t || '_service_all'
    ) then
      execute format(
        'create policy %I on %I for all using (true) with check (true)',
        t || '_service_all', t
      );
    end if;
  end loop;
end $$;

-- ============================================================================
-- Storage — private bucket for downloadable products.
--
-- Private on purpose: every download is served through a route handler that
-- checks the order first and then issues a 60-second signed URL. There is no
-- anon key in this project, so uploads and signing both go through the
-- service-role client server-side.
-- ============================================================================

insert into storage.buckets (id, name, public, file_size_limit)
values ('product-files', 'product-files', false, 52428800)
on conflict (id) do nothing;
