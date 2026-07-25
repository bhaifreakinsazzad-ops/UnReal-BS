-- 0005_fix_reveal_card_credential_returning_bug.sql
-- Bug found via live testing: the original unreal_bs_reveal_card_credential
-- (0004) used `UPDATE ... SET credential_secret_encrypted = null ...
-- RETURNING credential_secret_encrypted` — Postgres RETURNING reflects the
-- POST-update row, so this always returned null instead of the ciphertext,
-- even though the row-clearing itself worked correctly (single-use was
-- never broken, only the returned value was). Fixed by locking + reading
-- the old value first (SELECT ... FOR UPDATE), then clearing it in a
-- second statement within the same function — still atomic and still
-- single-use under concurrency, since the row lock blocks a concurrent
-- caller until the first transaction commits, after which its own
-- `WHERE credential_revealed_at IS NULL` finds nothing and raises.
-- Verified live: fresh reveal returns the real secret, a second reveal on
-- the same card correctly raises ALREADY_REVEALED_OR_NOT_FOUND.

create or replace function unreal_bs_reveal_card_credential(
  p_card_id uuid
) returns text
language plpgsql
set search_path = public
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
