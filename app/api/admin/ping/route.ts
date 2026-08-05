import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { isAdminEmail } from '@/lib/security/admin'

export const dynamic = 'force-dynamic'

// Tiny probe so client chrome (the sidebar) can decide whether to show the
// Admin link, without shipping ADMIN_EMAIL to the browser or adding a role
// claim to the JWT. Returns 404 for everyone else, matching the convention
// used by the admin routes themselves — a non-admin cannot even confirm the
// endpoint exists.
export async function GET() {
  const session = await auth()
  const email = session?.user?.email
  if (!isAdminEmail(email)) {
    return NextResponse.json({ message: 'Not found.' }, { status: 404 })
  }

  return NextResponse.json({ isAdmin: true })
}
