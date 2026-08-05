import { describe, expect, it, vi } from 'vitest'
import { z } from 'zod'

vi.mock('server-only', () => ({}))

import { readJson } from './request'

const schema = z.object({ name: z.string().max(10) })

describe('JSON mutation guard', () => {
  it('accepts bounded same-origin JSON', async () => {
    const request = new Request('https://www.unreal-bs.shop/api/example', {
      method: 'POST',
      headers: { origin: 'https://www.unreal-bs.shop', 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'ok' }),
    })
    const result = await readJson(request, schema, { maxBytes: 100 })
    expect(result.error).toBeUndefined()
    expect(result.data).toEqual({ name: 'ok' })
  })

  it('rejects cross-origin, wrong content type, and oversized bodies', async () => {
    const crossOrigin = await readJson(new Request('https://www.unreal-bs.shop/api/example', {
      method: 'POST', headers: { origin: 'https://evil.example', 'content-type': 'application/json' }, body: '{}',
    }), schema)
    expect(crossOrigin.error?.status).toBe(403)

    const wrongType = await readJson(new Request('https://www.unreal-bs.shop/api/example', {
      method: 'POST', headers: { origin: 'https://www.unreal-bs.shop', 'content-type': 'text/plain' }, body: '{}',
    }), schema)
    expect(wrongType.error?.status).toBe(415)

    const oversized = await readJson(new Request('https://www.unreal-bs.shop/api/example', {
      method: 'POST', headers: { origin: 'https://www.unreal-bs.shop', 'content-type': 'application/json' }, body: JSON.stringify({ name: '1234567890' }),
    }), schema, { maxBytes: 5 })
    expect(oversized.error?.status).toBe(413)
  })
})
