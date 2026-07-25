import { NextResponse } from 'next/server'
import { z } from 'zod'
import { addContactTags, upsertContact } from '@/lib/ghl/contacts'
import { checkRateLimit } from '@/lib/rate-limit'
import { logError } from '@/lib/log-error'

const LOCATION_ID = process.env.GHL_LOCATION_ID

const schema = z.object({
  businessName: z.string().trim().min(1, 'Business name is required'),
  ownerName: z.string().trim().min(1, 'Owner name is required'),
  phone: z.string().trim().min(1, 'Phone is required'),
  email: z.string().trim().email('Email must be valid').optional().or(z.literal('')),
  businessType: z.string().trim().min(1, 'Business type is required'),
  serviceCategory: z.string().trim().optional().or(z.literal('')),
  serviceArea: z.string().trim().min(1, 'Service area is required'),
  averageOrderValue: z.string().trim().optional().or(z.literal('')),
  monthlyInquiries: z.string().trim().optional().or(z.literal('')),
  teamSize: z.string().trim().optional().or(z.literal('')),
  mainProblem: z.string().trim().min(1, 'Main problem is required'),
  wantsOpportunityCredit: z.enum(['yes', 'no']).default('yes'),
  preferredContact: z.string().trim().optional().or(z.literal('')),
  intent: z.string().trim().optional().or(z.literal('')),
  service: z.string().trim().optional().or(z.literal('')),
  campaignKeyword: z.string().trim().optional().or(z.literal('')),
  // Honeypot: real users never see or fill this field (positioned off-screen,
  // not display:none, so simple bots that skip display:none checks still
  // fall for it). If it's filled, we quietly no-op the GHL upsert below.
  website: z.string().max(0).optional().or(z.literal('')),
})

export async function POST(request: Request) {
  if (!process.env.GHL_PRIVATE_TOKEN || !LOCATION_ID) {
    return NextResponse.json(
      { message: 'Application intake is temporarily unavailable. Please try again later.' },
      { status: 503 }
    )
  }

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const { allowed } = await checkRateLimit('applications', ip, { max: 5, windowSeconds: 3600 })
  if (!allowed) {
    return NextResponse.json(
      { message: 'Too many applications submitted. Please try again later.' },
      { status: 429 }
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ message: 'Invalid application payload.' }, { status: 400 })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      {
        message: 'Please check the required fields and submit again.',
        errors: parsed.error.flatten().fieldErrors,
      },
      { status: 400 }
    )
  }

  const application = parsed.data

  // Honeypot tripped — pretend success without touching GHL, so the bot
  // doesn't learn it was caught.
  if (application.website) {
    return NextResponse.json({
      message: 'Application received. Our team will verify eligibility.',
    })
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
    if (contactId) {
      await addContactTags(contactId, LOCATION_ID, tags)
    }

    return NextResponse.json({
      message: 'Application received. Our team will verify eligibility.',
      contactId,
    })
  } catch (err) {
    await logError('applications-route', err, { businessName: application.businessName })
    return NextResponse.json(
      { message: 'Application could not be submitted right now. Please contact the team or try again later.' },
      { status: 502 }
    )
  }
}
