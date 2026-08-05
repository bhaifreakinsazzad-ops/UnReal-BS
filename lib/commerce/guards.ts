import 'server-only'
import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/client'
import { resolveUserIdByEmail } from '@/lib/supabase/user'

// Shared route guards for the commerce surface.
//
// RLS on every table in this project is permissive (`using(true)`), so route
// code is the ONLY thing standing between one seller and another seller's
// products, orders and payouts. Centralising the checks means there is one
// place to read to know they are right, rather than six near-copies where the
// seventh quietly forgets the ownership filter.

export const DB_NOT_READY_MESSAGE =
  'Digital products are not available yet. Run supabase/migrations/0013_digital_products.sql.'

export function dbNotReady() {
  return NextResponse.json({ message: DB_NOT_READY_MESSAGE }, { status: 502 })
}

/** The signed-in seller's unreal_bs_users.id, or a response to return. */
export async function requireSellerId(): Promise<
  { userId: string; error?: never } | { userId?: never; error: NextResponse }
> {
  const session = await auth()
  const email = session?.user?.email
  if (!email) {
    return { error: NextResponse.json({ message: 'Authentication required.' }, { status: 401 }) }
  }
  if (!isSupabaseConfigured()) return { error: dbNotReady() }

  try {
    const userId = await resolveUserIdByEmail(email)
    if (!userId) return { error: dbNotReady() }
    return { userId }
  } catch {
    return { error: dbNotReady() }
  }
}

/** 404 for anyone who is not the operator — deliberately not 403, so the admin
 *  surface does not confirm its own existence to a probing account. Mirrors
 *  app/api/admin/ad-campaigns/route.ts. */
export async function requireAdmin(): Promise<{ ok: true } | { error: NextResponse }> {
  const session = await auth()
  const email = session?.user?.email
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase()
  if (!email || !adminEmail || email.trim().toLowerCase() !== adminEmail) {
    return { error: NextResponse.json({ message: 'Not found.' }, { status: 404 }) }
  }
  if (!isSupabaseConfigured()) return { error: dbNotReady() }
  return { ok: true }
}

/** Confirms this seller owns this product before anything is read or written
 *  through it. Returns the product's own row so callers do not fetch twice. */
export async function requireOwnedProduct(productId: string, sellerId: string) {
  const supabase = getSupabaseAdmin()
  const { data } = await supabase
    .from('unreal_bs_digital_products')
    .select('id, seller_id, kind, slug, title, status, price_bdt, sales_count')
    .eq('id', productId)
    .eq('seller_id', sellerId)
    .maybeSingle()
  return data
}
