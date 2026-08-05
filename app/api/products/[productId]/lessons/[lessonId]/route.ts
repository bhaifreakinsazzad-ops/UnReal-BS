import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getSupabaseAdmin } from '@/lib/supabase/client'
import { logError } from '@/lib/log-error'
import { dbNotReady, requireOwnedProduct, requireSellerId } from '@/lib/commerce/guards'
import { parseVideoUrl } from '@/lib/commerce/video'

export const dynamic = 'force-dynamic'

const patchSchema = z.object({
  moduleTitle: z.string().trim().max(150).nullable().optional(),
  title: z.string().trim().min(1).max(200).optional(),
  videoUrl: z.string().trim().max(1000).nullable().optional(),
  durationMinutes: z.number().int().min(0).max(1000).nullable().optional(),
  contentMd: z.string().trim().max(50_000).nullable().optional(),
  resourceUrl: z.string().trim().url().max(1000).nullable().optional(),
  isPreview: z.boolean().optional(),
})

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ productId: string; lessonId: string }> }
) {
  const resolved = await requireSellerId()
  if (resolved.error) return resolved.error
  const { userId } = resolved
  const { productId, lessonId } = await params

  const owned = await requireOwnedProduct(productId, userId)
  if (!owned) return NextResponse.json({ message: 'Product not found.' }, { status: 404 })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ message: 'Invalid request payload.' }, { status: 400 })
  }

  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { message: 'Please check the lesson details.', errors: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const l = parsed.data
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() }

  if (l.videoUrl !== undefined) {
    if (l.videoUrl === null || !l.videoUrl.trim()) {
      update.video_url = null
      update.video_provider = null
    } else {
      const video = parseVideoUrl(l.videoUrl)
      if (!video) {
        return NextResponse.json(
          { message: 'Paste a YouTube or Vimeo link. Other video links are not supported.' },
          { status: 400 }
        )
      }
      update.video_url = video.embedUrl
      update.video_provider = video.provider
    }
  }

  if (l.moduleTitle !== undefined) update.module_title = l.moduleTitle
  if (l.title !== undefined) update.title = l.title
  if (l.durationMinutes !== undefined) update.duration_minutes = l.durationMinutes
  if (l.contentMd !== undefined) update.content_md = l.contentMd
  if (l.resourceUrl !== undefined) update.resource_url = l.resourceUrl
  if (l.isPreview !== undefined) update.is_preview = l.isPreview

  try {
    const supabase = getSupabaseAdmin()
    const { error } = await supabase
      .from('unreal_bs_product_lessons')
      .update(update)
      .eq('id', lessonId)
      // Scoped to the owned product, so a lesson id from another seller's
      // course matches nothing.
      .eq('product_id', productId)

    if (error) {
      await logError('lesson-update', error, { productId, lessonId })
      return dbNotReady()
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    await logError('lesson-update', err, { productId, lessonId })
    return dbNotReady()
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ productId: string; lessonId: string }> }
) {
  const resolved = await requireSellerId()
  if (resolved.error) return resolved.error
  const { userId } = resolved
  const { productId, lessonId } = await params

  const owned = await requireOwnedProduct(productId, userId)
  if (!owned) return NextResponse.json({ message: 'Product not found.' }, { status: 404 })

  try {
    const supabase = getSupabaseAdmin()
    const { error } = await supabase
      .from('unreal_bs_product_lessons')
      .delete()
      .eq('id', lessonId)
      .eq('product_id', productId)

    if (error) {
      await logError('lesson-delete', error, { productId, lessonId })
      return dbNotReady()
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    await logError('lesson-delete', err, { productId, lessonId })
    return dbNotReady()
  }
}
