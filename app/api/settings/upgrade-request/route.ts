import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/auth'
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/client'
import { resolveUserIdByEmail } from '@/lib/supabase/user'
import { addContactTags, upsertContact } from '@/lib/ghl/contacts'
import { logError } from '@/lib/log-error'

export const dynamic = 'force-dynamic'

const DB_NOT_READY_MESSAGE =
  'Database not yet configured. Run the migrations in supabase/migrations/.'

const LOCATION_ID = process.env.GHL_LOCATION_ID

const postSchema = z.object({
  note: z.string().trim().max(2000).optional().or(z.literal('')),
})

async function requireUserId() {
  const session = await auth()
  const email = session?.user?.email
  if (!email) return { error: NextResponse.json({ message: 'Authentication required.' }, { status: 401 }) }

  if (!isSupabaseConfigured()) {
    return { error: NextResponse.json({ message: DB_NOT_READY_MESSAGE }, { status: 502 }) }
  }

  try {
    const userId = await resolveUserIdByEmail(email)
    if (!userId) {
      return { error: NextResponse.json({ message: DB_NOT_READY_MESSAGE }, { status: 502 }) }
    }
    return { userId, email }
  } catch {
    return { error: NextResponse.json({ message: DB_NOT_READY_MESSAGE }, { status: 502 }) }
  }
}

export async function GET() {
  const resolved = await requireUserId()
  if (resolved.error) return resolved.error
  const { userId } = resolved

  try {
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('unreal_bs_account_upgrade_requests')
      .select('id, note, status, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) return NextResponse.json({ message: DB_NOT_READY_MESSAGE }, { status: 502 })
    return NextResponse.json({ request: data ?? null })
  } catch (err) {
    await logError('upgrade-request-route-get', err, { userId })
    return NextResponse.json({ message: DB_NOT_READY_MESSAGE }, { status: 502 })
  }
}

export async function POST(request: Request) {
  const resolved = await requireUserId()
  if (resolved.error) return resolved.error
  const { userId, email } = resolved

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ message: 'Invalid request payload.' }, { status: 400 })
  }

  const parsed = postSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { message: 'Invalid request payload.', errors: parsed.error.flatten() },
      { status: 400 }
    )
  }

  try {
    const supabase = getSupabaseAdmin()

    const { data: latest, error: latestError } = await supabase
      .from('unreal_bs_account_upgrade_requests')
      .select('id, status')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (latestError) return NextResponse.json({ message: DB_NOT_READY_MESSAGE }, { status: 502 })

    if (latest?.status === 'pending') {
      return NextResponse.json({ message: 'You already have a pending request.' }, { status: 409 })
    }

    const { data, error } = await supabase
      .from('unreal_bs_account_upgrade_requests')
      .insert({ user_id: userId, note: parsed.data.note || null, status: 'pending' })
      .select()
      .single()

    if (error) return NextResponse.json({ message: DB_NOT_READY_MESSAGE }, { status: 502 })

    // Best-effort GHL notification — the DB row above is the source of
    // truth, so a failure here must never block the user-facing request.
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
          source: 'UnReal BS Settings — Dedicated Account Request',
        })
        const contactId = response.contact?.id
        if (contactId) {
          await addContactTags(contactId, LOCATION_ID, ['DEDICATED-ACCOUNT-REQUEST'])
        }
      } catch (ghlErr) {
        await logError('upgrade-request-ghl-notify', ghlErr, { userId })
      }
    }

    return NextResponse.json({ request: data })
  } catch (err) {
    await logError('upgrade-request-route-post', err, { userId })
    return NextResponse.json({ message: DB_NOT_READY_MESSAGE }, { status: 502 })
  }
}
