import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getSupabaseAdmin } from '@/lib/supabase/client'
import { checkRateLimit } from '@/lib/rate-limit'
import { logError } from '@/lib/log-error'
import { dbNotReady, requireSellerId } from '@/lib/commerce/guards'
import { slugify } from '@/lib/commerce/product-rules'
import { MAX_PRICE_BDT, platformSplitPrice } from '@/lib/commerce/pricing'
import { getRequestId } from '@/lib/security/request'
import { recordAuditEvent } from '@/lib/security/audit'

export const dynamic = 'force-dynamic'

const createSchema = z.object({
  kind: z.enum(['course', 'download', 'service', 'consultation']),
  title: z.string().trim().min(1).max(150),
  subtitle: z.string().trim().max(200).optional(),
  description: z.string().trim().max(20_000).optional(),
  priceBdt: z.number().min(0).max(MAX_PRICE_BDT).default(0),
})

/** Products live at /p/<slug>, so the handle has to be unique platform-wide
 *  and has to survive being pasted into a Facebook post. Bangla titles produce
 *  no usable ASCII, which is why there is always a random tail to fall back
 *  on rather than a percent-encoded URL nobody can read or type. */
function candidateSlug(title: string): string {
  const base = slugify(title)
  const tail = Math.random().toString(36).slice(2, 8)
  return base ? `${base}-${tail}` : `p-${tail}`
}

export async function GET() {
  const resolved = await requireSellerId()
  if (resolved.error) return resolved.error
  const { userId } = resolved

  try {
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('unreal_bs_digital_products')
      .select('id, kind, slug, title, subtitle, description, cover_image_url, price_bdt, compare_at_price_bdt, delivery_note, contact_whatsapp, status, review_note, sales_count, published_at, created_at')
      .eq('seller_id', userId)
      .order('created_at', { ascending: false })
      .limit(200)

    if (error) {
      await logError('products-get', error, { userId })
      return dbNotReady()
    }

    return NextResponse.json({
      products: (data ?? []).map((p) => {
        const split = platformSplitPrice(Number(p.price_bdt))
        return {
          id: p.id,
          kind: p.kind,
          slug: p.slug,
          title: p.title,
          subtitle: p.subtitle,
          description: p.description,
          coverImageUrl: p.cover_image_url,
          priceBdt: split.priceBdt,
          compareAtPriceBdt: p.compare_at_price_bdt != null ? Number(p.compare_at_price_bdt) : null,
          // Quoted from the same pure module the checkout route writes with, so
          // what a seller is shown here is what they will actually receive.
          commissionBdt: split.commissionBdt,
          sellerPayoutBdt: split.sellerPayoutBdt,
          deliveryNote: p.delivery_note,
          contactWhatsapp: p.contact_whatsapp,
          status: p.status,
          reviewNote: p.review_note,
          salesCount: p.sales_count,
          publishedAt: p.published_at,
          createdAt: p.created_at,
        }
      }),
    })
  } catch (err) {
    await logError('products-get', err)
    return dbNotReady()
  }
}

export async function POST(request: Request) {
  const resolved = await requireSellerId()
  if (resolved.error) return resolved.error
  const { userId } = resolved

  const requestId = getRequestId(request)
  const { allowed } = await checkRateLimit('product-create', userId, { max: 30, windowSeconds: 3600, failClosed: true })
  if (!allowed) {
    return NextResponse.json({ message: 'Too many products created. Try again later.' }, { status: 429 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ message: 'Invalid request payload.' }, { status: 400 })
  }

  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { message: 'Please check the product details.', errors: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const p = parsed.data

  try {
    const supabase = getSupabaseAdmin()

    // Retry on a slug collision rather than failing the seller's first action
    // in the product. The random tail makes a second collision vanishingly
    // unlikely, so three attempts is generous.
    let lastError: unknown = null
    for (let attempt = 0; attempt < 3; attempt++) {
      const { data, error } = await supabase
        .from('unreal_bs_digital_products')
        .insert({
          seller_id: userId,
          platform_owned: true,
          kind: p.kind,
          slug: candidateSlug(p.title),
          title: p.title,
          subtitle: p.subtitle || null,
          description: p.description || null,
          price_bdt: p.priceBdt,
        })
        .select('id, slug')
        .single()

      if (!error && data) {
        await recordAuditEvent({ eventType: 'commerce.product.created', actorUserId: userId, targetType: 'product', targetId: data.id, requestId })
        return NextResponse.json({ product: { id: data.id, slug: data.slug } }, { status: 201 })
      }
      lastError = error
      if (!/duplicate key|unique/i.test(error?.message ?? '')) break
    }

    await logError('products-create', lastError, { userId })
    return dbNotReady()
  } catch (err) {
    await logError('products-create', err, { userId })
    return dbNotReady()
  }
}
