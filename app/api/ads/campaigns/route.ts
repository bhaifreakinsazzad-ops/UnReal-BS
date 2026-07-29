import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/auth'
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/client'
import { resolveUserIdByEmail } from '@/lib/supabase/user'
import { checkRateLimit } from '@/lib/rate-limit'
import { logError } from '@/lib/log-error'
import { isMetaConfigured } from '@/lib/meta/client'
import { MIN_DAILY_BUDGET_BDT, validateCampaign } from '@/lib/meta/campaign-rules'

export const dynamic = 'force-dynamic'

const DB_NOT_READY_MESSAGE =
  'Ads are not available yet. Run the migration in supabase/migrations/0011_meta_ads.sql.'

// Ad spend is deliberately NOT taken from the UnReal BS wallet. The wallet is a
// prepaid AI balance with its own ledger; ad money is settled with the operator
// (managed mode) or charged to the customer's own Meta payment method (API
// mode). Mixing them would make the wallet ledger unreconcilable during a
// dispute, which is the one thing the money design has been careful to avoid.

const createSchema = z.object({
  name: z.string().trim().min(1).max(120),
  objective: z.enum(['awareness', 'traffic', 'engagement', 'leads', 'sales', 'messages']),
  platforms: z.array(z.enum(['facebook', 'instagram'])).min(1).max(2),
  dailyBudgetBdt: z.number().positive().max(1_000_000),
  durationDays: z.number().int().min(1).max(365),
  audienceLocation: z.string().trim().min(1).max(200),
  audienceAgeMin: z.number().int().min(13).max(65).default(18),
  audienceAgeMax: z.number().int().min(13).max(65).default(65),
  audienceGender: z.enum(['all', 'male', 'female']).default('all'),
  audienceInterests: z.string().trim().max(500).optional(),
  headline: z.string().trim().min(1).max(120),
  primaryText: z.string().trim().min(1).max(2000),
  callToAction: z.string().trim().min(1).max(40).default('LEARN_MORE'),
  destinationUrl: z.string().trim().url().max(500).optional(),
  whatsappNumber: z.string().trim().max(30).optional(),
  creativeImageUrl: z.string().trim().url().max(1000).optional(),
})

async function requireUserId() {
  const session = await auth()
  const email = session?.user?.email
  if (!email) return { error: NextResponse.json({ message: 'Authentication required.' }, { status: 401 }) }
  if (!isSupabaseConfigured()) {
    return { error: NextResponse.json({ message: DB_NOT_READY_MESSAGE }, { status: 502 }) }
  }
  try {
    const userId = await resolveUserIdByEmail(email)
    if (!userId) return { error: NextResponse.json({ message: DB_NOT_READY_MESSAGE }, { status: 502 }) }
    return { userId }
  } catch {
    return { error: NextResponse.json({ message: DB_NOT_READY_MESSAGE }, { status: 502 }) }
  }
}

export async function GET() {
  const resolved = await requireUserId()
  if (resolved.error) return resolved.error
  const { userId } = resolved

  try {
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('unreal_bs_ad_campaigns')
      .select('id, name, objective, platforms, daily_budget_bdt, duration_days, status, fulfilment_mode, audience_location, headline, primary_text, service_fee_bdt, rejection_reason, operator_note, reported_reach, reported_impressions, reported_clicks, reported_spend_bdt, results_updated_at, created_at, submitted_at, published_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) {
      await logError('ads-campaigns-get', error, { userId })
      return NextResponse.json({ message: DB_NOT_READY_MESSAGE }, { status: 502 })
    }

    return NextResponse.json({
      // Surfaced so the UI can tell the user honestly whether their campaign
      // will be published automatically or set up by a person.
      directPublishing: isMetaConfigured(),
      campaigns: (data ?? []).map((c) => ({
        id: c.id,
        name: c.name,
        objective: c.objective,
        platforms: c.platforms,
        dailyBudgetBdt: Number(c.daily_budget_bdt),
        durationDays: c.duration_days,
        totalBudgetBdt: Number(c.daily_budget_bdt) * c.duration_days,
        status: c.status,
        fulfilmentMode: c.fulfilment_mode,
        audienceLocation: c.audience_location,
        headline: c.headline,
        primaryText: c.primary_text,
        serviceFeeBdt: Number(c.service_fee_bdt),
        rejectionReason: c.rejection_reason,
        operatorNote: c.operator_note,
        // Null means "not reported yet" and must render as a dash, never as 0 —
        // a user reads "0 clicks" as a campaign that failed.
        reportedReach: c.reported_reach,
        reportedImpressions: c.reported_impressions,
        reportedClicks: c.reported_clicks,
        reportedSpendBdt: c.reported_spend_bdt != null ? Number(c.reported_spend_bdt) : null,
        resultsUpdatedAt: c.results_updated_at,
        createdAt: c.created_at,
        submittedAt: c.submitted_at,
        publishedAt: c.published_at,
      })),
    })
  } catch (err) {
    await logError('ads-campaigns-get', err)
    return NextResponse.json({ message: DB_NOT_READY_MESSAGE }, { status: 502 })
  }
}

