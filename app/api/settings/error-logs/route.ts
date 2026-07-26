import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/client'

export const dynamic = 'force-dynamic'

// ADMIN ONLY. unreal_bs_error_logs is a single global stream written by every
// route — it has no user_id column, so it cannot be scoped per tenant. It was
// previously served to any authenticated user, exposing platform-wide failures
// including upstream response bodies embedded in `message` (see
// lib/ghl/client.ts, which puts up to 500 chars of the GHL error body there).
// Any user can also plant text into it via POST /api/log-error.
//
// Returns 404 rather than 403 so the endpoint's existence isn't confirmed to
// non-admins — same convention as app/api/admin/virtual-cards/*.
export async function GET() {
  const session = await auth()
  const email = session?.user?.email
  const adminEmail = process.env.ADMIN_EMAIL
  if (!email || !adminEmail || email !== adminEmail) {
    return NextResponse.json({ message: 'Not found.' }, { status: 404 })
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ logs: [] })
  }

  try {
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('unreal_bs_error_logs')
      .select('id, source, message, created_at')
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) return NextResponse.json({ logs: [] })
    return NextResponse.json({ logs: data ?? [] })
  } catch {
    return NextResponse.json({ logs: [] })
  }
}
