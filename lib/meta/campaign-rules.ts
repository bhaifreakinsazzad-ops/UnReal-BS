// Pure campaign rules, kept out of the route so they can be unit-tested.
// These decide what a customer is allowed to submit and what their ad will
// cost them, so they are worth testing directly.

export type CampaignStatus =
  | 'draft'
  | 'submitted'
  | 'in_review'
  | 'scheduled'
  | 'live'
  | 'paused'
  | 'completed'
  | 'rejected'
  | 'cancelled'

/** Mirrors unreal_bs_ad_campaign_set_status in migration 0011. Kept in sync so
 *  the UI can avoid offering a transition the database would reject — but the
 *  database remains the authority, not this table. */
export const ALLOWED_TRANSITIONS: Record<CampaignStatus, CampaignStatus[]> = {
  draft: ['submitted', 'cancelled'],
  submitted: ['in_review', 'rejected', 'cancelled'],
  in_review: ['scheduled', 'live', 'rejected', 'cancelled'],
  scheduled: ['live', 'cancelled', 'paused'],
  live: ['paused', 'completed', 'cancelled'],
  paused: ['live', 'completed', 'cancelled'],
  completed: [],
  rejected: [],
  cancelled: [],
}

export function canTransition(from: CampaignStatus, to: CampaignStatus): boolean {
  return (ALLOWED_TRANSITIONS[from] ?? []).includes(to)
}

/** Total the customer will spend with Meta over the campaign's life. This is
 *  ad spend, NOT wallet money — see the note in app/api/ads/campaigns/route.ts. */
export function totalBudgetBdt(dailyBudgetBdt: number, durationDays: number): number {
  return Math.round(dailyBudgetBdt * durationDays * 100) / 100
}

export interface CampaignDraft {
  objective: string
  dailyBudgetBdt: number
  durationDays: number
  audienceAgeMin: number
  audienceAgeMax: number
  destinationUrl?: string | null
  whatsappNumber?: string | null
  headline?: string | null
  primaryText?: string | null
}

export type ValidationCode =
  | 'age_range'
  | 'no_destination'
  | 'budget_too_low'
  | 'missing_creative'

/** Meta enforces a minimum daily budget; below roughly this the ad barely
 *  delivers and the customer burns money for no reach. Stated in taka. */
export const MIN_DAILY_BUDGET_BDT = 50

export function validateCampaign(draft: CampaignDraft): ValidationCode[] {
  const errors: ValidationCode[] = []

  if (draft.audienceAgeMin > draft.audienceAgeMax) errors.push('age_range')
  if (draft.dailyBudgetBdt < MIN_DAILY_BUDGET_BDT) errors.push('budget_too_low')

  // Awareness is the only objective that does not need a click destination.
  if (draft.objective !== 'awareness' && !draft.destinationUrl && !draft.whatsappNumber) {
    errors.push('no_destination')
  }

  if (!draft.headline?.trim() || !draft.primaryText?.trim()) errors.push('missing_creative')

  return errors
}
