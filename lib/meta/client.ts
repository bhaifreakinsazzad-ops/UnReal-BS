import 'server-only'

// ─────────────────────────────────────────────────────────────────────────────
// Meta Marketing API seam.
//
// Nothing here calls Meta yet, and that is deliberate rather than unfinished.
// Publishing a campaign into a CUSTOMER's ad account requires all of:
//
//   1. A Meta Business App with the `ads_management` permission
//   2. App Review approval for that permission (demo video, privacy policy,
//      screencast of the flow — typically weeks)
//   3. Advanced Access, not Standard. Standard Access can only touch ad
//      accounts the app owner administers, which is useless for a SaaS.
//   4. Meta Business Verification of the legal entity
//   5. Per-user OAuth granting us their ad account, and a payment method on
//      THAT account (we cannot fund a customer's ads from our wallet)
//
// Until those clear, campaigns are fulfilled in 'managed' mode: the operator
// runs them in Ads Manager and reports results back. The customer-facing flow
// is identical; only who presses the final button differs, and the campaign's
// status says so honestly.
//
// WHEN APP REVIEW PASSES, the work is:
//   • set META_APP_ID / META_APP_SECRET / META_API_VERSION
//   • implement publishCampaign() below against /act_{adAccountId}/campaigns,
//     /adsets and /ads
//   • add the OAuth callback storing each user's token + ad account id
//   • flip fulfilment_mode to 'api' for users who have connected
// No schema migration and no UI change is required — the columns
// (meta_campaign_id, meta_adset_id, meta_ad_id) already exist.
// ─────────────────────────────────────────────────────────────────────────────

const META_APP_ID = process.env.META_APP_ID
const META_APP_SECRET = process.env.META_APP_SECRET
const META_API_VERSION = process.env.META_API_VERSION ?? 'v21.0'

export const META_GRAPH_BASE = `https://graph.facebook.com/${META_API_VERSION}`

/** True only when the app credentials exist AND the permission that actually
 *  matters has been granted. Credentials alone are not enough — an app without
 *  approved `ads_management` can authenticate and still not create an ad. */
export function isMetaConfigured(): boolean {
  return Boolean(META_APP_ID && META_APP_SECRET && process.env.META_ADS_MANAGEMENT_APPROVED === 'true')
}

export interface MetaPublishInput {
  campaignId: string
  userAccessToken: string
  adAccountId: string
  name: string
  objective: string
  dailyBudgetBdt: number
  durationDays: number
}

export interface MetaPublishResult {
  metaCampaignId: string
  metaAdsetId: string
  metaAdId: string
}

export class MetaNotConfiguredError extends Error {
  constructor() {
    super(
      'Direct publishing to Meta is not enabled yet. This campaign will be set up for you by our team.'
    )
    this.name = 'MetaNotConfiguredError'
  }
}

/** Publishes a campaign through the Marketing API.
 *
 *  Throws MetaNotConfiguredError today. Callers MUST catch it and fall back to
 *  managed fulfilment rather than reporting a failure to the user — from the
 *  customer's point of view nothing has gone wrong, their campaign is simply
 *  being set up by a person instead of by an API call. */
export async function publishCampaign(_input: MetaPublishInput): Promise<MetaPublishResult> {
  if (!isMetaConfigured()) {
    throw new MetaNotConfiguredError()
  }

  // Intentionally unimplemented. Leaving this as a hard throw rather than a
  // half-written request means it is impossible to ship something that looks
  // like it published and did not.
  throw new MetaNotConfiguredError()
}

/** Deep link into the customer's own Meta Ads Manager. Real, works today, and
 *  is the honest escape hatch for anyone who would rather drive it themselves. */
export function adsManagerUrl(adAccountId?: string | null): string {
  return adAccountId
    ? `https://adsmanager.facebook.com/adsmanager/manage/campaigns?act=${encodeURIComponent(adAccountId)}`
    : 'https://adsmanager.facebook.com/adsmanager/manage/campaigns'
}

/** Meta's own objective values, so a managed campaign maps 1:1 onto what the
 *  operator picks in Ads Manager and onto the API later without a lookup table. */
export const META_OBJECTIVE_MAP: Record<string, string> = {
  awareness: 'OUTCOME_AWARENESS',
  traffic: 'OUTCOME_TRAFFIC',
  engagement: 'OUTCOME_ENGAGEMENT',
  leads: 'OUTCOME_LEADS',
  sales: 'OUTCOME_SALES',
  messages: 'OUTCOME_ENGAGEMENT',
}
