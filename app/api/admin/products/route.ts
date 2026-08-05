import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getSupabaseAdmin } from '@/lib/supabase/client'
import { logError } from '@/lib/log-error'
import { dbNotReady, requireAdmin } from '@/lib/commerce/guards'

export const dynamic = 'force-dynamic'

// Moderation, not approval. Products publish themselves — making every seller
// wait on a human before their first sale would kill the feature. What the
// operator needs instead is to be able to SEE everything that is live and take
// something down when it breaks a rule, with a reason the seller can read.

const patchSchema = z.object({
  productId: z.string().uuid(),
  action: z.enum(['take_down', 'restore']),
  note: z.string().trim().max(1000).optional(),
})

export async function GET(request: Request) {
  const resolved = await requireAdmin()
  if ('error' in resolved) return resolved.error

  const status = new URL(request.url).searchParams.get('status')

  try {
    const supabase = getSupabaseAdmin()
    let query = supabase
      .from('unreal_bs_digital_products')
      .select('id, seller_id, kind, slug, title, subtitle, price_bdt, status, review_note, sales_count, published_at, created_at, unreal_bs_users(business_name, email)')
      .order('published_at', { ascending: false, nullsFirst: false })
      .limit(300)

    // Drafts are nobody's business but the seller's until they go live.
    query = status ? query.eq('status', status) : query.neq('status', 'draft')

    const { data, error } = await query

    if (error) {
      await logError('admin-products-get', error)
      return dbNotReady()
    }

    return NextResponse.json({
      products: (data ?? []).map((p) => {
        const u = Array.isArray(p.unreal_bs_users) ? p.unreal_bs_users[0] : p.unreal_bs_users
        return {
          id: p.id,
          sellerName: u?.business_name ?? null,
          sellerEmail: u?.email ?? null,
          kind: p.kind,
          slug: p.slug,
          title: p.title,
          subtitle: p.subtitle,
          priceBdt: Number(p.price_bdt),
          status: p.status,
          reviewNote: p.review_note,
          salesCount: p.sales_count,
          publishedAt: p.published_at,
          createdAt: p.created_at,
        }
      }),
    })
  } catch (err) {
    await logError('admin-products-get', err)
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

  const { productId, action, note } = parsed.data

  if (action === 'take_down' && !note?.trim()) {
    // A take-down without a reason is one the seller cannot act on, and one
    // nobody can justify later.
    return NextResponse.json({ message: 'Give a reason — the seller sees it.' }, { status: 400 })
  }

  try {
    const supabase = getSupabaseAdmin()
    const { error } = await supabase.rpc('unreal_bs_product_set_status', {
      p_product_id: productId,
      p_status: action === 'take_down' ? 'rejected' : 'draft',
      p_note: note ?? null,
    })

    if (error) {
      if (/INVALID_TRANSITION/i.test(error.message ?? '')) {
        return NextResponse.json(
          { message: 'This product is not in a state that allows that.' },
          { status: 409 }
        )
      }
      await logError('admin-product-moderate', error, { productId, action })
      return NextResponse.json({ message: 'Could not update this product.' }, { status: 502 })
    }

    // Buyers who already paid keep their access: /learn is keyed on the order,
    // not on the product's status. Taking a product down stops new sales, it
    // does not confiscate old ones.
    return NextResponse.json({ ok: true })
  } catch (err) {
    await logError('admin-product-moderate', err, { productId })
    return NextResponse.json({ message: 'Could not update this product.' }, { status: 502 })
  }
}
