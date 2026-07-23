import 'server-only'

const GHL_BASE_URL = 'https://services.leadconnectorhq.com'
const GHL_TOKEN = process.env.GHL_PRIVATE_TOKEN!

export interface GHLRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  body?: unknown
  locationId?: string
  version?: 'v3' | '2023-02-21' | '2021-07-28' | '2021-04-15'
}

export class GHLRequestError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message)
    this.name = 'GHLRequestError'
  }
}

export async function ghlFetch<T = unknown>(
  path: string,
  options: GHLRequestOptions = {}
): Promise<T> {
  const { method = 'GET', body, locationId, version = '2021-07-28' } = options

  const headers: Record<string, string> = {
    Authorization: `Bearer ${GHL_TOKEN}`,
    'Content-Type': 'application/json',
    Version: version,
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
    throw new GHLRequestError(res.status, `GHL API Error ${res.status}: ${error.slice(0, 500)}`)
  }

  return res.json() as Promise<T>
}
