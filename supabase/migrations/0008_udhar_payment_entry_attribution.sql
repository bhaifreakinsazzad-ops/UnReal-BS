-- ============================================================================
-- 0008 — Persist which invoice an Udhar Khata payment was made against.
--
-- WHY THIS EXISTS
--
-- unreal_bs_udhar_payments records only (contact_id, amount, paid_at). The
-- payment dialog in the UI is scoped to ONE specific invoice and shows the
-- payment applied to that invoice — but the invoice was thrown away before the
-- request was sent, because there was nowhere to store it.
--
-- On the next page load the client re-derived attribution from scratch with a
-- FIFO pass (oldest invoice first). So:
--
--   Karim owes BDT 1,000 from January and BDT 500 from June.
--   He pays the BDT 500. The merchant records it against the June invoice.
--   The screen looks correct.
--   On reload the BDT 500 has moved onto the January invoice, June shows
--   BDT 500 still outstanding, and the app offers a pre-composed WhatsApp
--   payment demand for money Karim already paid.
--
-- On a debt-tracking product for small merchants, the ledger IS the product,
-- and dunning a customer for a settled debt is the kind of error that loses
-- trust permanently.
--
-- entry_id is NULLABLE on purpose: every row written before this migration has
-- no recorded invoice. The application keeps the FIFO derivation ONLY for those
-- legacy rows and uses the stored entry_id for everything written from now on.
-- That avoids a backfill that would have to guess, and guessing is what caused
-- the bug.
--
-- Safe to run more than once.
-- ============================================================================

alter table unreal_bs_udhar_payments
  add column if not exists entry_id uuid
  references unreal_bs_udhar_entries(id) on delete cascade;

create index if not exists unreal_bs_udhar_payments_entry_id_idx
  on unreal_bs_udhar_payments(entry_id);

-- Supports the per-contact ledger query the shell runs on every load.
create index if not exists unreal_bs_udhar_payments_contact_id_idx
  on unreal_bs_udhar_payments(contact_id);

create index if not exists unreal_bs_udhar_entries_contact_id_idx
  on unreal_bs_udhar_entries(contact_id);

-- Amounts must be positive. Nothing in the API or the schema prevented a
-- negative "payment", which would silently inflate what a customer owes.
do $$
begin
  if not exists (
    select 1 from information_schema.constraint_column_usage
    where constraint_name = 'unreal_bs_udhar_payments_amount_positive'
  ) then
    alter table unreal_bs_udhar_payments
      add constraint unreal_bs_udhar_payments_amount_positive check (amount > 0);
  end if;
exception
  when others then raise notice 'udhar payment amount check skipped: %', sqlerrm;
end $$;

do $$
begin
  if not exists (
    select 1 from information_schema.constraint_column_usage
    where constraint_name = 'unreal_bs_udhar_entries_amount_positive'
  ) then
    alter table unreal_bs_udhar_entries
      add constraint unreal_bs_udhar_entries_amount_positive check (amount > 0);
  end if;
exception
  when others then raise notice 'udhar entry amount check skipped: %', sqlerrm;
end $$;
