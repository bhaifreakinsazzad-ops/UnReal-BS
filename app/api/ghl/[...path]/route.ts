import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'

const GHL_BASE_URL = 'https://services.leadconnectorhq.com'
const GHL_TOKEN = process.env.GHL_PRIVATE_TOKEN
const GHL_LOCATION_ID = process.env.GHL_LOCATION_ID

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
  const searchParams = request.nextUrl.searchParams.toString()
  const url = `${GHL_BASE_URL}${pathname}${searchParams ? '?' + searchParams : ''}`

  const headers: Record<string, string> = {
    'Authorization': `Bearer ${GHL_TOKEN}`,
    'Version': '2021-07-28',
    'Content-Type': 'application/json',
    'Location': GHL_LOCATION_ID,
  }

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
