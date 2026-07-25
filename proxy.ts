import { auth } from '@/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const { pathname } = req.nextUrl
  const isLoggedIn = !!req.auth
  const isPublicAsset = /\.(?:png|jpg|jpeg|gif|webp|avif|svg|ico|txt|xml|json|webmanifest)$/i.test(
    pathname
  )

  const isPublic =
    pathname.startsWith('/login') ||
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
