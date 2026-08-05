import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getSupabaseAdmin } from '@/lib/supabase/client'
import { logError } from '@/lib/log-error'
import { dbNotReady, requireOwnedProduct, requireSellerId } from '@/lib/commerce/guards'
import { MAX_PRICE_BDT, isSellablePrice, platformSplitPrice } from '@/lib/commerce/pricing'
import { validateForPublish, type ProductKind } from '@/lib/commerce/product-rules'
import { getRequestId } from '@/lib/security/request'
import { recordAuditEvent } from '@/lib/security/audit'

export const dynamic = 'force-dynamic'

const patchSchema = z.object({
  title: z.string().trim().min(1).max(150).optional(),
  subtitle: z.string().trim().max(200).nullable().optional(),
  description: z.string().trim().max(20_000).nullable().optional(),
  coverImageUrl: z.string().trim().url().max(1000).nullable().optional(),
  priceBdt: z.number().min(0).max(MAX_PRICE_BDT).optional(),
  compareAtPriceBdt: z.number().min(0).max(MAX_PRICE_BDT).nullable().optional(),
  deliveryNote: z.string().trim().max(2000).nullable().optional(),
  contactWhatsapp: z.string().trim().max(30).nullable().optional(),
  action: z.enum(['publish', 'unpublish']).optional(),
})

