import 'server-only'

// ─────────────────────────────────────────────────────────────────────────────
// How a buyer pays for a digital product.
//
// TODAY: manual mobile-wallet transfer. The buyer sends money to the platform's
// bKash/Nagad number, types the TrxID into the checkout page, and an operator
// confirms it. That is not a placeholder for a real integration — it is how
// essentially every product sold on Facebook in Bangladesh is already paid for,
// so it is what buyers expect and it needs no onboarding from the seller.
//
// WHY NOT A GATEWAY ON DAY ONE: SSLCommerz (3.5% + $0.35) and aamarPay
// (~1.85-2.1% on wallets, 2.55-3.25% on cards) both require a trade licence,
// a company bank account, a TIN and a ৳4,000-25,000 setup before the first
// taka moves. None of that is a code problem and none of it completes on a
// launch timeline.
//
// WHY THE INTERFACE EXISTS ANYWAY: so adding one is a new file plus an env var
// rather than a rewrite of checkout. The order table already carries
// gateway_provider and gateway_ref, and the UI branches on
// isGatewayConfigured() — so the checkout page tells the buyer the truth about
// how they are paying instead of hard-coding one story. Same approach as
// lib/meta/client.ts.
//
// WHY THE MONEY COMES TO US AND NOT THE SELLER: it is the only arrangement in
// which the commission is collected by construction. If the buyer paid the
// seller's own bKash directly, our 10% would be an invoice we send afterwards
// and hope is honoured. Instead the platform receives, keeps its cut, and
// credits the seller's wallet atomically in unreal_bs_order_mark_paid.
// ─────────────────────────────────────────────────────────────────────────────

export interface CheckoutOrder {
  orderId: string
  accessToken: string
  priceBdt: number
  productTitle: string
  buyerName: string
  buyerPhone: string
  buyerEmail?: string | null
}

export interface CheckoutSession {
  /** Where to send the buyer. Null when there is nothing to redirect to and
   *  the buyer stays on our own instructions page. */
  redirectUrl: string | null
  /** The provider's handle for this attempt, stored in orders.gateway_ref. */
  providerRef: string | null
}

export interface PaymentVerification {
  paid: boolean
  amountBdt: number
}

export interface PaymentProvider {
  readonly id: string
  /** True when a human has to look at a TrxID before the order can be marked
   *  paid. The admin queue and the buyer-facing copy both key off this. */
  readonly requiresManualConfirmation: boolean
  createCheckout(order: CheckoutOrder): Promise<CheckoutSession>
  verify(providerRef: string): Promise<PaymentVerification>
}

export class GatewayNotConfiguredError extends Error {
  constructor() {
    super('No automatic payment gateway is configured.')
    this.name = 'GatewayNotConfiguredError'
  }
}

/** The numbers a buyer is told to send money to. Configured, not hard-coded,
 *  because they change and because a wrong number here silently loses sales. */
export function manualPaymentTargets(): { method: string; number: string; label: string }[] {
  const targets: { method: string; number: string; label: string }[] = []
  const bkash = process.env.PLATFORM_BKASH_NUMBER?.trim()
  const nagad = process.env.PLATFORM_NAGAD_NUMBER?.trim()
  const rocket = process.env.PLATFORM_ROCKET_NUMBER?.trim()
  if (bkash) targets.push({ method: 'bkash', number: bkash, label: 'bKash' })
  if (nagad) targets.push({ method: 'nagad', number: nagad, label: 'Nagad' })
  if (rocket) targets.push({ method: 'rocket', number: rocket, label: 'Rocket' })
  return targets
}

/** True once a real gateway is wired up. Until then the checkout page says so
 *  plainly rather than implying a card form is coming. */
export function isGatewayConfigured(): boolean {
  return process.env.PAYMENT_GATEWAY_ENABLED === 'true'
}

const manualMobileWallet: PaymentProvider = {
  id: 'manual_mobile_wallet',
  requiresManualConfirmation: true,

  async createCheckout(): Promise<CheckoutSession> {
    // Nothing to redirect to: the buyer stays on our page, sends money from
    // their own bKash app, and comes back with a TrxID.
    return { redirectUrl: null, providerRef: null }
  },

  async verify(): Promise<PaymentVerification> {
    // bKash personal/merchant transfers cannot be verified programmatically
    // without a merchant API contract. Returning a fake "paid" here would be
    // the single worst bug this system could have, so it refuses instead and
    // the operator remains the authority.
    throw new GatewayNotConfiguredError()
  },
}

/** The provider in force right now. When a gateway is added, return it here
 *  when isGatewayConfigured() — no caller changes. */
export function getPaymentProvider(): PaymentProvider {
  return manualMobileWallet
}
