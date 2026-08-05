import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/client'
import { checkRateLimit } from '@/lib/rate-limit'
import { logError } from '@/lib/log-error'
import { dbNotReady, requireOwnedProduct, requireSellerId } from '@/lib/commerce/guards'
import { PRODUCT_BUCKET } from '@/lib/commerce/storage'

export const dynamic = 'force-dynamic'

// Uploads go through this handler rather than straight to Supabase Storage
// from the browser, because this project has no anon key — the only Supabase
// credential that exists is the service-role key, and that must never reach a
// client bundle. So the file arrives here, gets checked, and is written with
// the server client into a PRIVATE bucket.

/** Matches the bucket's own file_size_limit in migration 0013. Both exist:
 *  this one gives the seller a sentence, the bucket's is the backstop. */
const MAX_BYTES = 50 * 1024 * 1024

const MAX_ASSETS_PER_PRODUCT = 25

// Deliberately a list of what a digital product actually is, not a list of
// what is dangerous. An allow-list cannot be out-thought the way a block-list
// can, and nothing here executes in a browser that opens it.
const ALLOWED_MIME = new Set([
  'application/pdf',
  'application/zip',
  'application/x-zip-compressed',
  'application/epub+zip',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/csv',
  'image/png',
  'image/jpeg',
  'image/webp',
  'audio/mpeg',
  'video/mp4',
])

/** Strips directory traversal and anything that would confuse a storage path.
 *  The stored path is generated anyway; this only keeps the display name sane. */
function safeFileName(name: string): string {
  return (
    name
      .replace(/[/\\]/g, '_')
      .replace(/[^\w.\- ()ঀ-৿]/g, '')
      .trim()
      .slice(0, 120) || 'file'
  )
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ productId: string }> }
) {
  const resolved = await requireSellerId()
  if (resolved.error) return resolved.error
  const { userId } = resolved
  const { productId } = await params

  const { allowed } = await checkRateLimit('product-asset-upload', userId, {
    max: 60,
    windowSeconds: 3600,
  })
  if (!allowed) {
    return NextResponse.json({ message: 'Too many uploads. Try again later.' }, { status: 429 })
  }

  const owned = await requireOwnedProduct(productId, userId)
  if (!owned) return NextResponse.json({ message: 'Product not found.' }, { status: 404 })

  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return NextResponse.json({ message: 'Invalid upload.' }, { status: 400 })
  }

  const file = form.get('file')
  if (!(file instanceof File)) {
    return NextResponse.json({ message: 'Choose a file to upload.' }, { status: 400 })
  }

  if (file.size === 0) {
    return NextResponse.json({ message: 'That file is empty.' }, { status: 400 })
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { message: `Files must be under ${MAX_BYTES / 1024 / 1024} MB.` },
      { status: 413 }
    )
  }

  const mime = file.type || 'application/octet-stream'
  if (!ALLOWED_MIME.has(mime)) {
    return NextResponse.json(
      { message: 'That file type is not supported. Use PDF, ZIP, DOCX, XLSX, images, audio or MP4.' },
      { status: 415 }
    )
  }

  try {
    const supabase = getSupabaseAdmin()

    const { count } = await supabase
      .from('unreal_bs_product_assets')
      .select('id', { count: 'exact', head: true })
      .eq('product_id', productId)

    if ((count ?? 0) >= MAX_ASSETS_PER_PRODUCT) {
      return NextResponse.json(
        { message: `A product can have at most ${MAX_ASSETS_PER_PRODUCT} files.` },
        { status: 400 }
      )
    }

    const fileName = safeFileName(file.name)
    // Path includes the seller id so a bucket listing is readable during
    // support, and a random segment so the path cannot be guessed from the
    // product id alone even if the bucket were ever made public by mistake.
    const storagePath = `${userId}/${productId}/${crypto.randomUUID()}-${fileName}`

    const { error: uploadError } = await supabase.storage
      .from(PRODUCT_BUCKET)
      .upload(storagePath, file, { contentType: mime, upsert: false })

    if (uploadError) {
      await logError('product-asset-upload', uploadError, { productId, userId })
      return NextResponse.json(
        {
          message:
            'Could not save that file. If this keeps happening, check that the product-files bucket exists in Supabase Storage.',
        },
        { status: 502 }
      )
    }

    const { data, error } = await supabase
      .from('unreal_bs_product_assets')
      .insert({
        product_id: productId,
        storage_path: storagePath,
        file_name: fileName,
        size_bytes: file.size,
        mime_type: mime,
        position: count ?? 0,
      })
      .select('id, file_name, size_bytes, mime_type')
      .single()

    if (error) {
      // The row is the thing that makes the file reachable, so an orphaned
      // object in the bucket is worse than useless — remove it rather than
      // leaving storage the seller pays for and nobody can see.
      await supabase.storage.from(PRODUCT_BUCKET).remove([storagePath])
      await logError('product-asset-insert', error, { productId })
      return dbNotReady()
    }

    return NextResponse.json(
      {
        asset: {
          id: data.id,
          fileName: data.file_name,
          sizeBytes: Number(data.size_bytes),
          mimeType: data.mime_type,
        },
      },
      { status: 201 }
    )
  } catch (err) {
    await logError('product-asset-upload', err, { productId })
    return dbNotReady()
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ productId: string }> }
) {
  const resolved = await requireSellerId()
  if (resolved.error) return resolved.error
  const { userId } = resolved
  const { productId } = await params

  const assetId = new URL(request.url).searchParams.get('assetId')
  if (!assetId) return NextResponse.json({ message: 'Missing asset.' }, { status: 400 })

  const owned = await requireOwnedProduct(productId, userId)
  if (!owned) return NextResponse.json({ message: 'Product not found.' }, { status: 404 })

  try {
    const supabase = getSupabaseAdmin()

    const { data: asset } = await supabase
      .from('unreal_bs_product_assets')
      .select('id, storage_path')
      .eq('id', assetId)
      .eq('product_id', productId)
      .maybeSingle()

    if (!asset) return NextResponse.json({ message: 'File not found.' }, { status: 404 })

    const { error } = await supabase
      .from('unreal_bs_product_assets')
      .delete()
      .eq('id', assetId)
      .eq('product_id', productId)

    if (error) {
      await logError('product-asset-delete', error, { productId, assetId })
      return dbNotReady()
    }

    // Row first, object second: if this fails the file is already unreachable,
    // which is the safe direction to fail in.
    await supabase.storage.from(PRODUCT_BUCKET).remove([asset.storage_path])

    return NextResponse.json({ ok: true })
  } catch (err) {
    await logError('product-asset-delete', err, { productId })
    return dbNotReady()
  }
}
