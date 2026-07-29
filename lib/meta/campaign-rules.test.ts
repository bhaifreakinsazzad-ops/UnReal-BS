import { describe, it, expect } from 'vitest'
import {
  ALLOWED_TRANSITIONS,
  MIN_DAILY_BUDGET_BDT,
  canTransition,
  totalBudgetBdt,
  validateCampaign,
  type CampaignStatus,
} from './campaign-rules'

const baseDraft = {
  objective: 'messages',
  dailyBudgetBdt: 200,
  durationDays: 7,
  audienceAgeMin: 18,
  audienceAgeMax: 55,
  whatsappNumber: '01712345678',
  headline: 'Winter blankets 50% off',
  primaryText: 'Limited stock. Message us to order today.',
}

describe('totalBudgetBdt', () => {
  it('multiplies daily spend across the run', () => {
    expect(totalBudgetBdt(200, 7)).toBe(1400)
  })

  it('rounds to paisa rather than carrying float noise into a shown price', () => {
    expect(totalBudgetBdt(33.33, 3)).toBe(99.99)
  })
})

describe('validateCampaign', () => {
  it('accepts a well-formed campaign', () => {
    expect(validateCampaign(baseDraft)).toEqual([])
  })

  it('rejects an inverted age range', () => {
    expect(validateCampaign({ ...baseDraft, audienceAgeMin: 50, audienceAgeMax: 25 })).toContain('age_range')
  })

  it('rejects a budget too small to deliver', () => {
    // Below Meta's practical floor the ad barely serves and the customer burns
    // money for no reach — refusing is kinder than taking it.
    expect(validateCampaign({ ...baseDraft, dailyBudgetBdt: MIN_DAILY_BUDGET_BDT - 1 })).toContain('budget_too_low')
  })

  it('requires somewhere for the click to land', () => {
    const errs = validateCampaign({ ...baseDraft, whatsappNumber: null, destinationUrl: null })
    expect(errs).toContain('no_destination')
  })

  it('accepts a website link instead of WhatsApp', () => {
    const errs = validateCampaign({
      ...baseDraft,
      whatsappNumber: null,
      destinationUrl: 'https://example.com',
    })
    expect(errs).not.toContain('no_destination')
  })

  it('lets an awareness campaign run with no destination', () => {
    const errs = validateCampaign({
      ...baseDraft,
      objective: 'awareness',
      whatsappNumber: null,
      destinationUrl: null,
    })
    expect(errs).not.toContain('no_destination')
  })

  it('requires ad text — an empty ad would be paid for and show nothing', () => {
    expect(validateCampaign({ ...baseDraft, headline: '   ' })).toContain('missing_creative')
    expect(validateCampaign({ ...baseDraft, primaryText: '' })).toContain('missing_creative')
  })
})

describe('canTransition', () => {
  it('allows the normal path from draft to finished', () => {
    expect(canTransition('draft', 'submitted')).toBe(true)
    expect(canTransition('submitted', 'in_review')).toBe(true)
    expect(canTransition('in_review', 'live')).toBe(true)
    expect(canTransition('live', 'completed')).toBe(true)
  })

  it('never rewinds a live campaign to a draft', () => {
    // A running ad is spending real money; silently reverting it to editable
    // would desync what the customer sees from what Meta is actually serving.
    expect(canTransition('live', 'draft')).toBe(false)
    expect(canTransition('live', 'submitted')).toBe(false)
  })

  it('does not let a rejected campaign jump straight to live', () => {
    expect(canTransition('rejected', 'live')).toBe(false)
  })

  it('treats completed, rejected and cancelled as terminal', () => {
    for (const s of ['completed', 'rejected', 'cancelled'] as CampaignStatus[]) {
      expect(ALLOWED_TRANSITIONS[s]).toEqual([])
    }
  })

  it('allows pausing and resuming a live campaign', () => {
    expect(canTransition('live', 'paused')).toBe(true)
    expect(canTransition('paused', 'live')).toBe(true)
  })

  it('never allows a transition to itself', () => {
    for (const s of Object.keys(ALLOWED_TRANSITIONS) as CampaignStatus[]) {
      expect(canTransition(s, s)).toBe(false)
    }
  })
})
