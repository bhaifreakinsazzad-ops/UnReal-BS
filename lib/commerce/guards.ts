import 'server-only'
import { NextResponse } from 'next/server'
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/client'
import { resolveUserIdByEmail } from '@/lib/supabase/user'
import { commerceEnabledFor, marketplaceSellersEnabled } from '@/lib/commerce/flags'
import { ensurePlatformOwnerUserId, requireAdminSession } from '@/lib/security/admin'

// Shared route guards for the commerce surface.
//
// Migration 0015 removes browser-role commerce access and leaves service-role
// policies only. Route guards remain a required second boundary so operator
// intent, feature flags and platform ownership are enforced before a query.

export const DB_NOT_READY_MESSAGE =
  'Digital products are not available yet. Run supabase/migrations/0013_digital_products.sql.'

export function dbNotReady() {
  return NextResponse.json({ message: DB_NOT_READY_MESSAGE }, { status: 502 })
}

/** The signed-in seller's unreal_bs_users.id, or a response to return. */
export async function requireSellerId(): Promise<
  { userId: string; error?: never } | { userId?: never; error: NextResponse }
> {
  const admin = await requireAdminSession({ hide: false })
  if (admin.error) return { error: admin.error }
  const email = admin.email
  if (!commerceEnabledFor(email)) {
    return { error: NextResponse.json({ message: 'Commerce is not enabled for this account.' }, { status: 403 }) }
  }
  if (!isSupabaseConfigured()) return { error: dbNotReady() }

  try {
    const userId = await resolveUserIdByEmail(email) ?? await ensurePlatformOwnerUserId()
    if (!userId) return { error: dbNotReady() }
    return { userId }
  } catch {
    return { error: dbNotReady() }
  }
}

/** 404 for anyone who is not the operator — deliberately not 403, so the admin
 *  surface does not confirm its own existence to a probing account. Mirrors
 *  app/api/admin/ad-campaigns/route.ts. */
export async function requireAdmin(): Promise<{ ok: true; email: string } | { error: NextResponse }> {
  const admin = await requireAdminSession()
  if (admin.error) return { error: admin.error }
  if (!commerceEnabledFor(admin.email)) {
    return { error: NextResponse.json({ message: 'Commerce is not enabled for this account.' }, { status: 403 }) }
  }
  if (!isSupabaseConfigured()) return { error: dbNotReady() }
  return { ok: true, email: admin.email }
}

export function marketplaceDisabled() {
  return marketplaceSellersEnabled()
    ? null
    : NextResponse.json({ message: 'Marketplace selling and payouts are disabled for this launch.' }, { status: 403 })
}

/** Confirms this seller owns this product before anything is read or written
 *  through it. Returns the product's own row so callers do not fetch twice. */
export async function requireOwnedProduct(productId: string, sellerId: string) {
  const supabase = getSupabaseAdmin()
  const { data } = await supabase
    .from('unreal_bs_digital_products')
    .select('id, seller_id, platform_owned, kind, slug, title, status, price_bdt, sales_count')
    .eq('id', productId)
    .eq('seller_id', sellerId)
    .eq('platform_owned', true)
    .maybeSingle()
  return data
}
