import 'server-only'
import { getSupabaseAdmin } from '@/lib/supabase/client'
import { addContactTags, upsertContact } from '@/lib/ghl/contacts'
import { logError } from '@/lib/log-error'

const LOCATION_ID = process.env.GHL_LOCATION_ID

export interface DepositRequestRow {
  id: string
  requested_amount_bdt: number
  method: string | null
  note: string | null
  status: string
  created_at: string
}

export async function getLatestDepositRequest(userId: string) {
  const supabase = getSupabaseAdmin()
  return supabase
    .from('unreal_bs_deposit_requests')
    .select('id, requested_amount_bdt, method, note, status, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
}

export async function createDepositRequest(
  userId: string,
  email: string,
  input: { amountBdt: number; method?: string; note?: string },
  ghl: { tag: string; source: string }
) {
  const supabase = getSupabaseAdmin()

  const { data: latest, error: latestError } = await supabase
    .from('unreal_bs_deposit_requests')
    .select('id, status')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (latestError) return { error: latestError }
  if (latest?.status === 'pending') return { pendingConflict: true as const }

  const { data, error } = await supabase
    .from('unreal_bs_deposit_requests')
    .insert({
      user_id: userId,
      requested_amount_bdt: input.amountBdt,
      method: input.method || null,
      note: input.note || null,
      status: 'pending',
    })
    .select()
    .single()

  // 23505 = unique_violation. Migration 0007 adds a partial unique index
  // allowing only one pending request per user, which closes the race the
  // read-then-insert check above cannot: two taps 200ms apart both passed the
  // check and created two identical pending claims, each separately
  // approvable — crediting one real bKash payment twice. Treat the constraint
  // firing as the same user-facing outcome as the soft check.
  if (error?.code === '23505') return { pendingConflict: true as const }
  if (error) return { error }

  // Best-effort GHL notification — the DB row above is the source of truth,
  // so a failure here must never block the user-facing request.
  if (LOCATION_ID) {
    try {
      const { data: userRow } = await supabase
        .from('unreal_bs_users')
        .select('business_name, email')
        .eq('id', userId)
        .maybeSingle()

      const response = await upsertContact(LOCATION_ID, {
        companyName: userRow?.business_name || undefined,
        email: userRow?.email || email,
        source: ghl.source,
      })
      const contactId = response.contact?.id
      if (contactId) {
        await addContactTags(contactId, LOCATION_ID, [ghl.tag])
      }
    } catch (ghlErr) {
      await logError('wallet-deposit-request-ghl-notify', ghlErr, { userId })
    }
  }

  return { data }
}
