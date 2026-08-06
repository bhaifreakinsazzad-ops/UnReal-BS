import { auth } from '@/auth'
import { clearStepUpCookie } from '@/lib/security/step-up'
import { NextResponse, type NextRequest } from 'next/server'

const UNSAFE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])
const REQUEST_ID = /^[A-Za-z0-9_-]{8,80}$/

function commerceCanary(email?: string | null): boolean {
  if (process.env.COMMERCE_ENABLED !== 'true' || !email) return false
  const normalized = email.trim().toLowerCase()
  const admin = process.env.ADMIN_EMAIL?.trim().toLowerCase()
  const canaries = new Set((process.env.COMMERCE_CANARY_EMAILS ?? '').split(',').map((entry) => entry.trim().toLowerCase()).filter(Boolean))
  return normalized === admin || canaries.has(normalized)
}

function csp(nonce: string): string {
  const isDev = process.env.NODE_ENV === 'development'
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://js.puter.com https://connect.facebook.net https://challenges.cloudflare.com${isDev ? " 'unsafe-eval'" : ''}`,
    `style-src 'self' 'nonce-${nonce}' 'unsafe-inline'`,
    "img-src 'self' data: blob: https://*.storage.googleapis.com https://storage.googleapis.com https://www.facebook.com",
    "font-src 'self' data:",
    "connect-src 'self' https://api.puter.com https://*.puter.com wss://*.puter.com https://www.facebook.com https://connect.facebook.net https://challenges.cloudflare.com",
    "frame-src 'self' https://www.youtube-nocookie.com https://www.youtube.com https://player.vimeo.com https://challenges.cloudflare.com",
    "media-src 'self' blob: https://*.storage.googleapis.com https://storage.googleapis.com",
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join('; ')
}

function mutationRejection(req: NextRequest, requestId: string): NextResponse | null {
  if (!req.nextUrl.pathname.startsWith('/api/') || !UNSAFE_METHODS.has(req.method) || req.nextUrl.pathname.startsWith('/api/auth/')) return null
  const origin = req.headers.get('origin')
  if (process.env.NODE_ENV === 'production' && (!origin || origin !== req.nextUrl.origin)) {
    return NextResponse.json({ message: 'Request origin was rejected.' }, { status: 403, headers: { 'x-request-id': requestId } })
  }
  const contentType = req.headers.get('content-type')?.toLowerCase() ?? ''
  const isAssetUpload = /^\/api\/products\/[^/]+\/assets/.test(req.nextUrl.pathname)
  if (isAssetUpload ? !contentType.startsWith('multipart/form-data') : !contentType.startsWith('application/json')) {
    return NextResponse.json({ message: 'Unsupported request content type.' }, { status: 415, headers: { 'x-request-id': requestId } })
  }
  const maxBytes = isAssetUpload ? 52 * 1024 * 1024 : 64 * 1024
  const contentLength = req.headers.get('content-length')
  if (process.env.NODE_ENV === 'production' && !contentLength) {
    return NextResponse.json({ message: 'Content-Length is required.' }, { status: 411, headers: { 'x-request-id': requestId } })
  }
  const declared = Number(contentLength ?? 0)
  if (Number.isFinite(declared) && declared > maxBytes) {
    return NextResponse.json({ message: 'Request payload is too large.' }, { status: 413, headers: { 'x-request-id': requestId } })
  }
  return null
}

export default auth((req) => {
  const { pathname } = req.nextUrl
  const isLoggedIn = !!req.auth
  const requestIdHeader = req.headers.get('x-request-id')?.trim()
  const requestId = requestIdHeader && REQUEST_ID.test(requestIdHeader) ? requestIdHeader : crypto.randomUUID()
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64')
  const policy = csp(nonce)
  const cspHeader = process.env.CSP_ENFORCE === 'true' ? 'Content-Security-Policy' : 'Content-Security-Policy-Report-Only'

  const rejected = mutationRejection(req, requestId)
  if (rejected) return rejected

  const requestHeaders = new Headers(req.headers)
  requestHeaders.set('x-request-id', requestId)
  requestHeaders.set('x-nonce', nonce)
  requestHeaders.set('Content-Security-Policy', policy)

  const isPublicAsset = /\.(?:png|jpg|jpeg|gif|webp|avif|svg|ico|txt|xml|json|webmanifest)$/i.test(pathname)
  const isStorefront = pathname.startsWith('/p/') || pathname.startsWith('/shop/') || pathname.startsWith('/checkout/') || pathname.startsWith('/learn/') || pathname.startsWith('/api/checkout') || pathname.startsWith('/api/learn')

  if (isStorefront && process.env.STORE_PUBLIC_ENABLED !== 'true' && !commerceCanary(req.auth?.user?.email)) {
    return new NextResponse(null, { status: 404, headers: { 'x-request-id': requestId, [cspHeader]: policy } })
  }

  const isPublic =
    isStorefront || pathname.startsWith('/login') || pathname.startsWith('/signup') || pathname.startsWith('/unreal-bs') || pathname.startsWith('/apply') || pathname.startsWith('/terms') || pathname.startsWith('/privacy') || pathname.startsWith('/api/applications') || pathname.startsWith('/api/auth') || pathname.startsWith('/api/health') || pathname.startsWith('/_next') || pathname === '/favicon.ico' || pathname === '/sw.js' || isPublicAsset

  let response: NextResponse
  if (!isPublic && !isLoggedIn) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    response = NextResponse.redirect(loginUrl)
  } else {
    response = NextResponse.next({ request: { headers: requestHeaders } })
  }
  response.headers.set('x-request-id', requestId)
  response.headers.set(cspHeader, policy)
  if (pathname.startsWith('/api/auth/signout') && req.method === 'POST') clearStepUpCookie(response)
  return response
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
