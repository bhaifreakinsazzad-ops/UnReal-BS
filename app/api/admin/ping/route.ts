import { NextResponse } from 'next/server'
import { auth } from '@/auth'

export const dynamic = 'force-dynamic'

// Tiny probe so client chrome (the sidebar) can decide whether to show the
// Admin link, without shipping ADMIN_EMAIL to the browser or adding a role
// claim to the JWT. Returns 404 for everyone else, matching the convention
// used by the admin routes themselves — a non-admin cannot even confirm the
// endpoint exists.
export async function GET() {
  const session = await auth()
  const email = session?.user?.email
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase()

  if (!email || !adminEmail || email.trim().toLowerCase() !== adminEmail) {
    return NextResponse.json({ message: 'Not found.' }, { status: 404 })
  }

  return NextResponse.json({ isAdmin: true })
}
