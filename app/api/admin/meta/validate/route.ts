import { NextResponse } from 'next/server'
import { z } from 'zod'
import { validateMetaDatasetConnection } from '@/lib/meta/capi'
import { checkRateLimit } from '@/lib/rate-limit'
import { requireAdminSession } from '@/lib/security/admin'
import { hasFreshStepUp } from '@/lib/security/step-up'
import { opaqueRateKey, readJson } from '@/lib/security/request'

export const dynamic = 'force-dynamic'

const schema = z.object({}).strict()

export async function POST(request: Request) {
  const admin = await requireAdminSession({ hide: false })
  if (admin.error) return admin.error
  if (!hasFreshStepUp(request, admin.email)) {
    return NextResponse.json(
      { message: 'Re-enter your password before validating Meta configuration.', code: 'REVERIFY_REQUIRED' },
      { status: 428 }
    )
  }

  const parsed = await readJson(request, schema, { maxBytes: 1024 })
  if (parsed.error) return parsed.error
  const limit = await checkRateLimit(
    'admin-meta-dataset-validation',
    opaqueRateKey(admin.email),
    { max: 5, windowSeconds: 3600, failClosed: true }
  )
  if (!limit.allowed) {
    return NextResponse.json(
      { message: 'Too many validation attempts. Try again later.' },
      { status: 429, headers: { 'x-request-id': parsed.requestId } }
    )
  }

  const validation = await validateMetaDatasetConnection()
  if (!validation.configured) {
    return NextResponse.json(
      { ok: false, message: 'Meta dataset validation is not configured.', missing: validation.missing },
      { status: 503, headers: { 'x-request-id': parsed.requestId, 'cache-control': 'no-store' } }
    )
  }
  if (!validation.ok) {
    return NextResponse.json(
      {
        ok: false,
        message: 'Meta did not acknowledge the test event.',
        status: validation.status,
        errorCode: validation.errorCode,
        traceId: validation.traceId,
      },
      { status: 502, headers: { 'x-request-id': parsed.requestId, 'cache-control': 'no-store' } }
    )
  }
  return NextResponse.json(
    {
      ok: true,
      message: 'Meta acknowledged the dataset test event.',
      destination: validation.destination,
      eventId: validation.eventId,
      eventsReceived: validation.eventsReceived,
      traceId: validation.traceId,
    },
    { headers: { 'x-request-id': parsed.requestId, 'cache-control': 'no-store' } }
  )
}
