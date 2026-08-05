import { NextResponse } from 'next/server'
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/client'
import { checkRateLimit } from '@/lib/rate-limit'
import { logError } from '@/lib/log-error'
import { PRODUCT_BUCKET, SIGNED_URL_TTL_SECONDS } from '@/lib/commerce/storage'
import { hashAccessToken } from '@/lib/commerce/access-token'
import { storefrontEnabledForRequest } from '@/lib/commerce/flags'

export const dynamic = 'force-dynamic'

// PUBLIC, keyed on the order's access token.
//
// The bucket is private, so there is no URL that works without going through
// here. Every request re-checks that the order is PAID and that the asset
// belongs to the product that order is for, then mints a URL that dies in a
// minute. A link forwarded to a group chat is dead before it is useful, and
// revoking access is simply refunding the order.

const TOKEN = /^[A-Za-z0-9_-]{40,64}$/
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ accessToken: string; assetId: string }> }
) {
  if (!(await storefrontEnabledForRequest())) return new NextResponse(null, { status: 404 })
  const { accessToken, assetId } = await params
  if (!TOKEN.test(accessToken) || !UUID.test(assetId)) {
    return NextResponse.json({ message: 'Not found.' }, { status: 404 })
  }
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ message: 'Not available right now.' }, { status: 502 })
  }

  const { allowed } = await checkRateLimit('learn-download', hashAccessToken(accessToken), {
    max: 100,
    windowSeconds: 3600,
    failClosed: true,
  })
  if (!allowed) {
    return NextResponse.json({ message: 'Too many downloads. Try again later.' }, { status: 429 })
  }

  try {
    const supabase = getSupabaseAdmin()

    const { data: order } = await supabase
      .from('unreal_bs_orders')
      .select('product_id, status')
      .eq('access_token_hash', hashAccessToken(accessToken))
      .maybeSingle()

    // Deliberately the same 404 for "no such order" and "not paid" — a probe
    // learns nothing about which orders exist.
    if (!order || order.status !== 'paid') {
      return NextResponse.json({ message: 'Not found.' }, { status: 404 })
    }

    // Scoped to this order's product, so an asset id copied from somewhere
    // else matches nothing.
    const { data: asset } = await supabase
      .from('unreal_bs_product_assets')
      .select('id, storage_path, file_name')
      .eq('id', assetId)
      .eq('product_id', order.product_id)
      .maybeSingle()

    if (!asset) return NextResponse.json({ message: 'Not found.' }, { status: 404 })

    const { data: signed, error } = await supabase.storage
      .from(PRODUCT_BUCKET)
      .createSignedUrl(asset.storage_path, SIGNED_URL_TTL_SECONDS, { download: asset.file_name })

    if (error || !signed?.signedUrl) {
      await logError('learn-download-sign', error, { assetId })
      return NextResponse.json({ message: 'Could not prepare that download.' }, { status: 502 })
    }

    // 302 rather than a JSON body, so an <a href> just works on a phone.
    return NextResponse.redirect(signed.signedUrl, 302)
  } catch (err) {
    await logError('learn-download', err, { assetId })
    return NextResponse.json({ message: 'Could not prepare that download.' }, { status: 502 })
  }
}
