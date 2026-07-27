import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getTenantLocationId } from '@/lib/tenant'

const GHL_BASE_URL = 'https://services.leadconnectorhq.com'
const GHL_TOKEN = process.env.GHL_PRIVATE_TOKEN

const allowedRoutes: Array<{
  method: string
  pattern: RegExp
  versions?: Array<'v3' | '2023-02-21' | '2021-07-28' | '2021-04-15'>
}> = [
  { method: 'GET', pattern: /^\/contacts\/?$/ },
  { method: 'POST', pattern: /^\/contacts\/?$/ },
  { method: 'POST', pattern: /^\/contacts\/upsert$/, versions: ['v3'] },
  { method: 'GET', pattern: /^\/contacts\/[^/]+$/ },
  { method: 'PUT', pattern: /^\/contacts\/[^/]+$/ },
  // DELETE /contacts/{id} deliberately NOT allow-listed. Nothing in the app
  // calls it, and this proxy only authenticates — it does not verify that the
  // id belongs to the caller. With every tenant sharing one GHL location, an
  // allow-listed DELETE lets any signed-in user destroy another merchant's
  // contacts. Do not re-add without server-side ownership verification.
  { method: 'POST', pattern: /^\/contacts\/[^/]+\/tags$/ },
  { method: 'GET', pattern: /^\/conversations\/search$/ },
  { method: 'GET', pattern: /^\/conversations\/[^/]+\/messages$/ },
  { method: 'POST', pattern: /^\/conversations\/messages$/ },
  { method: 'PUT', pattern: /^\/conversations\/[^/]+\/read$/ },
  { method: 'GET', pattern: /^\/workflows\/?$/ },
  { method: 'GET', pattern: /^\/funnels\/?$/ },
  { method: 'GET', pattern: /^\/funnels\/funnel\/list$/ },
  { method: 'GET', pattern: /^\/funnels\/[^/]+\/pages$/ },
  { method: 'GET', pattern: /^\/locations\/[^/]+$/ },
  // PUT /locations/{id} deliberately NOT allow-listed — same reasoning as
  // DELETE /contacts above. Nothing calls it, and it would let any signed-in
  // user rewrite the shared location every tenant depends on.
  { method: 'GET', pattern: /^\/locations\/[^/]+\/stats$/ },
  { method: 'GET', pattern: /^\/opportunities\/pipelines$/ },
  { method: 'GET', pattern: /^\/opportunities\/search$/ },
  // Added per GHL scope expansion (2026-07-25) — see lib/ghl/calendars.ts,
  // forms.ts, products.ts, invoices.ts, custom-fields.ts. These will 403 at
  // the GHL API level (not here) until the Private Integration Token is
  // granted the matching scopes in the GHL dashboard.
  { method: 'GET', pattern: /^\/calendars\/?$/ },
  { method: 'GET', pattern: /^\/forms\/?$/, versions: ['v3'] },
  { method: 'GET', pattern: /^\/products\/?$/ },
  { method: 'GET', pattern: /^\/invoices\/?$/ },
  { method: 'GET', pattern: /^\/custom-fields\/object-key\/[^/]+$/ },
]

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(request, params, 'GET')
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(request, params, 'POST')
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(request, params, 'PUT')
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(request, params, 'DELETE')
}

async function proxyRequest(
  request: NextRequest,
  paramsPromise: Promise<{ path: string[] }>,
  method: string
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  if (!GHL_TOKEN) {
    return NextResponse.json({ error: 'GHL token not configured' }, { status: 500 })
  }

  // Per-tenant location. Previously every authenticated caller was served the
  // single env-configured GHL_LOCATION_ID, so any signed-in user read and
  // wrote the same shared sub-account — a cross-tenant leak the moment more
  // than one person can sign up. A user with no workspace provisioned gets a
  // clean 409 rather than somebody else's CRM.
  const tenantLocationId = await getTenantLocationId()
  if (!tenantLocationId) {
    return NextResponse.json(
      {
        error: 'No workspace connected to this account yet.',
        code: 'NO_WORKSPACE',
      },
      { status: 409 }
    )
  }

  const { path } = await paramsPromise
  const pathname = '/' + path.join('/')
  const pathAllowed = allowedRoutes.some((route) => route.pattern.test(pathname))
  if (!pathAllowed) {
    return NextResponse.json({ error: 'GHL route is not allowed' }, { status: 403 })
  }

  const allowedRoute = allowedRoutes.find((route) => route.method === method && route.pattern.test(pathname))
  if (!allowedRoute) {
    return NextResponse.json({ error: 'Method is not allowed for this GHL route' }, { status: 405 })
  }

  // Many GHL endpoints accept locationId as a QUERY parameter, and the client's
  // query string is forwarded verbatim. Without this override a caller could
  // simply append ?locationId=<someone else's location> and read another
  // tenant's data despite the header being set correctly. Force it to the
  // resolved tenant on every request.
  const forwardedParams = new URLSearchParams(request.nextUrl.searchParams)
  if (forwardedParams.has('locationId')) {
    forwardedParams.set('locationId', tenantLocationId)
  }
  const searchParams = forwardedParams.toString()
  const url = `${GHL_BASE_URL}${pathname}${searchParams ? '?' + searchParams : ''}`
  const version = allowedRoute.versions?.[0] ?? '2021-07-28'

  const headers: Record<string, string> = {
    'Authorization': `Bearer ${GHL_TOKEN}`,
    'Version': version,
    'Content-Type': 'application/json',
    'locationId': tenantLocationId,
  }

  const body = method !== 'GET' && method !== 'DELETE'
    ? await request.text()
    : undefined

  try {
    const res = await fetch(url, { method, headers, body })
    const text = await res.text()
    const data = text ? JSON.parse(text) : {}
    if (!res.ok) {
      return NextResponse.json({ error: 'GHL request failed' }, { status: res.status })
    }
    return NextResponse.json(data, { status: res.status })
  } catch {
    return NextResponse.json({ error: 'GHL proxy error' }, { status: 502 })
  }
}
