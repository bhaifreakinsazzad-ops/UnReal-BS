-- UNREAL BS pre-advertising launch hardening.
-- Additive/idempotent: no production column is renamed or dropped. Legacy raw
-- access-token values are irreversibly replaced with SHA-256 hashes.

create extension if not exists pgcrypto;

-- Existing RPCs are server-only boundaries. Supabase grants function execute
-- to PUBLIC by default, so explicitly remove browser/API-role access and pin
-- name resolution to trusted schemas.
alter function public.unreal_bs_ai_debit_wallet(uuid,uuid,text,text,integer,integer,numeric) set search_path = pg_catalog, public;
alter function public.unreal_bs_credit_wallet_generic(uuid,numeric,text,text,uuid,text) set search_path = pg_catalog, public;
alter function public.unreal_bs_debit_wallet_generic(uuid,numeric,text,text,uuid,text) set search_path = pg_catalog, public;
alter function public.unreal_bs_reveal_card_credential(uuid) set search_path = pg_catalog, public;
alter function public.unreal_bs_ai_log_free_usage(uuid,uuid,text,text,integer,integer) set search_path = pg_catalog, public;
alter function public.unreal_bs_ad_campaign_set_status(uuid,text,text) set search_path = pg_catalog, public;
alter function public.unreal_bs_product_set_status(uuid,text,text) set search_path = pg_catalog, public;
alter function public.unreal_bs_order_mark_paid(uuid,text,text,text) set search_path = pg_catalog, public;
alter function public.unreal_bs_order_refund(uuid,text) set search_path = pg_catalog, public;
alter function public.unreal_bs_payout_request_create(uuid,numeric,text,text,text) set search_path = pg_catalog, public;
alter function public.unreal_bs_payout_request_settle(uuid,text,text,text) set search_path = pg_catalog, public;

revoke all on function public.rls_auto_enable() from public, anon, authenticated;
revoke all on function public.unreal_bs_ai_debit_wallet(uuid,uuid,text,text,integer,integer,numeric) from public, anon, authenticated;
revoke all on function public.unreal_bs_credit_wallet_generic(uuid,numeric,text,text,uuid,text) from public, anon, authenticated;
revoke all on function public.unreal_bs_debit_wallet_generic(uuid,numeric,text,text,uuid,text) from public, anon, authenticated;
revoke all on function public.unreal_bs_reveal_card_credential(uuid) from public, anon, authenticated;
revoke all on function public.unreal_bs_ai_log_free_usage(uuid,uuid,text,text,integer,integer) from public, anon, authenticated;
revoke all on function public.unreal_bs_ad_campaign_set_status(uuid,text,text) from public, anon, authenticated;
revoke all on function public.unreal_bs_product_set_status(uuid,text,text) from public, anon, authenticated;
revoke all on function public.unreal_bs_order_mark_paid(uuid,text,text,text) from public, anon, authenticated;
revoke all on function public.unreal_bs_order_refund(uuid,text) from public, anon, authenticated;
revoke all on function public.unreal_bs_payout_request_create(uuid,numeric,text,text,text) from public, anon, authenticated;
revoke all on function public.unreal_bs_payout_request_settle(uuid,text,text,text) from public, anon, authenticated;

grant execute on function public.unreal_bs_ai_debit_wallet(uuid,uuid,text,text,integer,integer,numeric) to service_role;
grant execute on function public.unreal_bs_credit_wallet_generic(uuid,numeric,text,text,uuid,text) to service_role;
grant execute on function public.unreal_bs_debit_wallet_generic(uuid,numeric,text,text,uuid,text) to service_role;
grant execute on function public.unreal_bs_reveal_card_credential(uuid) to service_role;
grant execute on function public.unreal_bs_ai_log_free_usage(uuid,uuid,text,text,integer,integer) to service_role;
grant execute on function public.unreal_bs_ad_campaign_set_status(uuid,text,text) to service_role;
grant execute on function public.unreal_bs_product_set_status(uuid,text,text) to service_role;
grant execute on function public.unreal_bs_order_mark_paid(uuid,text,text,text) to service_role;
grant execute on function public.unreal_bs_order_refund(uuid,text) to service_role;
grant execute on function public.unreal_bs_payout_request_create(uuid,numeric,text,text,text) to service_role;
grant execute on function public.unreal_bs_payout_request_settle(uuid,text,text,text) to service_role;

