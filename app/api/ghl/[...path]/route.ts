import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'

const GHL_BASE_URL = 'https://services.leadconnectorhq.com'
const GHL_TOKEN = process.env.GHL_PRIVATE_TOKEN
const GHL_LOCATION_ID = process.env.GHL_LOCATION_ID

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
  { method: 'DELETE', pattern: /^\/contacts\/[^/]+$/ },
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
  { method: 'PUT', pattern: /^\/locations\/[^/]+$/ },
  { method: 'GET', pattern: /^\/locations\/[^/]+\/stats$/ },
  { method: 'GET', pattern: /^\/opportunities\/pipelines$/ },
  { method: 'GET', pattern: /^\/opportunities\/search$/ },
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
  if (!GHL_LOCATION_ID) {
    return NextResponse.json({ error: 'GHL location not configured' }, { status: 500 })
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

  const searchParams = request.nextUrl.searchParams.toString()
  const url = `${GHL_BASE_URL}${pathname}${searchParams ? '?' + searchParams : ''}`
  const version = allowedRoute.versions?.[0] ?? '2021-07-28'

  const headers: Record<string, string> = {
    'Authorization': `Bearer ${GHL_TOKEN}`,
    'Version': version,
    'Content-Type': 'application/json',
    'locationId': GHL_LOCATION_ID,
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
