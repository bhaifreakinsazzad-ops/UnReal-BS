import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/auth'
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/client'
import { logError } from '@/lib/log-error'

export const dynamic = 'force-dynamic'

const DB_NOT_READY_MESSAGE =
  'Ads are not available yet. Run the migration in supabase/migrations/0011_meta_ads.sql.'

async function requireAdmin() {
  const session = await auth()
  const email = session?.user?.email
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase()
  if (!email || !adminEmail || email.trim().toLowerCase() !== adminEmail) {
    return { error: NextResponse.json({ message: 'Not found.' }, { status: 404 }) }
  }
  if (!isSupabaseConfigured()) {
    return { error: NextResponse.json({ message: DB_NOT_READY_MESSAGE }, { status: 502 }) }
  }
  return {}
}

const patchSchema = z.object({
  campaignId: z.string().uuid(),
  status: z.enum(['in_review', 'scheduled', 'live', 'paused', 'completed', 'rejected', 'cancelled']).optional(),
  note: z.string().trim().max(1000).optional(),
  serviceFeeBdt: z.number().min(0).max(1_000_000).optional(),
  // Results reported back from Ads Manager for a managed campaign. All optional
  // and nullable — a metric that has not been read yet must stay null rather
  // than becoming 0, which a customer would read as a failed campaign.
  reportedReach: z.number().int().min(0).nullable().optional(),
  reportedImpressions: z.number().int().min(0).nullable().optional(),
  reportedClicks: z.number().int().min(0).nullable().optional(),
  reportedSpendBdt: z.number().min(0).max(10_000_000).nullable().optional(),
  metaCampaignId: z.string().trim().max(100).nullable().optional(),
})

export async function GET() {
  const resolved = await requireAdmin()
  if (resolved.error) return resolved.error

  try {
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('unreal_bs_ad_campaigns')
      .select('id, user_id, name, objective, platforms, daily_budget_bdt, duration_days, status, fulfilment_mode, audience_location, audience_age_min, audience_age_max, audience_gender, audience_interests, headline, primary_text, call_to_action, destination_url, whatsapp_number, creative_image_url, service_fee_bdt, meta_campaign_id, reported_reach, reported_impressions, reported_clicks, reported_spend_bdt, operator_note, created_at, submitted_at, unreal_bs_users(business_name, email)')
      .neq('status', 'draft')
      .order('submitted_at', { ascending: true, nullsFirst: false })
      .limit(200)

    if (error) {
      await logError('admin-ad-campaigns-get', error)
      return NextResponse.json({ message: DB_NOT_READY_MESSAGE }, { status: 502 })
    }

    return NextResponse.json({
      campaigns: (data ?? []).map((c) => {
        const u = Array.isArray(c.unreal_bs_users) ? c.unreal_bs_users[0] : c.unreal_bs_users
        return {
          id: c.id,
          businessName: u?.business_name ?? null,
          email: u?.email ?? null,
          name: c.name,
          objective: c.objective,
          platforms: c.platforms,
          dailyBudgetBdt: Number(c.daily_budget_bdt),
          durationDays: c.duration_days,
          totalBudgetBdt: Number(c.daily_budget_bdt) * c.duration_days,
          status: c.status,
          fulfilmentMode: c.fulfilment_mode,
          audienceLocation: c.audience_location,
          audienceAgeMin: c.audience_age_min,
          audienceAgeMax: c.audience_age_max,
          audienceGender: c.audience_gender,
          audienceInterests: c.audience_interests,
          headline: c.headline,
          primaryText: c.primary_text,
          callToAction: c.call_to_action,
          destinationUrl: c.destination_url,
          whatsappNumber: c.whatsapp_number,
          creativeImageUrl: c.creative_image_url,
          serviceFeeBdt: Number(c.service_fee_bdt),
          metaCampaignId: c.meta_campaign_id,
          reportedReach: c.reported_reach,
          reportedImpressions: c.reported_impressions,
          reportedClicks: c.reported_clicks,
          reportedSpendBdt: c.reported_spend_bdt != null ? Number(c.reported_spend_bdt) : null,
          operatorNote: c.operator_note,
          createdAt: c.created_at,
          submittedAt: c.submitted_at,
        }
      }),
    })
  } catch (err) {
    await logError('admin-ad-campaigns-get', err)
    return NextResponse.json({ message: DB_NOT_READY_MESSAGE }, { status: 502 })
  }
}

export async function PATCH(request: Request) {
  const resolved = await requireAdmin()
  if (resolved.error) return resolved.error

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ message: 'Invalid request payload.' }, { status: 400 })
  }

  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ message: 'Invalid values.', errors: parsed.error.flatten() }, { status: 400 })
  }

  const { campaignId, status, note, serviceFeeBdt, ...results } = parsed.data

  try {
    const supabase = getSupabaseAdmin()

    // Status changes go through the RPC so the transition graph is enforced in
    // one place — an operator cannot rewind a live campaign to draft, and a
    // rejected one cannot jump straight to live.
    if (status) {
      const { error: rpcError } = await supabase.rpc('unreal_bs_ad_campaign_set_status', {
        p_campaign_id: campaignId,
        p_status: status,
        p_note: note ?? null,
      })
      if (rpcError) {
        if (/INVALID_TRANSITION/i.test(rpcError.message ?? '')) {
          return NextResponse.json(
            { message: `Cannot move this campaign to "${status}" from its current state.` },
            { status: 409 }
          )
        }
        await logError('admin-ad-campaigns-transition', rpcError, { campaignId, status })
        return NextResponse.json({ message: 'Could not update this campaign.' }, { status: 502 })
      }
    }

    const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (serviceFeeBdt !== undefined) update.service_fee_bdt = serviceFeeBdt
    if (results.metaCampaignId !== undefined) update.meta_campaign_id = results.metaCampaignId
    if (note !== undefined && !status) update.operator_note = note

    const reportedKeys = {
      reportedReach: 'reported_reach',
      reportedImpressions: 'reported_impressions',
      reportedClicks: 'reported_clicks',
      reportedSpendBdt: 'reported_spend_bdt',
    } as const
    let touchedResults = false
    for (const [k, col] of Object.entries(reportedKeys) as [keyof typeof reportedKeys, string][]) {
      if (results[k] !== undefined) {
        update[col] = results[k]
        touchedResults = true
      }
    }
    if (touchedResults) update.results_updated_at = new Date().toISOString()

    if (Object.keys(update).length > 1) {
      const { error } = await supabase.from('unreal_bs_ad_campaigns').update(update).eq('id', campaignId)
      if (error) {
        await logError('admin-ad-campaigns-update', error, { campaignId })
        return NextResponse.json({ message: 'Could not update this campaign.' }, { status: 502 })
      }
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    await logError('admin-ad-campaigns-patch', err, { campaignId })
    return NextResponse.json({ message: 'Could not update this campaign.' }, { status: 502 })
  }
}