create index if not exists unreal_bs_ai_model_rates_fallback_model_idx on public.unreal_bs_ai_model_rates(fallback_model_id);
create index if not exists unreal_bs_ai_usage_ledger_model_rate_idx on public.unreal_bs_ai_usage_ledger(model_rate_id);
create index if not exists unreal_bs_ai_usage_ledger_wallet_idx on public.unreal_bs_ai_usage_ledger(wallet_id);
create index if not exists unreal_bs_coming_soon_interest_user_idx on public.unreal_bs_coming_soon_interest(user_id);
create index if not exists unreal_bs_orders_buyer_user_idx on public.unreal_bs_orders(buyer_user_id);
create index if not exists unreal_bs_virtual_card_orders_card_idx on public.unreal_bs_virtual_card_orders(card_id);

alter table unreal_bs_digital_products add column if not exists platform_owned boolean not null default true;
update unreal_bs_digital_products set platform_owned = true where platform_owned is distinct from true;

alter table unreal_bs_orders add column if not exists access_token_hash text;
alter table unreal_bs_orders add column if not exists purchase_event_id text;
alter table unreal_bs_orders add column if not exists verification_submitted_at timestamptz;
alter table unreal_bs_orders add column if not exists confirmation_reason text;
alter table unreal_bs_orders add column if not exists rejection_reason text;
alter table unreal_bs_orders add column if not exists refund_reason text;
alter table unreal_bs_orders add column if not exists refund_reference text;
alter table unreal_bs_orders add column if not exists confirmed_by_email_hash text;
alter table unreal_bs_orders add column if not exists rejected_by_email_hash text;
alter table unreal_bs_orders add column if not exists refunded_by_email_hash text;
alter table unreal_bs_orders add column if not exists rejected_at timestamptz;
alter table unreal_bs_orders add column if not exists utm_source text;
alter table unreal_bs_orders add column if not exists utm_medium text;
alter table unreal_bs_orders add column if not exists utm_campaign text;
alter table unreal_bs_orders add column if not exists utm_content text;
alter table unreal_bs_orders add column if not exists utm_term text;
alter table unreal_bs_orders add column if not exists fbclid text;
alter table unreal_bs_orders add column if not exists landing_page text;
alter table unreal_bs_orders add column if not exists referrer text;
alter table unreal_bs_orders add column if not exists meta_event_id text;
alter table unreal_bs_orders add column if not exists marketing_consent boolean not null default false;
alter table unreal_bs_orders add column if not exists consent_version text;

update unreal_bs_orders
set access_token_hash = encode(digest(access_token::text, 'sha256'), 'hex')
where access_token is not null and access_token_hash is null;

alter table unreal_bs_orders alter column access_token drop default;
alter table unreal_bs_orders alter column access_token drop not null;
update unreal_bs_orders set access_token = null where access_token is not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'unreal_bs_orders'::regclass
      and conname = 'unreal_bs_orders_raw_access_token_absent'
  ) then
    alter table unreal_bs_orders
      add constraint unreal_bs_orders_raw_access_token_absent check (access_token is null) not valid;
    alter table unreal_bs_orders validate constraint unreal_bs_orders_raw_access_token_absent;
  end if;
end $$;

create unique index if not exists unreal_bs_orders_access_token_hash_key
  on unreal_bs_orders(access_token_hash) where access_token_hash is not null;
create unique index if not exists unreal_bs_orders_payment_reference_key
  on unreal_bs_orders(lower(payment_method), lower(payer_reference))
  where payer_reference is not null;
create unique index if not exists unreal_bs_orders_refund_reference_key
  on unreal_bs_orders(lower(refund_reference)) where refund_reference is not null;
create index if not exists unreal_bs_orders_verification_queue_idx
  on unreal_bs_orders(verification_submitted_at, created_at)
  where status = 'verification_submitted';

do $$
begin
  alter table unreal_bs_orders drop constraint if exists unreal_bs_orders_status_check;
  alter table unreal_bs_orders drop constraint if exists unreal_bs_orders_status_launch_check;
  alter table unreal_bs_orders add constraint unreal_bs_orders_status_launch_check
    check (status in ('pending_payment', 'awaiting_confirmation', 'verification_submitted', 'paid', 'rejected', 'refunded')) not valid;
