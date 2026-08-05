import { auth } from '@/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const { pathname } = req.nextUrl
  const isLoggedIn = !!req.auth
  const isPublicAsset = /\.(?:png|jpg|jpeg|gif|webp|avif|svg|ico|txt|xml|json|webmanifest)$/i.test(
    pathname
  )

  // The storefront is public by design: a buyer arrives from a Facebook or
  // WhatsApp link with no account and must be able to see the product, pay for
  // it, and open what they bought. Every one of these routes authorises on its
  // own — a product page only serves `status = 'published'`, and everything
  // under /learn and /checkout is keyed on an unguessable per-order token that
  // the route re-checks against a PAID order on every request.
  const isStorefront =
    pathname.startsWith('/p/') ||
    pathname.startsWith('/shop/') ||
    pathname.startsWith('/checkout/') ||
    pathname.startsWith('/learn/') ||
    pathname.startsWith('/api/checkout') ||
    pathname.startsWith('/api/learn')

  const isPublic =
    isStorefront ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/signup') ||
    pathname.startsWith('/unreal-bs') ||
    pathname.startsWith('/apply') ||
    pathname.startsWith('/terms') ||
    pathname.startsWith('/privacy') ||
    pathname.startsWith('/api/applications') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/_next') ||
    pathname === '/favicon.ico' ||
    isPublicAsset

  if (isPublic) return NextResponse.next()

  if (!isLoggedIn) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
