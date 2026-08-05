-- Read-only evidence snapshot. Save results privately; do not publish customer data.
select
  now() at time zone 'utc' as captured_at_utc,
  (select count(*) from public.unreal_bs_users) as users,
  (select count(*) from public.unreal_bs_wallets) as wallets,
  (select coalesce(sum(balance_bdt), 0) from public.unreal_bs_wallets) as wallet_balance_bdt,
  (select count(*) from public.unreal_bs_wallet_ledger) as ledger_rows,
  (select coalesce(sum(amount_bdt), 0) from public.unreal_bs_wallet_ledger) as ledger_net_bdt,
  (select count(*) from public.unreal_bs_digital_products) as products,
  (select count(*) from public.unreal_bs_orders) as orders;

select lower(payment_method) as provider, lower(payer_reference) as normalized_reference, count(*) as duplicate_count
from public.unreal_bs_orders
where payer_reference is not null and btrim(payer_reference) <> ''
group by lower(payment_method), lower(payer_reference)
having count(*) > 1;

select p.proname, pg_get_function_identity_arguments(p.oid) as identity_arguments,
  p.prosecdef as security_definer, p.proconfig as fixed_configuration, p.proacl as access_control
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname like 'unreal_bs_%'
order by p.proname, identity_arguments;