end $$;

update unreal_bs_orders
set status = 'verification_submitted',
    verification_submitted_at = coalesce(verification_submitted_at, updated_at, created_at)
where status = 'awaiting_confirmation';

do $$
begin
  alter table unreal_bs_orders drop constraint if exists unreal_bs_orders_status_launch_check;
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'unreal_bs_orders'::regclass
      and conname = 'unreal_bs_orders_status_launch_check'
  ) then
    alter table unreal_bs_orders add constraint unreal_bs_orders_status_launch_check
      check (status in ('pending_payment', 'verification_submitted', 'paid', 'rejected', 'refunded'));
  end if;
end $$;

create table if not exists unreal_bs_operation_idempotency (
  id uuid primary key default gen_random_uuid(),
  idempotency_key text not null unique,
  operation text not null,
  target_id uuid not null,
  result_status text not null,
  created_at timestamptz not null default now()
);
alter table unreal_bs_operation_idempotency add column if not exists result_id uuid;
create index if not exists unreal_bs_operation_idempotency_target_idx
  on unreal_bs_operation_idempotency(target_id, created_at desc);

create table if not exists unreal_bs_audit_events (
  id bigint generated always as identity primary key,
  event_type text not null,
  actor_email_hash text,
  actor_user_id uuid references unreal_bs_users(id) on delete set null,
  target_type text,
  target_id text,
  request_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists unreal_bs_audit_events_type_time_idx
  on unreal_bs_audit_events(event_type, created_at desc);
create index if not exists unreal_bs_audit_events_actor_time_idx
  on unreal_bs_audit_events(actor_user_id, created_at desc)
  where actor_user_id is not null;

create or replace function unreal_bs_audit_events_append_only()
returns trigger language plpgsql set search_path = pg_catalog, public as $$
begin
  raise exception 'AUDIT_LOG_APPEND_ONLY' using errcode = '42501';
end;
$$;
drop trigger if exists unreal_bs_audit_events_no_update on unreal_bs_audit_events;
create trigger unreal_bs_audit_events_no_update
  before update or delete on unreal_bs_audit_events
  for each row execute function unreal_bs_audit_events_append_only();

create or replace function unreal_bs_order_mark_paid_v2(
  p_order_id uuid,
  p_method text,
  p_reference text,
  p_reason text,
  p_operator_email_hash text,
  p_idempotency_key text,
  p_expected_status text
) returns unreal_bs_orders
language plpgsql security definer set search_path = pg_catalog, public
as $$
declare
  v_order unreal_bs_orders;
  v_existing unreal_bs_operation_idempotency;
begin
  select * into v_existing from unreal_bs_operation_idempotency where idempotency_key = p_idempotency_key;
  if found then
    if v_existing.operation <> 'order.confirm' or v_existing.target_id <> p_order_id then
      raise exception 'IDEMPOTENCY_CONFLICT' using errcode = 'P0001';
    end if;
    select * into v_order from unreal_bs_orders where id = p_order_id;
    return v_order;
  end if;

  update unreal_bs_orders
  set status = 'paid', payment_method = coalesce(p_method, payment_method),
      payer_reference = coalesce(p_reference, payer_reference), confirmation_reason = p_reason,
      confirmed_by_email_hash = p_operator_email_hash, paid_at = now(), updated_at = now()
  where id = p_order_id and status = p_expected_status
    and p_expected_status in ('pending_payment', 'verification_submitted')
    and (price_bdt = 0 or payer_reference is not null)
  returning * into v_order;
  if not found then raise exception 'ORDER_NOT_PAYABLE_OR_STATUS_MISMATCH' using errcode = 'P0001'; end if;

  if v_order.seller_payout_bdt > 0 then
    perform unreal_bs_credit_wallet_generic(v_order.seller_id, v_order.seller_payout_bdt, 'product_sale', 'product_order', v_order.id, 'Sale: ' || v_order.product_title);
  end if;
  update unreal_bs_digital_products set sales_count = sales_count + 1, updated_at = now() where id = v_order.product_id;
  insert into unreal_bs_operation_idempotency(idempotency_key, operation, target_id, result_status)
  values (p_idempotency_key, 'order.confirm', p_order_id, 'paid');
  insert into unreal_bs_audit_events(event_type, actor_email_hash, target_type, target_id, metadata)
  values ('commerce.order.confirm', p_operator_email_hash, 'order', p_order_id::text, jsonb_build_object('reason', p_reason));
  return v_order;
end;
$$;

create or replace function unreal_bs_order_reject_v1(
  p_order_id uuid,
  p_reason text,
  p_operator_email_hash text,
  p_idempotency_key text,
  p_expected_status text
) returns unreal_bs_orders
language plpgsql security definer set search_path = pg_catalog, public
as $$
declare v_order unreal_bs_orders; v_existing unreal_bs_operation_idempotency;
begin
  select * into v_existing from unreal_bs_operation_idempotency where idempotency_key = p_idempotency_key;
  if found then
    if v_existing.operation <> 'order.reject' or v_existing.target_id <> p_order_id then raise exception 'IDEMPOTENCY_CONFLICT' using errcode = 'P0001'; end if;
    select * into v_order from unreal_bs_orders where id = p_order_id; return v_order;
  end if;
  update unreal_bs_orders set status = 'rejected', rejection_reason = p_reason,
    rejected_by_email_hash = p_operator_email_hash, rejected_at = now(), updated_at = now()
  where id = p_order_id and status = p_expected_status and p_expected_status in ('pending_payment', 'verification_submitted')
  returning * into v_order;
  if not found then raise exception 'ORDER_NOT_REJECTABLE_OR_STATUS_MISMATCH' using errcode = 'P0001'; end if;
  insert into unreal_bs_operation_idempotency(idempotency_key, operation, target_id, result_status)
  values (p_idempotency_key, 'order.reject', p_order_id, 'rejected');
  insert into unreal_bs_audit_events(event_type, actor_email_hash, target_type, target_id, metadata)
  values ('commerce.order.reject', p_operator_email_hash, 'order', p_order_id::text, jsonb_build_object('reason', p_reason));
  return v_order;
end;
$$;

create or replace function unreal_bs_order_refund_v2(
  p_order_id uuid,
  p_reason text,
  p_refund_reference text,
  p_operator_email_hash text,
  p_idempotency_key text,
  p_expected_status text
) returns unreal_bs_orders
language plpgsql security definer set search_path = pg_catalog, public
as $$
declare v_order unreal_bs_orders; v_existing unreal_bs_operation_idempotency;
begin
  select * into v_existing from unreal_bs_operation_idempotency where idempotency_key = p_idempotency_key;
  if found then
    if v_existing.operation <> 'order.refund' or v_existing.target_id <> p_order_id then raise exception 'IDEMPOTENCY_CONFLICT' using errcode = 'P0001'; end if;
    select * into v_order from unreal_bs_orders where id = p_order_id; return v_order;
  end if;
  update unreal_bs_orders set status = 'refunded', refund_reason = p_reason,
    refund_reference = p_refund_reference, refunded_by_email_hash = p_operator_email_hash,
    refunded_at = now(), updated_at = now()
  where id = p_order_id and status = p_expected_status and p_expected_status = 'paid'
  returning * into v_order;
  if not found then raise exception 'ORDER_NOT_REFUNDABLE_OR_STATUS_MISMATCH' using errcode = 'P0001'; end if;
  if v_order.seller_payout_bdt > 0 then
    perform unreal_bs_debit_wallet_generic(v_order.seller_id, v_order.seller_payout_bdt, 'product_sale_refund', 'product_order', v_order.id, 'Refunded: ' || v_order.product_title);
  end if;
  update unreal_bs_digital_products set sales_count = greatest(sales_count - 1, 0), updated_at = now() where id = v_order.product_id;
  insert into unreal_bs_operation_idempotency(idempotency_key, operation, target_id, result_status)
  values (p_idempotency_key, 'order.refund', p_order_id, 'refunded');
  insert into unreal_bs_audit_events(event_type, actor_email_hash, target_type, target_id, metadata)
  values ('commerce.order.refund', p_operator_email_hash, 'order', p_order_id::text, jsonb_build_object('reason', p_reason, 'refund_reference_hash', encode(digest(p_refund_reference, 'sha256'), 'hex')));
  return v_order;
end;
$$;

do $$
declare t text; policy_name text;
begin
  foreach t in array array[
    'unreal_bs_digital_products', 'unreal_bs_product_lessons', 'unreal_bs_product_assets',
    'unreal_bs_orders', 'unreal_bs_payout_requests', 'unreal_bs_operation_idempotency', 'unreal_bs_audit_events'
  ] loop
    execute format('alter table %I enable row level security', t);
    execute format('revoke all on table %I from anon, authenticated', t);
    for policy_name in select policyname from pg_policies where schemaname = 'public' and tablename = t loop
      execute format('drop policy if exists %I on %I', policy_name, t);
    end loop;
    execute format('create policy %I on %I for all to service_role using (true) with check (true)', t || '_service_role_all', t);
  end loop;
end $$;

revoke all on function unreal_bs_order_mark_paid_v2(uuid,text,text,text,text,text,text) from public, anon, authenticated;
revoke all on function unreal_bs_order_reject_v1(uuid,text,text,text,text) from public, anon, authenticated;
revoke all on function unreal_bs_order_refund_v2(uuid,text,text,text,text,text) from public, anon, authenticated;
grant execute on function unreal_bs_order_mark_paid_v2(uuid,text,text,text,text,text,text) to service_role;
grant execute on function unreal_bs_order_reject_v1(uuid,text,text,text,text) to service_role;
grant execute on function unreal_bs_order_refund_v2(uuid,text,text,text,text,text) to service_role;
revoke all on function unreal_bs_audit_events_append_only() from public, anon, authenticated;

create or replace function unreal_bs_assign_virtual_card_v2(
  p_order_id uuid,
  p_label text,
  p_card_brand text,
  p_last4 text,
  p_expiry_month integer,
  p_expiry_year integer,
  p_credential_encrypted text,
  p_charged_amount_bdt numeric,
  p_operator_email_hash text,
  p_idempotency_key text
) returns uuid
language plpgsql security definer set search_path = pg_catalog, public
as $$
declare
  v_order unreal_bs_virtual_card_orders;
  v_card_id uuid;
  v_existing unreal_bs_operation_idempotency;
begin
  select * into v_existing from unreal_bs_operation_idempotency where idempotency_key = p_idempotency_key;
  if found then
    if v_existing.operation <> 'virtual_card.assign' or v_existing.target_id <> p_order_id then
      raise exception 'IDEMPOTENCY_CONFLICT' using errcode = 'P0001';
    end if;
    return v_existing.result_id;
  end if;

  select * into v_order from unreal_bs_virtual_card_orders where id = p_order_id for update;
  if not found or v_order.status <> 'pending' then raise exception 'CARD_ORDER_NOT_PENDING' using errcode = 'P0001'; end if;

  perform unreal_bs_debit_wallet_generic(v_order.user_id, p_charged_amount_bdt, 'card_purchase', 'virtual_card_order', p_order_id, p_label);
  insert into unreal_bs_virtual_cards(
    label, card_brand, last4, expiry_month, expiry_year, status,
    assigned_user_id, assigned_order_id, credential_secret_encrypted
  ) values (
    p_label, p_card_brand, p_last4, p_expiry_month, p_expiry_year, 'assigned',
    v_order.user_id, p_order_id, p_credential_encrypted
  ) returning id into v_card_id;

  update unreal_bs_virtual_card_orders
  set status = 'fulfilled', card_id = v_card_id, charged_amount_bdt = p_charged_amount_bdt, fulfilled_at = now()
  where id = p_order_id;

  insert into unreal_bs_operation_idempotency(idempotency_key, operation, target_id, result_status, result_id)
  values (p_idempotency_key, 'virtual_card.assign', p_order_id, 'fulfilled', v_card_id);
  insert into unreal_bs_audit_events(event_type, actor_email_hash, target_type, target_id, metadata)
  values ('virtual_card.assign', p_operator_email_hash, 'virtual_card_order', p_order_id::text, jsonb_build_object('card_id', v_card_id, 'charged_amount_bdt', p_charged_amount_bdt));
  return v_card_id;
end;
$$;

revoke all on function unreal_bs_assign_virtual_card_v2(uuid,text,text,text,integer,integer,text,numeric,text,text) from public, anon, authenticated;
grant execute on function unreal_bs_assign_virtual_card_v2(uuid,text,text,text,integer,integer,text,numeric,text,text) to service_role;
