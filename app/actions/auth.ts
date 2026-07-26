'use server'

import { signOut } from '@/auth'

// Server action so the top-nav Logout button works without wrapping the whole
// app in a next-auth SessionProvider. Previously the button had no onClick at
// all — clicking it did nothing and the session stayed live, which is a real
// hazard on the shared/public computers many users here rely on.
export async function signOutAction() {
  await signOut({ redirectTo: '/login' })
}
