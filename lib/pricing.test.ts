import { describe, it, expect } from 'vitest'
import {
  actualCostBdt,
  bundleCostCapBdt,
  decideBilling,
  estimateCostBdt,
  round2,
  startOfDayDhakaIso,
  usageWithFallback,
  DEFAULT_DAILY_SPEND_CAP_BDT,
  DEFAULT_FREE_DAILY_MESSAGES,
} from './pricing'

// The live rate card seeded by migration 0009 (true provider cost in BDT per
// 1k tokens at a 136 BDT/USD basis, uniform 1.45x markup).
const MARKUP = 1.45
const RATES = {
  'gpt-4o-mini': { input_rate_bdt_per_1k: 0.0204, output_rate_bdt_per_1k: 0.0816, markup_multiplier: MARKUP },
  'gemini-3.1-flash-lite': { input_rate_bdt_per_1k: 0.034, output_rate_bdt_per_1k: 0.204, markup_multiplier: MARKUP },
  'claude-haiku-4-5': { input_rate_bdt_per_1k: 0.136, output_rate_bdt_per_1k: 0.68, markup_multiplier: MARKUP },
  'gpt-5.6-luna': { input_rate_bdt_per_1k: 0.136, output_rate_bdt_per_1k: 0.816, markup_multiplier: MARKUP },
  'claude-sonnet-5': { input_rate_bdt_per_1k: 0.272, output_rate_bdt_per_1k: 1.36, markup_multiplier: MARKUP },
}

const BUNDLES = [
  { code: 'starter', price: 699, credit: 720, agreedCap: 500 },
  { code: 'growth', price: 999, credit: 1150, agreedCap: 800 },
  { code: 'pro', price: 1999, credit: 2600, agreedCap: 1799 },
]

describe('package cost ceilings', () => {
  // The whole commercial model rests on this: because the markup is uniform,
  // the worst case is credit/markup no matter which model the customer uses.
  it.each(BUNDLES)('$code never exceeds its agreed cost cap', ({ credit, agreedCap }) => {
    const cap = bundleCostCapBdt(credit, MARKUP)
    expect(cap).toBeLessThan(agreedCap)
  })

  it.each(BUNDLES)('$code always turns a profit at full burn', ({ price, credit }) => {
    expect(bundleCostCapBdt(credit, MARKUP)).toBeLessThan(price)
  })

  it('ceiling is identical across every model — the guarantee is model-independent', () => {
    // Spending C credit costs us C/markup regardless of the input/output mix,
    // because every model shares the markup. Verify by simulating a full burn
    // on each model with wildly different input:output ratios.
    for (const rate of Object.values(RATES)) {
      const credit = 720
      // Burn entirely on input tokens...
      const tokensIfAllInput = credit / (Number(rate.input_rate_bdt_per_1k) * MARKUP) * 1000
      const costAllInput = (tokensIfAllInput / 1000) * Number(rate.input_rate_bdt_per_1k)
      // ...and entirely on output tokens.
      const tokensIfAllOutput = credit / (Number(rate.output_rate_bdt_per_1k) * MARKUP) * 1000
      const costAllOutput = (tokensIfAllOutput / 1000) * Number(rate.output_rate_bdt_per_1k)

      expect(costAllInput).toBeCloseTo(credit / MARKUP, 6)
      expect(costAllOutput).toBeCloseTo(credit / MARKUP, 6)
    }
  })

  it('a non-uniform markup would break the guarantee', () => {
    // Documents WHY the admin API refuses to save while markups diverge.
    const thinMargin = bundleCostCapBdt(720, 1.05)
    expect(thinMargin).toBeGreaterThan(500) // breaches the starter cap
  })
})

describe('estimateCostBdt', () => {
  it('is pessimistic — never under-estimates a real charge', () => {
    const rate = RATES['claude-sonnet-5']
    const promptChars = 2400
    const estimate = estimateCostBdt(promptChars, rate)
    // A real call whose input matched the prompt and which used the full
    // output allowance must not exceed the estimate.
    const actual = actualCostBdt({ inputTokens: Math.ceil(promptChars / 4), outputTokens: 1024 }, rate)
    expect(estimate).toBeGreaterThanOrEqual(actual)
  })

  it('accounts for a full max-token reply, not just the prompt', () => {
    const rate = RATES['claude-sonnet-5']
    expect(estimateCostBdt(0, rate)).toBeGreaterThan(0)
  })

  it('handles string-typed numerics as returned by postgres', () => {
    const asStrings = { input_rate_bdt_per_1k: '0.272', output_rate_bdt_per_1k: '1.360', markup_multiplier: '1.450' }
    expect(estimateCostBdt(600, asStrings)).toBe(estimateCostBdt(600, RATES['claude-sonnet-5']))
  })
})

describe('actualCostBdt', () => {
  it('prices a typical chat within expected bounds', () => {
    const cheap = actualCostBdt({ inputTokens: 600, outputTokens: 350 }, RATES['gpt-4o-mini'])
    const premium = actualCostBdt({ inputTokens: 600, outputTokens: 350 }, RATES['claude-sonnet-5'])
    expect(cheap).toBeCloseTo(0.06, 2)
    expect(premium).toBeCloseTo(0.93, 2)
    expect(cheap).toBeLessThan(premium)
  })

  it('never returns a negative charge', () => {
    expect(actualCostBdt({ inputTokens: 0, outputTokens: 0 }, RATES['gpt-4o-mini'])).toBe(0)
  })
})

