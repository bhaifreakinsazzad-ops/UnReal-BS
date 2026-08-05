import { NextResponse } from 'next/server'
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/client'
import { logError } from '@/lib/log-error'
import { hashAccessToken } from '@/lib/commerce/access-token'
import { storefrontEnabledForRequest } from '@/lib/commerce/flags'

export const dynamic = 'force-dynamic'

// PUBLIC, keyed on the order's access token. This is what a buyer with no
// account opens after paying.
//
// The paid check happens HERE and not in the page, because the page is only a
// renderer — anything reachable without paying has to be withheld at the
// source. An unpaid order still gets a response (so the buyer can see their
// order is being checked), but it carries no lesson content.

const TOKEN = /^[A-Za-z0-9_-]{40,64}$/

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ accessToken: string }> }
) {
  if (!(await storefrontEnabledForRequest())) return new NextResponse(null, { status: 404 })
  const { accessToken } = await params
  if (!TOKEN.test(accessToken)) {
    return NextResponse.json({ message: 'Not found.' }, { status: 404 })
  }
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ message: 'Not available right now.' }, { status: 502 })
  }

  try {
    const supabase = getSupabaseAdmin()

    const { data: order } = await supabase
      .from('unreal_bs_orders')
      .select('id, product_id, product_title, product_kind, buyer_name, status, paid_at')
      .eq('access_token_hash', hashAccessToken(accessToken))
      .maybeSingle()

    if (!order) return NextResponse.json({ message: 'Not found.' }, { status: 404 })

    const paid = order.status === 'paid'

    const { data: product } = await supabase
      .from('unreal_bs_digital_products')
      .select('id, kind, title, subtitle, description, cover_image_url, delivery_note, contact_whatsapp')
      .eq('id', order.product_id)
      .maybeSingle()

    if (!paid) {
      return NextResponse.json({
        access: false,
        order: {
          status: order.status,
          productTitle: order.product_title,
          buyerName: order.buyer_name,
        },
        product: product
          ? { title: product.title, subtitle: product.subtitle, coverImageUrl: product.cover_image_url }
          : null,
        lessons: [],
        assets: [],
      })
    }

    const [{ data: lessons }, { data: assets }] = await Promise.all([
      supabase
        .from('unreal_bs_product_lessons')
        .select('id, module_title, title, video_url, video_provider, duration_minutes, content_md, resource_url, position')
        .eq('product_id', order.product_id)
        .order('position', { ascending: true }),
      supabase
        .from('unreal_bs_product_assets')
        .select('id, file_name, size_bytes, mime_type, position')
        .eq('product_id', order.product_id)
        .order('position', { ascending: true }),
    ])

    return NextResponse.json({
      access: true,
      order: {
        status: order.status,
        productTitle: order.product_title,
        buyerName: order.buyer_name,
        paidAt: order.paid_at,
      },
      product: product
        ? {
            kind: product.kind,
            title: product.title,
            subtitle: product.subtitle,
            description: product.description,
            coverImageUrl: product.cover_image_url,
            deliveryNote: product.delivery_note,
            contactWhatsapp: product.contact_whatsapp,
          }
        : null,
      lessons: (lessons ?? []).map((l) => ({
        id: l.id,
        moduleTitle: l.module_title,
        title: l.title,
        // Already an embed URL — parsed and rewritten on the way in by
        // lib/commerce/video.ts, never whatever the seller typed.
        videoUrl: l.video_url,
        videoProvider: l.video_provider,
        durationMinutes: l.duration_minutes,
        contentMd: l.content_md,
        resourceUrl: l.resource_url,
      })),
      // Only the id and the display name. The storage path stays on the
      // server; downloading goes through the signed-URL route.
      assets: (assets ?? []).map((a) => ({
        id: a.id,
        fileName: a.file_name,
        sizeBytes: a.size_bytes != null ? Number(a.size_bytes) : null,
        mimeType: a.mime_type,
      })),
    })
  } catch (err) {
    await logError('learn-get', err)
    return NextResponse.json({ message: 'Could not load this.' }, { status: 502 })
  }
}
