import { NextRequest, NextResponse } from 'next/server'

const GHL_BASE_URL = 'https://services.leadconnectorhq.com'
const GHL_TOKEN = process.env.GHL_PRIVATE_TOKEN

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
  if (!GHL_TOKEN) {
    return NextResponse.json({ error: 'GHL token not configured' }, { status: 500 })
  }

  const { path } = await paramsPromise
  const pathname = '/' + path.join('/')
  const searchParams = request.nextUrl.searchParams.toString()
  const url = `${GHL_BASE_URL}${pathname}${searchParams ? '?' + searchParams : ''}`

  const locationId = request.headers.get('x-location-id')
  const headers: Record<string, string> = {
    'Authorization': `Bearer ${GHL_TOKEN}`,
    'Version': '2021-07-28',
    'Content-Type': 'application/json',
  }
  if (locationId) headers['Location'] = locationId

  const body = method !== 'GET' && method !== 'DELETE'
    ? await request.text()
    : undefined

  try {
    const res = await fetch(url, { method, headers, body })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch {
    return NextResponse.json({ error: 'GHL proxy error' }, { status: 502 })
  }
}
