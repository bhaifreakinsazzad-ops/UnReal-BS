import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/auth'
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/client'
import { resolveUserIdByEmail } from '@/lib/supabase/user'
import { logError } from '@/lib/log-error'
import { MetaNotConfiguredError, isMetaConfigured, publishCampaign } from '@/lib/meta/client'
import { MIN_MANAGED_SPEND_BDT, meetsManagedMinimum, serviceFeeBdt } from '@/lib/meta/service-fee'

export const dynamic = 'force-dynamic'

const DB_NOT_READY_MESSAGE =
  'Ads are not available yet. Run the migration in supabase/migrations/0011_meta_ads.sql.'

// The customer can only drive their campaign between the states that are theirs
// to drive: submit it for setup, or cancel it. Everything after submission
// (review, going live, results) belongs to the operator or the API, so it is
// not reachable from here. The database function enforces the transition graph
// regardless of which route calls it.
const patchSchema = z.object({
  action: z.enum(['submit', 'cancel']),
})

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ campaignId: string }> }
) {
  const session = await auth()
  const email = session?.user?.email
  if (!email) return NextResponse.json({ message: 'Authentication required.' }, { status: 401 })
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ message: DB_NOT_READY_MESSAGE }, { status: 502 })
  }

  const { campaignId } = await params

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ message: 'Invalid request payload.' }, { status: 400 })
  }

  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ message: 'Invalid request payload.' }, { status: 400 })
  }

  try {
    const userId = await resolveUserIdByEmail(email)
    if (!userId) return NextResponse.json({ message: DB_NOT_READY_MESSAGE }, { status: 502 })

    const supabase = getSupabaseAdmin()

    // Ownership check before anything else — the campaign id comes from the
    // client and proves nothing on its own.
    const { data: campaign } = await supabase
      .from('unreal_bs_ad_campaigns')
      .select('id, status, name, objective, daily_budget_bdt, duration_days, service_fee_charged_at')
      .eq('id', campaignId)
      .eq('user_id', userId)
      .maybeSingle()

    if (!campaign) return NextResponse.json({ message: 'Campaign not found.' }, { status: 404 })

    if (parsed.data.action === 'cancel') {
      const { error } = await supabase.rpc('unreal_bs_ad_campaign_set_status', {
        p_campaign_id: campaignId,
        p_status: 'cancelled',
        p_note: null,
      })
      if (error) {
        if (/INVALID_TRANSITION/i.test(error.message ?? '')) {
          return NextResponse.json(
            { message: 'This campaign can no longer be cancelled from here. Contact support.' },
            { status: 409 }
          )
        }
        await logError('ads-campaign-cancel', error, { userId, campaignId })
        return NextResponse.json({ message: 'Could not cancel this campaign.' }, { status: 502 })
      }
      return NextResponse.json({ campaign: { id: campaignId, status: 'cancelled' } })
    }

    // ── Submit ────────────────────────────────────────────────────────────
    const totalBudgetBdt = Number(campaign.daily_budget_bdt) * campaign.duration_days

    if (!meetsManagedMinimum(totalBudgetBdt)) {
      return NextResponse.json(
        {
          message: `Total ad budget must be at least ৳${MIN_MANAGED_SPEND_BDT.toLocaleString('en-US')}. Below that the ad barely reaches anyone and the setup fee would be an unfair share of your budget.`,
          code: 'BELOW_MINIMUM',
        },
        { status: 400 }
      )
    }

    const feeBdt = serviceFeeBdt(totalBudgetBdt)

    // Charge BEFORE the status transition. If the debit fails the campaign
    // stays a draft and nothing has changed — the customer can top up and try
    // again. Doing it the other way round would leave a submitted campaign we
    // were never paid for.
    //
    // Guarded on service_fee_charged_at so a double-submit cannot double-charge:
    // the balance guard lives inside the debit RPC's UPDATE predicate, and this
    // check stops a retry re-running it at all.
    if (!campaign.service_fee_charged_at && feeBdt > 0) {
      const { error: debitError } = await supabase.rpc('unreal_bs_debit_wallet_generic', {
        p_user_id: userId,
        p_amount_bdt: feeBdt,
        p_kind: 'ad_service_fee',
        p_reference_type: 'ad_campaign',
        p_reference_id: campaignId,
        p_note: `Ad setup: ${campaign.name}`,
      })

      if (debitError) {
        return NextResponse.json(
          {
            message: `Setting up this campaign costs ৳${feeBdt.toLocaleString('en-US')} from your wallet, and your balance is not enough. Top up and submit again — your campaign is saved as a draft.`,
            code: 'INSUFFICIENT_BALANCE',
            serviceFeeBdt: feeBdt,
          },
          { status: 402 }
        )
      }

      await supabase
        .from('unreal_bs_ad_campaigns')
        .update({ service_fee_bdt: feeBdt, service_fee_charged_at: new Date().toISOString() })
        .eq('id', campaignId)
    }

    const { data: updated, error: rpcError } = await supabase.rpc('unreal_bs_ad_campaign_set_status', {
      p_campaign_id: campaignId,
      p_status: 'submitted',
      p_note: null,
    })

    if (rpcError) {
      // The fee is already taken at this point, so refund rather than keep
      // money for a campaign that never entered the queue.
      if (!campaign.service_fee_charged_at && feeBdt > 0) {
        const { error: refundError } = await supabase.rpc('unreal_bs_credit_wallet_generic', {
          p_user_id: userId,
          p_amount_bdt: feeBdt,
          p_kind: 'ad_service_fee_refund',
          p_reference_type: 'ad_campaign',
          p_reference_id: campaignId,
          p_note: `Auto-refund: could not submit ${campaign.name}`,
        })
        if (refundError) {
          await logError('ads-campaign-submit-REFUND-FAILED', refundError, { userId, campaignId, feeBdt })
        } else {
          await supabase
            .from('unreal_bs_ad_campaigns')
            .update({ service_fee_refunded_at: new Date().toISOString() })
            .eq('id', campaignId)
        }
      }

      if (/INVALID_TRANSITION/i.test(rpcError.message ?? '')) {
        return NextResponse.json({ message: 'This campaign has already been submitted.' }, { status: 409 })
      }
      await logError('ads-campaign-submit', rpcError, { userId, campaignId })
      return NextResponse.json({ message: 'Could not submit this campaign.' }, { status: 502 })
    }

    // When direct publishing is eventually enabled, a submit attempts the API
    // first. A MetaNotConfiguredError is NOT an error from the user's point of
    // view — their campaign is simply set up by a person instead — so it falls
    // through to managed fulfilment silently rather than surfacing a failure.
    if (isMetaConfigured()) {
      try {
        await publishCampaign({
          campaignId,
          userAccessToken: '',
          adAccountId: '',
          name: campaign.name,
          objective: campaign.objective,
          dailyBudgetBdt: Number(campaign.daily_budget_bdt),
          durationDays: campaign.duration_days,
        })
      } catch (err) {
        if (!(err instanceof MetaNotConfiguredError)) {
          await logError('ads-campaign-publish', err, { userId, campaignId })
        }
      }
    }

    return NextResponse.json({
      campaign: { id: campaignId, status: updated?.status ?? 'submitted', serviceFeeBdt: feeBdt },
    })
  } catch (err) {
    await logError('ads-campaign-patch', err, { campaignId })
    return NextResponse.json({ message: 'Could not update this campaign.' }, { status: 502 })
  }
}
