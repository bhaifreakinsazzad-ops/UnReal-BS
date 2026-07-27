import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/auth'
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/client'
import { logError } from '@/lib/log-error'

export const dynamic = 'force-dynamic'

const DB_NOT_READY_MESSAGE = 'Database not yet configured.'

// Admin-only user roster + workspace provisioning.
//
// New accounts register with ghl_location_id = null, and lib/tenant.ts refuses
// to substitute the shared environment location for them. This endpoint is how
// an operator hands a customer their own GHL sub-account — previously that
// column could only be set by hand-written SQL.

const patchSchema = z.object({
  userId: z.string().uuid(),
  // Null clears the assignment (revokes CRM access without deleting the
  // account — their wallet and khata keep working).
  ghlLocationId: z.string().trim().min(1).max(100).nullable(),
})

async function requireAdmin() {
  const session = await auth()
  const email = session?.user?.email
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase()
  if (!email || !adminEmail || email.trim().toLowerCase() !== adminEmail) {
    return { error: NextResponse.json({ message: 'Not found.' }, { status: 404 }) }
  }
  if (!isSupabaseConfigured()) {
    return { error: NextResponse.json({ message: DB_NOT_READY_MESSAGE }, { status: 502 }) }
  }
  return {}
}

export async function GET() {
  const resolved = await requireAdmin()
  if (resolved.error) return resolved.error

  try {
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('unreal_bs_users')
      .select('id, email, business_name, ghl_location_id, role, created_at')
      .order('created_at', { ascending: false })
      .limit(200)

    if (error) {
      await logError('admin-users-get', error)
      return NextResponse.json({ message: DB_NOT_READY_MESSAGE }, { status: 502 })
    }

    // password_hash is deliberately never selected.
    return NextResponse.json({
      users: (data ?? []).map((u) => ({
        id: u.id,
        email: u.email,
        businessName: u.business_name,
        ghlLocationId: u.ghl_location_id,
        role: u.role,
        createdAt: u.created_at,
      })),
    })
  } catch (err) {
    await logError('admin-users-get', err)
    return NextResponse.json({ message: DB_NOT_READY_MESSAGE }, { status: 502 })
  }
}

export async function PATCH(request: Request) {
  const resolved = await requireAdmin()
  if (resolved.error) return resolved.error

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ message: 'Invalid request payload.' }, { status: 400 })
  }

  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ message: 'Invalid request payload.' }, { status: 400 })
  }

  const { userId, ghlLocationId } = parsed.data

  try {
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('unreal_bs_users')
      .update({ ghl_location_id: ghlLocationId })
      .eq('id', userId)
      .select('id, email, ghl_location_id')
      .single()

    if (error || !data) {
      await logError('admin-users-patch', error ?? new Error('no row'), { userId })
      return NextResponse.json({ message: 'Could not update this user.' }, { status: 502 })
    }

    return NextResponse.json({ user: { id: data.id, email: data.email, ghlLocationId: data.ghl_location_id } })
  } catch (err) {
    await logError('admin-users-patch', err, { userId })
    return NextResponse.json({ message: 'Could not update this user.' }, { status: 502 })
  }
}
