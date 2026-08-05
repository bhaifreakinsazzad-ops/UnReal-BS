import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getSupabaseAdmin } from '@/lib/supabase/client'
import { logError } from '@/lib/log-error'
import { dbNotReady, requireOwnedProduct, requireSellerId } from '@/lib/commerce/guards'
import { parseVideoUrl } from '@/lib/commerce/video'

export const dynamic = 'force-dynamic'

const lessonSchema = z.object({
  moduleTitle: z.string().trim().max(150).nullable().optional(),
  title: z.string().trim().min(1).max(200),
  videoUrl: z.string().trim().max(1000).nullable().optional(),
  durationMinutes: z.number().int().min(0).max(1000).nullable().optional(),
  contentMd: z.string().trim().max(50_000).nullable().optional(),
  resourceUrl: z.string().trim().url().max(1000).nullable().optional(),
  isPreview: z.boolean().optional(),
})

const reorderSchema = z.object({
  order: z.array(z.string().uuid()).min(1).max(500),
})

const MAX_LESSONS = 300

export async function POST(
  request: Request,
  { params }: { params: Promise<{ productId: string }> }
) {
  const resolved = await requireSellerId()
  if (resolved.error) return resolved.error
  const { userId } = resolved
  const { productId } = await params

  const owned = await requireOwnedProduct(productId, userId)
  if (!owned) return NextResponse.json({ message: 'Product not found.' }, { status: 404 })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ message: 'Invalid request payload.' }, { status: 400 })
  }

  // Reorder shares this route because it is the same resource being rewritten.
  const reorder = reorderSchema.safeParse(body)
  if (reorder.success) {
    try {
      const supabase = getSupabaseAdmin()
      // Scoped to the product id on every row, so a crafted list of lesson ids
      // belonging to somebody else's product updates nothing.
      await Promise.all(
        reorder.data.order.map((lessonId, index) =>
          supabase
            .from('unreal_bs_product_lessons')
            .update({ position: index, updated_at: new Date().toISOString() })
            .eq('id', lessonId)
            .eq('product_id', productId)
        )
      )
      return NextResponse.json({ ok: true })
    } catch (err) {
      await logError('lessons-reorder', err, { productId })
      return dbNotReady()
    }
  }

  const parsed = lessonSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { message: 'Please check the lesson details.', errors: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const l = parsed.data

  // The URL ends up inside an iframe src, so it is parsed rather than stored
  // as typed. Anything that is not a YouTube/Vimeo video is refused here
  // rather than being discovered by a buyer.
  const video = l.videoUrl?.trim() ? parseVideoUrl(l.videoUrl) : null
  if (l.videoUrl?.trim() && !video) {
    return NextResponse.json(
      { message: 'Paste a YouTube or Vimeo link. Other video links are not supported.' },
      { status: 400 }
    )
  }

  try {
    const supabase = getSupabaseAdmin()

    const { count } = await supabase
      .from('unreal_bs_product_lessons')
      .select('id', { count: 'exact', head: true })
      .eq('product_id', productId)

    if ((count ?? 0) >= MAX_LESSONS) {
      return NextResponse.json(
        { message: `A course can have at most ${MAX_LESSONS} lessons.` },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('unreal_bs_product_lessons')
      .insert({
        product_id: productId,
        module_title: l.moduleTitle || null,
        title: l.title,
        video_url: video?.embedUrl ?? null,
        video_provider: video?.provider ?? null,
        duration_minutes: l.durationMinutes ?? null,
        content_md: l.contentMd || null,
        resource_url: l.resourceUrl || null,
        position: count ?? 0,
        is_preview: l.isPreview ?? false,
      })
      .select('id')
      .single()

    if (error) {
      await logError('lesson-create', error, { productId })
      return dbNotReady()
    }

    return NextResponse.json({ lesson: { id: data.id } }, { status: 201 })
  } catch (err) {
    await logError('lesson-create', err, { productId })
    return dbNotReady()
  }
}
