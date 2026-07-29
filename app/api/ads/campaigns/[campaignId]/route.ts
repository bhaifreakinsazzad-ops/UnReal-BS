import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/auth'
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/client'
import { resolveUserIdByEmail } from '@/lib/supabase/user'
import { logError } from '@/lib/log-error'
import { MetaNotConfiguredError, isMetaConfigured, publishCampaign } from '@/lib/meta/client'

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
      .select('id, status, name, objective, daily_budget_bdt, duration_days')
      .eq('id', campaignId)
      .eq('user_id', userId)
      .maybeSingle()

    if (!campaign) return NextResponse.json({ message: 'Campaign not found.' }, { status: 404 })

    const nextStatus = parsed.data.action === 'submit' ? 'submitted' : 'cancelled'

    const { data: updated, error: rpcError } = await supabase.rpc('unreal_bs_ad_campaign_set_status', {
      p_campaign_id: campaignId,
      p_status: nextStatus,
      p_note: null,
    })

    if (rpcError) {
      if (/INVALID_TRANSITION/i.test(rpcError.message ?? '')) {
        return NextResponse.json(
          { message: 'This campaign can no longer be changed from here. Contact support if you need it stopped.' },
          { status: 409 }
        )
      }
      await logError('ads-campaign-transition', rpcError, { userId, campaignId, nextStatus })
      return NextResponse.json({ message: 'Could not update this campaign.' }, { status: 502 })
    }

    // When direct publishing is eventually enabled, a submit attempts the API
    // first. A MetaNotConfiguredError is NOT an error from the user's point of
    // view — their campaign is simply set up by a person instead — so it falls
    // through to managed fulfilment silently rather than surfacing a failure.
    if (parsed.data.action === 'submit' && isMetaConfigured()) {
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

    return NextResponse.json({ campaign: { id: campaignId, status: updated?.status ?? nextStatus } })
  } catch (err) {
    await logError('ads-campaign-patch', err, { campaignId })
    return NextResponse.json({ message: 'Could not update this campaign.' }, { status: 502 })
  }
}
