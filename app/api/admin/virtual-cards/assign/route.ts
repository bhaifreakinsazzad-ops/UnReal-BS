import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/client'
import { encryptCardCredential } from '@/lib/crypto/card-credentials'
import { logError } from '@/lib/log-error'
import { checkRateLimit } from '@/lib/rate-limit'
import { requireAdminSession } from '@/lib/security/admin'
import { opaqueRateKey, readJson } from '@/lib/security/request'
import { hasFreshStepUp } from '@/lib/security/step-up'

const DB_NOT_READY_MESSAGE = 'Database not yet configured for atomic card assignment.'
const postSchema = z.object({
  orderId: z.string().uuid(),
  label: z.string().trim().min(1).max(200),
  cardBrand: z.string().trim().max(50).optional(),
  last4: z.string().trim().regex(/^\d{4}$/),
  expiryMonth: z.number().int().min(1).max(12).optional(),
  expiryYear: z.number().int().min(2024).max(2099).optional(),
  credential: z.string().trim().min(1).max(2000),
  chargedAmountBdt: z.number().positive().max(1_000_000),
})

export async function POST(request: Request) {
  const admin = await requireAdminSession({ hide: false })
  if (admin.error) return admin.error
  if (!isSupabaseConfigured()) return NextResponse.json({ message: DB_NOT_READY_MESSAGE }, { status: 502 })
  if (!hasFreshStepUp(request, admin.email)) {
    return NextResponse.json({ message: 'Re-enter your password before assigning a card.', code: 'REVERIFY_REQUIRED' }, { status: 428 })
  }
  const idempotencyKey = request.headers.get('idempotency-key')?.trim()
  if (!idempotencyKey || !/^[A-Za-z0-9_-]{12,120}$/.test(idempotencyKey)) {
    return NextResponse.json({ message: 'A valid Idempotency-Key header is required.' }, { status: 400 })
  }
  const parsed = await readJson(request, postSchema, { maxBytes: 8192 })
  if (parsed.error) return parsed.error
  const limit = await checkRateLimit('admin-card-assign', opaqueRateKey(admin.email), { max: 20, windowSeconds: 3600, failClosed: true })
  if (!limit.allowed) return NextResponse.json({ message: 'Too many card operations. Try again later.' }, { status: 429 })

  try {
    const encrypted = encryptCardCredential(parsed.data.credential)
    const { data, error } = await getSupabaseAdmin().rpc('unreal_bs_assign_virtual_card_v2', {
      p_order_id: parsed.data.orderId,
      p_label: parsed.data.label,
      p_card_brand: parsed.data.cardBrand || null,
      p_last4: parsed.data.last4,
      p_expiry_month: parsed.data.expiryMonth ?? null,
      p_expiry_year: parsed.data.expiryYear ?? null,
      p_credential_encrypted: encrypted,
      p_charged_amount_bdt: Math.round(parsed.data.chargedAmountBdt),
      p_operator_email_hash: opaqueRateKey(admin.email),
      p_idempotency_key: idempotencyKey,
    })
    if (error) {
      if (/CARD_ORDER_NOT_PENDING|IDEMPOTENCY_CONFLICT/i.test(error.message ?? '')) {
        return NextResponse.json({ message: 'This order was already processed or changed. Refresh before retrying.' }, { status: 409 })
      }
      await logError('admin-virtual-cards-assign', error, { orderId: parsed.data.orderId, requestId: parsed.requestId })
      return NextResponse.json({ message: 'Card assignment did not complete. No partial assignment was committed.' }, { status: 502 })
    }
    return NextResponse.json({ cardId: data }, { headers: { 'x-request-id': parsed.requestId } })
  } catch (err) {
    await logError('admin-virtual-cards-assign', err, { orderId: parsed.data.orderId, requestId: parsed.requestId })
    return NextResponse.json({ message: 'Card assignment did not complete.' }, { status: 502 })
  }
}