export async function POST(request: Request) {
  const resolved = await requireUserId()
  if (resolved.error) return resolved.error
  const { userId } = resolved

  const { allowed } = await checkRateLimit('ad-campaign-create', userId, { max: 20, windowSeconds: 3600 })
  if (!allowed) {
    return NextResponse.json({ message: 'Too many campaigns created. Please try again later.' }, { status: 429 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ message: 'Invalid request payload.' }, { status: 400 })
  }

  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { message: 'Please check the campaign details.', errors: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const p = parsed.data

  // Rules live in lib/meta/campaign-rules.ts so they are unit-tested — see
  // campaign-rules.test.ts.
  const problems = validateCampaign({
    objective: p.objective,
    dailyBudgetBdt: p.dailyBudgetBdt,
    durationDays: p.durationDays,
    audienceAgeMin: p.audienceAgeMin,
    audienceAgeMax: p.audienceAgeMax,
    destinationUrl: p.destinationUrl,
    whatsappNumber: p.whatsappNumber,
    headline: p.headline,
    primaryText: p.primaryText,
  })

  if (problems.length > 0) {
    const MESSAGES: Record<string, string> = {
      age_range: 'Minimum age cannot be greater than maximum age.',
      budget_too_low: `Daily budget must be at least ৳${MIN_DAILY_BUDGET_BDT}. Below this the ad barely reaches anyone.`,
      no_destination: 'Add a website link or a WhatsApp number so people have somewhere to go.',
      missing_creative: 'Add a headline and ad text.',
    }
    return NextResponse.json({ message: MESSAGES[problems[0]] ?? 'Please check the campaign details.' }, { status: 400 })
  }

  try {
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('unreal_bs_ad_campaigns')
      .insert({
        user_id: userId,
        name: p.name,
        objective: p.objective,
        platforms: p.platforms,
        daily_budget_bdt: p.dailyBudgetBdt,
        duration_days: p.durationDays,
        audience_location: p.audienceLocation,
        audience_age_min: p.audienceAgeMin,
        audience_age_max: p.audienceAgeMax,
        audience_gender: p.audienceGender,
        audience_interests: p.audienceInterests || null,
        headline: p.headline,
        primary_text: p.primaryText,
        call_to_action: p.callToAction,
        destination_url: p.destinationUrl || null,
        whatsapp_number: p.whatsappNumber || null,
        creative_image_url: p.creativeImageUrl || null,
        status: 'draft',
        // Managed until Meta App Review clears. See lib/meta/client.ts.
        fulfilment_mode: isMetaConfigured() ? 'api' : 'managed',
      })
      .select('id, status, fulfilment_mode')
      .single()

    if (error || !data) {
      await logError('ads-campaigns-create', error ?? new Error('no row'), { userId })
      return NextResponse.json({ message: 'Could not save this campaign.' }, { status: 502 })
    }

    return NextResponse.json(
      { campaign: { id: data.id, status: data.status, fulfilmentMode: data.fulfilment_mode } },
      { status: 201 }
    )
  } catch (err) {
    await logError('ads-campaigns-create', err, { userId })
    return NextResponse.json({ message: 'Could not save this campaign.' }, { status: 502 })
  }
}
