import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getSupabaseAdmin } from '@/lib/supabase/client'
import { logError } from '@/lib/log-error'
import { dbNotReady, requireSellerId } from '@/lib/commerce/guards'

export const dynamic = 'force-dynamic'

// The seller's public shop handle, so they can put ONE link in their Facebook
// page bio instead of a different one for every product.

const patchSchema = z.object({
  // Deliberately narrow: this becomes a URL that gets typed, read aloud and
  // pasted into Facebook. Lowercase letters, digits and hyphens only.
  storeSlug: z
    .string()
    .trim()
    .toLowerCase()
    .min(3)
    .max(40)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'invalid'),
  storeName: z.string().trim().max(80).optional(),
  storeBio: z.string().trim().max(500).optional(),
})

// Words that would let a shop URL impersonate part of the product itself.
const RESERVED = new Set([
  'admin',
  'api',
  'login',
  'signup',
  'settings',
  'products',
  'sales',
  'checkout',
  'learn',
  'shop',
  'p',
  'unreal-bs',
  'apply',
  'terms',
  'privacy',
  'support',
])

export async function GET() {
  const resolved = await requireSellerId()
  if (resolved.error) return resolved.error
  const { userId } = resolved

  try {
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('unreal_bs_users')
      .select('store_slug, store_name, store_bio, business_name')
      .eq('id', userId)
      .maybeSingle()

    if (error) {
      await logError('store-get', error, { userId })
      return dbNotReady()
    }

    return NextResponse.json({
      store: {
        storeSlug: data?.store_slug ?? null,
        storeName: data?.store_name ?? data?.business_name ?? null,
        storeBio: data?.store_bio ?? null,
      },
    })
  } catch (err) {
    await logError('store-get', err)
    return dbNotReady()
  }
}

export async function PATCH(request: Request) {
  const resolved = await requireSellerId()
  if (resolved.error) return resolved.error
  const { userId } = resolved

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ message: 'Invalid request payload.' }, { status: 400 })
  }

  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { message: 'Use 3–40 lowercase letters, numbers and hyphens — like "rahim-store".' },
      { status: 400 }
    )
  }

  const { storeSlug, storeName, storeBio } = parsed.data

  if (RESERVED.has(storeSlug)) {
    return NextResponse.json({ message: 'That name is not available.' }, { status: 409 })
  }

  try {
    const supabase = getSupabaseAdmin()
    const { error } = await supabase
      .from('unreal_bs_users')
      .update({
        store_slug: storeSlug,
        store_name: storeName || null,
        store_bio: storeBio || null,
      })
      .eq('id', userId)

    if (error) {
      if (/duplicate key|unique/i.test(error.message ?? '')) {
        return NextResponse.json(
          { message: 'Somebody already has that shop name. Try another.' },
          { status: 409 }
        )
      }
      await logError('store-update', error, { userId })
      return dbNotReady()
    }

    return NextResponse.json({ store: { storeSlug, storeName: storeName ?? null } })
  } catch (err) {
    await logError('store-update', err, { userId })
    return dbNotReady()
  }
}
