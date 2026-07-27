import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/auth'
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/client'
import { logError } from '@/lib/log-error'

export const dynamic = 'force-dynamic'

const DB_NOT_READY_MESSAGE =
  'Database not yet configured. Run the migration in supabase/migrations/0004_shared_wallet_and_virtual_cards.sql.'

// Admin-only deposit approval.
//
// Until this route existed there was NO way to credit a wallet from inside the
// product: every .rpc() call in the codebase was a debit or a reveal, and
// unreal_bs_fulfill_deposit_request had zero callers. Every top-up had to be
// hand-typed SQL, and if that was done with a bare UPDATE instead of the RPC,
// no ledger row was written and the customer's statement showed debits with no
// matching credit — exactly the record they would use to dispute a charge.
//
// The RPC itself is already correct and atomic: it flips the request to
// 'fulfilled' with `where id = ? and status = 'pending'` in the same statement,
// raises if that matched nothing, and only then credits the wallet. So a
// double-submit cannot double-credit.

const postSchema = z.object({
  requestId: z.string().uuid(),
  // The amount actually received, which may differ from what the customer
  // requested (partial payment, bank fees). Bounded to catch fat-finger entry.
  fulfilledAmountBdt: z.number().positive().max(1_000_000),
  method: z.string().trim().min(1).max(50).optional(),
})

async function requireAdmin() {
  const session = await auth()
  const email = session?.user?.email
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase()
  // 404 rather than 403 so the endpoint's existence isn't confirmed to
  // non-admins — same convention as app/api/admin/virtual-cards/*.
  if (!email || !adminEmail || email.trim().toLowerCase() !== adminEmail) {
    return { error: NextResponse.json({ message: 'Not found.' }, { status: 404 }) }
  }
  if (!isSupabaseConfigured()) {
    return { error: NextResponse.json({ message: DB_NOT_READY_MESSAGE }, { status: 502 }) }
  }
  return {}
}

export async function GET() {
  const resolved = await requireAdmin()
  if (resolved.error) return resolved.error

  try {
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('unreal_bs_deposit_requests')
      .select('id, user_id, requested_amount_bdt, method, note, created_at, unreal_bs_users(business_name, email)')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })

    if (error) {
      await logError('admin-deposit-requests-get', error)
      return NextResponse.json({ message: DB_NOT_READY_MESSAGE }, { status: 502 })
    }

    return NextResponse.json({
      requests: (data ?? []).map((r) => {
        const user = Array.isArray(r.unreal_bs_users) ? r.unreal_bs_users[0] : r.unreal_bs_users
        return {
          id: r.id,
          userId: r.user_id,
          businessName: user?.business_name ?? null,
          email: user?.email ?? null,
          requestedAmountBdt: Number(r.requested_amount_bdt),
          method: r.method,
          note: r.note,
          createdAt: r.created_at,
        }
      }),
    })
  } catch (err) {
    await logError('admin-deposit-requests-get', err)
    return NextResponse.json({ message: DB_NOT_READY_MESSAGE }, { status: 502 })
  }
}

export async function POST(request: Request) {
  const resolved = await requireAdmin()
  if (resolved.error) return resolved.error

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

  const { requestId, fulfilledAmountBdt, method } = parsed.data

  try {
    const supabase = getSupabaseAdmin()

    const { data: fulfilled, error: fulfillError } = await supabase.rpc(
      'unreal_bs_fulfill_deposit_request',
      {
        p_request_id: requestId,
        p_fulfilled_amount_bdt: fulfilledAmountBdt,
        p_method: method ?? null,
      }
    )

    if (fulfillError) {
      // REQUEST_NOT_PENDING is raised by the RPC when the row was already
      // fulfilled/rejected — i.e. a duplicate approval. Nothing was credited.
      const alreadyHandled = /REQUEST_NOT_PENDING/i.test(fulfillError.message ?? '')
      if (alreadyHandled) {
        return NextResponse.json(
          { message: 'This deposit request is no longer pending — it may already have been approved.' },
          { status: 409 }
        )
      }
      await logError('admin-deposit-requests-fulfill', fulfillError, { requestId, fulfilledAmountBdt })
      return NextResponse.json({ message: 'Could not approve this deposit request.' }, { status: 502 })
    }

    return NextResponse.json({ request: fulfilled })
  } catch (err) {
    await logError('admin-deposit-requests-fulfill', err, { requestId, fulfilledAmountBdt })
    return NextResponse.json({ message: DB_NOT_READY_MESSAGE }, { status: 502 })
  }
}