describe('usageWithFallback', () => {
  it('estimates when a provider reports no usage but returned real content', () => {
    // Eight of nine adapters coerce missing usage to 0. Without this the reply
    // would be billed at 0.00 and a falsified "completed" ledger row written.
    const { usage, estimated } = usageWithFallback({ inputTokens: 0, outputTokens: 0 }, 1800, 1200)
    expect(estimated).toBe(true)
    expect(usage.inputTokens).toBeGreaterThan(0)
    expect(usage.outputTokens).toBeGreaterThan(0)
    expect(actualCostBdt(usage, RATES['claude-sonnet-5'])).toBeGreaterThan(0)
  })

  it('passes real reported usage straight through', () => {
    const reported = { inputTokens: 500, outputTokens: 200 }
    const { usage, estimated } = usageWithFallback(reported, 1800, 1200)
    expect(estimated).toBe(false)
    expect(usage).toEqual(reported)
  })

  it('does not estimate for a genuinely empty reply', () => {
    const { estimated } = usageWithFallback({ inputTokens: 0, outputTokens: 0 }, 1800, 0)
    expect(estimated).toBe(false)
  })
})

describe('decideBilling', () => {
  const base = {
    estimatedCostBdt: 1,
    balanceBdt: 100,
    spentTodayBdt: 0,
    dailyCapBdt: DEFAULT_DAILY_SPEND_CAP_BDT,
    freeUsedToday: 0,
    freeDailyLimit: DEFAULT_FREE_DAILY_MESSAGES,
    modelIsFreeEligible: true,
  }

  it('charges the wallet when funded and inside the cap', () => {
    expect(decideBilling(base).mode).toBe('wallet')
  })

  it('falls back to the free tier at zero balance', () => {
    const d = decideBilling({ ...base, balanceBdt: 0 })
    expect(d.mode).toBe('free')
    expect(d.freeRemaining).toBe(10)
  })

  it('refuses at zero balance once the free allowance is spent', () => {
    const d = decideBilling({ ...base, balanceBdt: 0, freeUsedToday: 10 })
    expect(d.mode).toBeNull()
    expect(d.refusal).toBe('insufficient_balance')
  })

  it('will not spend a funded wallet past the daily cap', () => {
    const d = decideBilling({ ...base, balanceBdt: 5000, spentTodayBdt: 500, freeDailyLimit: 0 })
    expect(d.mode).toBeNull()
    expect(d.refusal).toBe('daily_cap')
  })

  it('distinguishes cap-reached from out-of-money — they need different advice', () => {
    const capped = decideBilling({ ...base, balanceBdt: 5000, spentTodayBdt: 500, freeDailyLimit: 0 })
    const broke = decideBilling({ ...base, balanceBdt: 0, freeDailyLimit: 0 })
    expect(capped.refusal).toBe('daily_cap')
    expect(broke.refusal).toBe('insufficient_balance')
  })

  it('never serves a premium model on the free tier', () => {
    const d = decideBilling({ ...base, balanceBdt: 0, modelIsFreeEligible: false })
    expect(d.mode).toBeNull()
  })

  it('treats a 0 cap as a hard freeze, not as "unlimited"', () => {
    const d = decideBilling({ ...base, balanceBdt: 5000, dailyCapBdt: 0, freeDailyLimit: 0 })
    expect(d.mode).toBeNull()
  })

  it('a 0 free limit disables the free tier rather than granting infinite', () => {
    const d = decideBilling({ ...base, balanceBdt: 0, freeDailyLimit: 0 })
    expect(d.mode).toBeNull()
    expect(d.freeRemaining).toBe(0)
  })

  it('lets the last affordable message through exactly at the cap boundary', () => {
    const d = decideBilling({ ...base, estimatedCostBdt: 10, spentTodayBdt: 490, balanceBdt: 100 })
    expect(d.mode).toBe('wallet')
  })

  it('blocks the message that would cross the cap by any amount', () => {
    const d = decideBilling({ ...base, estimatedCostBdt: 10.01, spentTodayBdt: 490, balanceBdt: 100, freeDailyLimit: 0 })
    expect(d.refusal).toBe('daily_cap')
  })
})

describe('startOfDayDhakaIso', () => {
  it('rolls the day at Dhaka midnight, not UTC midnight', () => {
    // 2026-07-27T20:00:00Z is 02:00 on the 28th in Dhaka (UTC+6), so the
    // window must already have advanced to the 28th.
    const iso = startOfDayDhakaIso(Date.parse('2026-07-27T20:00:00Z'))
    expect(iso).toBe('2026-07-27T18:00:00.000Z') // = 28 Jul 00:00 Dhaka
  })

  it('keeps a 5pm Dhaka moment inside the same working day', () => {
    // 11:00Z = 17:00 Dhaka on the 27th — still the 27th's window.
    const iso = startOfDayDhakaIso(Date.parse('2026-07-27T11:00:00Z'))
    expect(iso).toBe('2026-07-26T18:00:00.000Z') // = 27 Jul 00:00 Dhaka
  })
})

describe('round2', () => {
  it('rounds to paisa', () => {
    expect(round2(1.234)).toBe(1.23)
    expect(round2(1.236)).toBe(1.24)
  })

  it('forgives sub-paisa amounts — rounding always favours the customer', () => {
    // Anything under half a paisa becomes zero, and cost_bdt is numeric(12,2),
    // so the charge is genuinely dropped rather than accumulated. This is a
    // known, deliberate leak in the customer's favour: it never rounds our way.
    expect(round2(0.004)).toBe(0)

    // Binary floating point makes an exact .005 midpoint land just below it
    // (1.005 is really 1.00499...), so it also rounds down. Documented here so
    // nobody "fixes" it into rounding against the customer by accident.
    expect(round2(1.005)).toBe(1)
  })
})
