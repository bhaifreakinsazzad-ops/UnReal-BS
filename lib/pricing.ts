// Pure pricing / billing logic, extracted from the chat route so it can be
// unit-tested. Nothing in here touches the network, the database or a session —
// every function is deterministic given its inputs.
//
// This is the code that decides how much of a customer's real money to take,
// so it is the part of the codebase most worth testing.

export const MAX_OUTPUT_TOKENS = 1024

// Deliberately pessimistic. English averages ~4 characters per token; using 3
// over-estimates the input, so the pre-flight gate errs toward rejecting a
// request we might not be able to charge for, never toward letting an
// unaffordable one reach a paid provider.
export const CHARS_PER_TOKEN_ESTIMATE = 3

// 500 BDT/day buys ~8,450 cheap-model chats or ~539 premium chats — roughly
// 3-10x any realistic human ceiling, so it is invisible in normal use while
// bounding runaway-script damage to 500/day rather than a whole 2,600 BDT
// package. Credit is prepaid, so this protects the customer's balance and our
// provider-cost concentration, not our cash position.
export const DEFAULT_DAILY_SPEND_CAP_BDT = 500

// True provider cost of a cheap-model message is ~0.041 BDT, so 10/day is
// ~12 BDT/month for someone using it every single day.
export const DEFAULT_FREE_DAILY_MESSAGES = 10

export interface ModelRate {
  input_rate_bdt_per_1k: number | string
  output_rate_bdt_per_1k: number | string
  markup_multiplier: number | string
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100
}

/** Worst-case cost of a request BEFORE it is sent upstream: every prompt
 *  character billed as input, plus a full maxTokens response. */
export function estimateCostBdt(promptChars: number, rate: ModelRate): number {
  const estInputTokens = Math.ceil(promptChars / CHARS_PER_TOKEN_ESTIMATE)
  return round2(
    (estInputTokens / 1000) * Number(rate.input_rate_bdt_per_1k) * Number(rate.markup_multiplier) +
      (MAX_OUTPUT_TOKENS / 1000) * Number(rate.output_rate_bdt_per_1k) * Number(rate.markup_multiplier)
  )
}

/** Actual charge, from the provider's reported token usage. */
export function actualCostBdt(
  usage: { inputTokens: number; outputTokens: number },
  rate: ModelRate
): number {
  return round2(
    (usage.inputTokens / 1000) * Number(rate.input_rate_bdt_per_1k) * Number(rate.markup_multiplier) +
      (usage.outputTokens / 1000) * Number(rate.output_rate_bdt_per_1k) * Number(rate.markup_multiplier)
  )
}

/** Most providers report usage, but several adapters coerce a missing usage
 *  object to zero. A real reply billed upstream at zero cost would charge the
 *  customer nothing AND write a falsified ledger row, so estimate instead. */
export function usageWithFallback(
  reported: { inputTokens: number; outputTokens: number },
  promptChars: number,
  replyChars: number
): { usage: { inputTokens: number; outputTokens: number }; estimated: boolean } {
  const missing = reported.inputTokens === 0 && reported.outputTokens === 0 && replyChars > 0
  if (!missing) return { usage: reported, estimated: false }
  return {
    usage: {
      inputTokens: Math.ceil(promptChars / CHARS_PER_TOKEN_ESTIMATE),
      outputTokens: Math.ceil(replyChars / CHARS_PER_TOKEN_ESTIMATE),
    },
    estimated: true,
  }
}

export type BillingMode = 'wallet' | 'free'
export type BillingRefusal = 'daily_cap' | 'insufficient_balance'

export interface BillingDecision {
  mode: BillingMode | null
  refusal: BillingRefusal | null
  freeRemaining: number
}

/** Decides how a message is paid for, in priority order:
 *   1. wallet — balance covers it AND it stays inside today's cap
 *   2. free allowance — cheapest-model messages for registered users
 *   3. refuse, naming which limit was hit (telling someone to "top up" when
 *      they have money but hit the daily cap is useless advice) */
export function decideBilling(input: {
  estimatedCostBdt: number
  balanceBdt: number
  spentTodayBdt: number
  dailyCapBdt: number
  freeUsedToday: number
  freeDailyLimit: number
  modelIsFreeEligible: boolean
}): BillingDecision {
  const freeRemaining = Math.max(0, input.freeDailyLimit - input.freeUsedToday)
  const canAffordFromWallet = input.balanceBdt >= input.estimatedCostBdt
  const withinDailyCap = input.spentTodayBdt + input.estimatedCostBdt <= input.dailyCapBdt
  const canUseFree = input.modelIsFreeEligible && freeRemaining > 0

  if (canAffordFromWallet && withinDailyCap) {
    return { mode: 'wallet', refusal: null, freeRemaining }
  }
  if (canUseFree) {
    return { mode: 'free', refusal: null, freeRemaining }
  }
  return {
    mode: null,
    refusal: canAffordFromWallet && !withinDailyCap ? 'daily_cap' : 'insufficient_balance',
    freeRemaining,
  }
}

/** Start of the current day in Bangladesh (UTC+6), as an ISO instant.
 *  A cap that reset at UTC midnight would reset at 6am local — the middle of a
 *  shop owner's working morning. */
export function startOfDayDhakaIso(now: number = Date.now()): string {
  const OFFSET_MS = 6 * 60 * 60 * 1000
  const shifted = new Date(now + OFFSET_MS)
  shifted.setUTCHours(0, 0, 0, 0)
  return new Date(shifted.getTime() - OFFSET_MS).toISOString()
}

/** The maximum a package can ever cost us in provider fees.
 *  Only valid while every active model shares one markup — which is exactly
 *  why the admin API refuses to save a package when they diverge. */
export function bundleCostCapBdt(creditBdt: number, uniformMarkup: number): number {
  return creditBdt / uniformMarkup
}
