import { NextResponse } from 'next/server'
import { z } from 'zod'
import { addContactTags, upsertContact } from '@/lib/ghl/contacts'
import { checkRateLimit } from '@/lib/rate-limit'
import { logError } from '@/lib/log-error'
import { attributionSchema } from '@/lib/meta/attribution'
import { sendMetaEvent } from '@/lib/meta/capi'
import { clientIp, opaqueRateKey, readJson } from '@/lib/security/request'
import { verifyTurnstile } from '@/lib/security/turnstile'

const LOCATION_ID = process.env.GHL_LOCATION_ID
const optional = (max: number) => z.string().trim().max(max).optional().or(z.literal(''))

const schema = z.object({
  businessName: z.string().trim().min(1, 'Business name is required').max(160),
  ownerName: z.string().trim().min(1, 'Owner name is required').max(120),
  phone: z.string().trim().min(6, 'Phone is required').max(30),
  email: z.string().trim().email('Email must be valid').max(200).optional().or(z.literal('')),
  businessType: z.string().trim().min(1, 'Business type is required').max(100),
  serviceCategory: optional(120),
  serviceArea: z.string().trim().min(1, 'Service area is required').max(160),
  averageOrderValue: optional(60),
  monthlyInquiries: optional(60),
  teamSize: optional(60),
  mainProblem: z.string().trim().min(1, 'Main problem is required').max(2000),
  wantsOpportunityCredit: z.enum(['yes', 'no']).default('yes'),
  preferredContact: optional(40),
  intent: optional(80),
  service: optional(120),
  campaignKeyword: optional(100),
  website: z.string().max(0).optional().or(z.literal('')),
  turnstileToken: z.string().max(2048).optional().default(''),
}).extend(attributionSchema.shape)

export async function POST(request: Request) {
  if (!process.env.GHL_PRIVATE_TOKEN || !LOCATION_ID) {
    return NextResponse.json({ message: 'Application intake is temporarily unavailable. Please try again later.' }, { status: 503 })
  }

  const parsed = await readJson(request, schema, { maxBytes: 32 * 1024 })
  if (parsed.error) return parsed.error
  const application = parsed.data
  const ip = clientIp(request)
  const limit = await checkRateLimit('applications-ip', opaqueRateKey(ip), { max: 5, windowSeconds: 3600, failClosed: true })
  if (!limit.allowed) {
    return NextResponse.json({ message: 'Too many applications submitted. Please try again later.' }, { status: 429, headers: { 'x-request-id': parsed.requestId } })
  }

  if (!(await verifyTurnstile(application.turnstileToken, ip, new URL(request.url).hostname))) {
    return NextResponse.json({ message: 'Human verification failed. Please try again.' }, { status: 400, headers: { 'x-request-id': parsed.requestId } })
  }

  if (application.website) {
    return NextResponse.json({ message: 'Application received. Our team will verify eligibility.' }, { headers: { 'x-request-id': parsed.requestId } })
  }

  const tags = [
    'UNREAL-BS-APPLICANT',
    'ELIGIBILITY-PENDING',
    'SOURCE-LANDING-PAGE',
    application.wantsOpportunityCredit === 'yes' ? 'WANTS-OPPORTUNITY-CREDIT' : '',
    application.intent === 'service' ? 'UNREAL-BS-SERVICE-LEAD' : '',
    application.service ? `SERVICE-${application.service.toUpperCase().replace(/[^A-Z0-9]+/g, '-')}` : '',
  ].filter(Boolean)
  const sourceSummary = [
    'UNREAL BS Eligibility Application',
    `Business: ${application.businessName}`,
    `Type: ${application.businessType}`,
    `Area: ${application.serviceArea}`,
    `Problem: ${application.mainProblem}`,
    application.intent ? `Intent: ${application.intent}` : '',
  ].filter(Boolean).join(' | ').slice(0, 500)

  try {
    const response = await upsertContact(LOCATION_ID, {
      firstName: application.ownerName,
      companyName: application.businessName,
      email: application.email || undefined,
      phone: application.phone,
      source: sourceSummary,
    })
    const contactId = response.contact?.id
    if (contactId) await addContactTags(contactId, LOCATION_ID, tags)

    if (application.eventId) {
      await sendMetaEvent({
        eventName: 'Lead',
        eventId: application.eventId,
        eventSourceUrl: application.landingPage || new URL(request.url).origin + '/apply',
        attribution: application,
        email: application.email || null,
        phone: application.phone,
        clientIp: ip,
        userAgent: request.headers.get('user-agent'),
      })
    }
    return NextResponse.json({ message: 'Application received. Our team will verify eligibility.' }, { headers: { 'x-request-id': parsed.requestId } })
  } catch (err) {
    await logError('applications-route', err, { requestId: parsed.requestId })
    return NextResponse.json({ message: 'Application could not be submitted right now. Please contact the team or try again later.' }, { status: 502, headers: { 'x-request-id': parsed.requestId } })
  }
}
