import 'server-only'

const GHL_BASE_URL = 'https://services.leadconnectorhq.com'
const GHL_TOKEN = process.env.GHL_PRIVATE_TOKEN!

export interface GHLRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  body?: unknown
  locationId?: string
}

export async function ghlFetch<T = unknown>(
  path: string,
  options: GHLRequestOptions = {}
): Promise<T> {
  const { method = 'GET', body, locationId } = options

  const headers: Record<string, string> = {
    Authorization: `Bearer ${GHL_TOKEN}`,
    'Content-Type': 'application/json',
    Version: '2021-07-28',
  }

  if (locationId) {
    headers['locationId'] = locationId
  }

  const res = await fetch(`${GHL_BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  })

  if (!res.ok) {
    const error = await res.text()
    throw new Error(`GHL API Error ${res.status}: ${error}`)
  }

  return res.json() as Promise<T>
}