const PROBLEM_MESSAGES: Record<string, string> = {
  missing_title: 'Give your product a title.',
  missing_description: 'Write a description so buyers know what they are getting.',
  price_too_low: 'The lowest paid price is ৳50. Set it to ৳0 if you want to give it away free.',
  price_out_of_range: 'That price is not allowed.',
  course_needs_lessons: 'Add at least one lesson before publishing this course.',
  lesson_needs_content: 'Every lesson needs a video or some written content.',
  bad_video_url: 'One of your lesson videos is not a YouTube or Vimeo link.',
  download_needs_file: 'Upload the file buyers will download.',
  service_needs_delivery: 'Say how you will deliver this — a WhatsApp number or a short note.',
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ productId: string }> }
) {
  const resolved = await requireSellerId()
  if (resolved.error) return resolved.error
  const { userId } = resolved
  const { productId } = await params

  try {
    const supabase = getSupabaseAdmin()
    const { data: product } = await supabase
      .from('unreal_bs_digital_products')
      .select('id, kind, slug, title, subtitle, description, cover_image_url, price_bdt, compare_at_price_bdt, delivery_note, contact_whatsapp, status, review_note, sales_count, published_at, created_at')
      .eq('id', productId)
      .eq('seller_id', userId)
      .maybeSingle()

    if (!product) return NextResponse.json({ message: 'Product not found.' }, { status: 404 })

    const [{ data: lessons }, { data: assets }] = await Promise.all([
      supabase
        .from('unreal_bs_product_lessons')
        .select('id, module_title, title, video_url, video_provider, duration_minutes, content_md, resource_url, position, is_preview')
        .eq('product_id', productId)
        .order('position', { ascending: true }),
      supabase
        .from('unreal_bs_product_assets')
        .select('id, file_name, size_bytes, mime_type, position, created_at')
        .eq('product_id', productId)
        .order('position', { ascending: true }),
    ])

    const split = platformSplitPrice(Number(product.price_bdt))

    return NextResponse.json({
      product: {
        id: product.id,
        kind: product.kind,
        slug: product.slug,
        title: product.title,
        subtitle: product.subtitle,
        description: product.description,
        coverImageUrl: product.cover_image_url,
        priceBdt: split.priceBdt,
        compareAtPriceBdt:
          product.compare_at_price_bdt != null ? Number(product.compare_at_price_bdt) : null,
        commissionBdt: split.commissionBdt,
        sellerPayoutBdt: split.sellerPayoutBdt,
        deliveryNote: product.delivery_note,
        contactWhatsapp: product.contact_whatsapp,
        status: product.status,
        reviewNote: product.review_note,
        salesCount: product.sales_count,
        publishedAt: product.published_at,
        createdAt: product.created_at,
      },
      lessons: (lessons ?? []).map((l) => ({
        id: l.id,
        moduleTitle: l.module_title,
        title: l.title,
        videoUrl: l.video_url,
        videoProvider: l.video_provider,
        durationMinutes: l.duration_minutes,
        contentMd: l.content_md,
        resourceUrl: l.resource_url,
        position: l.position,
        isPreview: l.is_preview,
      })),
      // storage_path is deliberately not returned. The seller has no use for
      // it and it is the only thing standing between the bucket and a direct
      // link, so it never leaves the server.
      assets: (assets ?? []).map((a) => ({
        id: a.id,
        fileName: a.file_name,
        sizeBytes: a.size_bytes != null ? Number(a.size_bytes) : null,
        mimeType: a.mime_type,
        position: a.position,
        createdAt: a.created_at,
      })),
    })
  } catch (err) {
    await logError('product-get', err, { productId })
    return dbNotReady()
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ productId: string }> }
) {
  const resolved = await requireSellerId()
  if (resolved.error) return resolved.error
  const { userId } = resolved
  const { productId } = await params
  const requestId = getRequestId(request)

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ message: 'Invalid request payload.' }, { status: 400 })
  }

  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { message: 'Please check the product details.', errors: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const owned = await requireOwnedProduct(productId, userId)
  if (!owned) return NextResponse.json({ message: 'Product not found.' }, { status: 404 })

  const { action, ...fields } = parsed.data

  try {
    const supabase = getSupabaseAdmin()

    if (fields.priceBdt !== undefined && !isSellablePrice(fields.priceBdt)) {
      return NextResponse.json(
        {
          message:
            fields.priceBdt > 0
              ? PROBLEM_MESSAGES.price_too_low
              : PROBLEM_MESSAGES.price_out_of_range,
        },
        { status: 400 }
      )
    }

    const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (fields.title !== undefined) update.title = fields.title
    if (fields.subtitle !== undefined) update.subtitle = fields.subtitle
    if (fields.description !== undefined) update.description = fields.description
    if (fields.coverImageUrl !== undefined) update.cover_image_url = fields.coverImageUrl
    if (fields.priceBdt !== undefined) update.price_bdt = Math.round(fields.priceBdt)
    if (fields.compareAtPriceBdt !== undefined) update.compare_at_price_bdt = fields.compareAtPriceBdt
    if (fields.deliveryNote !== undefined) update.delivery_note = fields.deliveryNote
    if (fields.contactWhatsapp !== undefined) update.contact_whatsapp = fields.contactWhatsapp

    if (Object.keys(update).length > 1) {
      const { error } = await supabase
        .from('unreal_bs_digital_products')
        .update(update)
        .eq('id', productId)
        .eq('seller_id', userId)
      if (error) {
        await logError('product-update', error, { productId })
        return dbNotReady()
      }
    }

    if (action === 'publish') {
      // Re-read after the update so validation runs against what was actually
      // saved, not against what the client claimed it was saving.
      const [{ data: fresh }, { data: lessons }, { data: assets }] = await Promise.all([
        supabase
          .from('unreal_bs_digital_products')
          .select('kind, title, description, price_bdt, delivery_note, contact_whatsapp')
          .eq('id', productId)
          .maybeSingle(),
        supabase
          .from('unreal_bs_product_lessons')
          .select('title, video_url, content_md')
          .eq('product_id', productId),
        supabase
          .from('unreal_bs_product_assets')
          .select('file_name')
          .eq('product_id', productId),
      ])

      if (!fresh) return NextResponse.json({ message: 'Product not found.' }, { status: 404 })

      const problems = validateForPublish(
        {
          kind: fresh.kind as ProductKind,
          title: fresh.title,
          description: fresh.description,
          priceBdt: Number(fresh.price_bdt),
          deliveryNote: fresh.delivery_note,
          contactWhatsapp: fresh.contact_whatsapp,
        },
        (lessons ?? []).map((l) => ({ title: l.title, videoUrl: l.video_url, contentMd: l.content_md })),
        (assets ?? []).map((a) => ({ fileName: a.file_name }))
      )

      if (problems.length > 0) {
        return NextResponse.json(
          { message: PROBLEM_MESSAGES[problems[0]] ?? 'This product is not ready to publish.', problems },
          { status: 400 }
        )
      }

      const { error } = await supabase.rpc('unreal_bs_product_set_status', {
        p_product_id: productId,
        p_status: 'published',
        p_note: null,
      })
      if (error) {
        if (/INVALID_TRANSITION/i.test(error.message ?? '')) {
          return NextResponse.json({ message: 'This product is already published.' }, { status: 409 })
        }
        await logError('product-publish', error, { productId })
        return dbNotReady()
      }
    }

    if (action === 'unpublish') {
      const { error } = await supabase.rpc('unreal_bs_product_set_status', {
        p_product_id: productId,
        p_status: 'unpublished',
        p_note: null,
      })
      if (error) {
        if (/INVALID_TRANSITION/i.test(error.message ?? '')) {
          return NextResponse.json({ message: 'This product is not published.' }, { status: 409 })
        }
        await logError('product-unpublish', error, { productId })
        return dbNotReady()
      }
    }

    await recordAuditEvent({
      eventType: action ? `commerce.product.${action}` : 'commerce.product.updated',
      actorUserId: userId,
      targetType: 'product',
      targetId: productId,
      requestId,
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    await logError('product-patch', err, { productId })
    return dbNotReady()
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ productId: string }> }
) {
  const resolved = await requireSellerId()
  if (resolved.error) return resolved.error
  const { userId } = resolved
  const { productId } = await params

  const owned = await requireOwnedProduct(productId, userId)
  if (!owned) return NextResponse.json({ message: 'Product not found.' }, { status: 404 })

  try {
    const supabase = getSupabaseAdmin()

    // A product somebody paid for must never disappear — deleting it would
    // silently revoke access that was bought. The database enforces this too
    // (orders reference products ON DELETE RESTRICT); this check exists so the
    // seller gets a sentence instead of a foreign-key error.
    const { count } = await supabase
      .from('unreal_bs_orders')
      .select('id', { count: 'exact', head: true })
      .eq('product_id', productId)

    if ((count ?? 0) > 0) {
      return NextResponse.json(
        {
          message:
            'This product has orders, so it cannot be deleted. Unpublish it instead — buyers keep their access.',
          code: 'HAS_ORDERS',
        },
        { status: 409 }
      )
    }

    const { error } = await supabase
      .from('unreal_bs_digital_products')
      .delete()
      .eq('id', productId)
      .eq('seller_id', userId)

    if (error) {
      await logError('product-delete', error, { productId })
      return dbNotReady()
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    await logError('product-delete', err, { productId })
    return dbNotReady()
  }
}
