import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getSupabaseAdmin } from '@/lib/supabase/client'
import { logError } from '@/lib/log-error'
import { dbNotReady, requireAdmin } from '@/lib/commerce/guards'

export const dynamic = 'force-dynamic'

// Sellers asking for their money out. The wallet was already debited when the
// request was made, so 'paid' moves nothing here — it records that the
// operator has actually sent the bKash. 'rejected' is what puts the money back.

const patchSchema = z.object({
  payoutId: z.string().uuid(),
  status: z.enum(['paid', 'rejected']),
  note: z.string().trim().max(1000).optional(),
  reference: z.string().trim().max(100).optional(),
})

export async function GET() {
  const resolved = await requireAdmin()
  if ('error' in resolved) return resolved.error

  try {
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('unreal_bs_payout_requests')
      .select('id, seller_id, amount_bdt, method, account_number, account_name, status, admin_note, operator_reference, paid_at, created_at, unreal_bs_users(business_name, email)')
      .order('created_at', { ascending: true })
      .limit(200)

    if (error) {
      await logError('admin-payouts-get', error)
      return dbNotReady()
    }

    return NextResponse.json({
      payouts: (data ?? []).map((p) => {
        const u = Array.isArray(p.unreal_bs_users) ? p.unreal_bs_users[0] : p.unreal_bs_users
        return {
          id: p.id,
          sellerName: u?.business_name ?? null,
          sellerEmail: u?.email ?? null,
          amountBdt: Number(p.amount_bdt),
          method: p.method,
          accountNumber: p.account_number,
          accountName: p.account_name,
          status: p.status,
          adminNote: p.admin_note,
          operatorReference: p.operator_reference,
          paidAt: p.paid_at,
          createdAt: p.created_at,
        }
      }),
    })
  } catch (err) {
    await logError('admin-payouts-get', err)
    return dbNotReady()
  }
}

export async function PATCH(request: Request) {
  const resolved = await requireAdmin()
  if ('error' in resolved) return resolved.error

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ message: 'Invalid request payload.' }, { status: 400 })
  }

  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ message: 'Invalid values.' }, { status: 400 })
  }

  const { payoutId, status, note, reference } = parsed.data

  try {
    const supabase = getSupabaseAdmin()
    const { error } = await supabase.rpc('unreal_bs_payout_request_settle', {
      p_request_id: payoutId,
      p_status: status,
      p_note: note ?? null,
      p_reference: reference ?? null,
    })

    if (error) {
      if (/PAYOUT_NOT_PENDING/i.test(error.message ?? '')) {
        return NextResponse.json(
          { message: 'This payout request has already been settled.' },
          { status: 409 }
        )
      }
      await logError('admin-payout-settle', error, { payoutId, status })
      return NextResponse.json({ message: 'Could not update this payout.' }, { status: 502 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    await logError('admin-payout-settle', err, { payoutId })
    return NextResponse.json({ message: 'Could not update this payout.' }, { status: 502 })
  }
}
