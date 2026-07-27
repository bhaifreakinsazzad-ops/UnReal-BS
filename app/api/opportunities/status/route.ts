import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/auth'
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/client'
import { resolveUserIdByEmail } from '@/lib/supabase/user'
import { logError } from '@/lib/log-error'

// Inlined from the former lib/unreal/opportunities.ts, which was deleted along
// with the fabricated demo-opportunity data it also exported. This route has no
// caller yet — Opportunities is an honest waitlist page — but the endpoint is
// kept as the scaffold for when the real matching feature ships.
type OpportunityStatus = 'available' | 'accepted' | 'declined' | 'disputed' | 'billable' | 'paid'

export const dynamic = 'force-dynamic'

const DB_NOT_READY_MESSAGE =
  'Database not yet configured. Run the migration in supabase/migrations/0001_unreal_bs_core.sql.'

const postSchema = z.object({
  opportunityId: z.string().trim().min(1),
  status: z.enum(['available', 'accepted', 'declined', 'disputed', 'billable', 'paid']),
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
    return { userId }
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
      .from('unreal_bs_opportunity_status')
      .select('opportunity_id, status')
      .eq('user_id', userId)

    if (error) return NextResponse.json({ message: DB_NOT_READY_MESSAGE }, { status: 502 })

    const statusById: Record<string, OpportunityStatus> = {}
    for (const row of data ?? []) {
      statusById[row.opportunity_id] = row.status as OpportunityStatus
    }
    return NextResponse.json({ statusById })
  } catch (err) {
    await logError('opportunities-status-route-get', err, { userId })
    return NextResponse.json({ message: DB_NOT_READY_MESSAGE }, { status: 502 })
  }
}

export async function POST(request: Request) {
  const resolved = await requireUserId()
  if (resolved.error) return resolved.error
  const { userId } = resolved

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
    const { data, error } = await supabase
      .from('unreal_bs_opportunity_status')
      .upsert(
        {
          user_id: userId,
          opportunity_id: parsed.data.opportunityId,
          status: parsed.data.status,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,opportunity_id' }
      )
      .select()
      .single()

    if (error) return NextResponse.json({ message: DB_NOT_READY_MESSAGE }, { status: 502 })
    return NextResponse.json({ status: data })
  } catch (err) {
    await logError('opportunities-status-route-post', err, { userId })
    return NextResponse.json({ message: DB_NOT_READY_MESSAGE }, { status: 502 })
  }
}
