// What UnReal BS keeps when somebody sells a digital product here.
//
// This module is imported by BOTH the seller's editor (which quotes the payout
// before they publish) and the checkout route (which writes the split into the
// order row). One function, one answer — the number a seller was promised and
// the number the database moves cannot drift apart. Same discipline as
// lib/meta/service-fee.ts.
//
// SHAPE: 10% of the sale price, with a floor and a cap.
//
//   10%      Gumroad charges a flat 10%; Teachable takes 5% plus payment fees
//   commission on top. Sitting at 10% while ALSO doing the payment collection by hand
//            is defensible to a seller who shops around, and it scales with what
//            they actually earn rather than charging them to exist.
//
//   floor    every order costs the same to process: read the bKash TrxID,
//   ৳10      match it, confirm, answer the buyer if it goes wrong. On a ৳100
//            product 10% is ৳10 anyway, so the floor only binds below ৳100 and
//            never turns into a surprise.
//
//   cap      above ~৳20,000 a straight percentage stops tracking any work we
//   ৳2,000   do and starts reading as a tax on success. A ৳50,000 course pays
//            ৳2,000, not ৳5,000. Keeps the sellers worth keeping.
//
//   minimum  below ৳50 the commission is most of the price and a manual bKash
//   ৳50      confirmation costs more attention than the sale is worth. Free
//   price    products (৳0) are exempt and fully supported — see below.
//
// FREE PRODUCTS EARN NOTHING, ON PURPOSE. A free ebook that turns a stranger
// into a tagged contact in the seller's GHL sub-account is the most useful
// thing a small Bangladeshi seller can publish, and charging commission on
// zero would just mean nobody ships one.
//
// Everything here is pure and unit-tested in pricing.test.ts.

export const COMMISSION_RATE = 0.1
export const COMMISSION_FLOOR_BDT = 10
export const COMMISSION_CAP_BDT = 2000

/** Cheapest a seller may charge for a paid product. Zero is separately allowed. */
export const MIN_PRICE_BDT = 50

/** Highest price the checkout will accept. Not a business opinion — a guard so
 *  a typo or a hostile POST cannot create a ৳9,999,999 order. */
export const MAX_PRICE_BDT = 500_000

/** Smallest payout worth an operator making a bKash transfer for. */
export const MIN_PAYOUT_BDT = 500

/** Our cut of a sale at `priceBdt`. Whole taka — a shop owner should never be
 *  shown paisa. */
export function commissionBdt(priceBdt: number): number {
  if (!Number.isFinite(priceBdt) || priceBdt <= 0) return 0
  const raw = priceBdt * COMMISSION_RATE
  const withBounds = Math.min(COMMISSION_CAP_BDT, Math.max(COMMISSION_FLOOR_BDT, raw))
  // Never take more than the price itself — matters when the floor is above a
  // very cheap price, e.g. a ৳5 product that slipped past MIN_PRICE_BDT.
  return Math.min(Math.round(priceBdt), Math.round(withBounds))
}

/** What the seller receives. Defined as the remainder rather than as its own
 *  percentage, so commission + payout is exactly the price for every input and
 *  rounding can never invent or destroy a taka. The DB check constraint
 *  unreal_bs_orders_split_adds_up enforces the same thing at write time. */
export function sellerPayoutBdt(priceBdt: number): number {
  if (!Number.isFinite(priceBdt) || priceBdt <= 0) return 0
  return Math.round(priceBdt) - commissionBdt(priceBdt)
}

/** The commission as a share of the sale, for showing a seller something they
 *  can judge rather than a bare number. */
export function commissionPercent(priceBdt: number): number {
  if (!Number.isFinite(priceBdt) || priceBdt <= 0) return 0
  return Math.round((commissionBdt(priceBdt) / Math.round(priceBdt)) * 1000) / 10
}

/** True when a price is one we will actually sell at: free, or at least the
 *  minimum. Prices between 0 and MIN_PRICE_BDT are refused rather than quietly
 *  eaten by the floor. */
export function isSellablePrice(priceBdt: number): boolean {
  if (!Number.isFinite(priceBdt) || priceBdt < 0) return false
  if (priceBdt > MAX_PRICE_BDT) return false
  return priceBdt === 0 || priceBdt >= MIN_PRICE_BDT
}

export interface PriceSplit {
  priceBdt: number
  commissionBdt: number
  sellerPayoutBdt: number
}

/** The whole split in one call, for the editor's live preview and for the
 *  checkout route's insert. Both use this so they cannot disagree. */
export function splitPrice(priceBdt: number): PriceSplit {
  const price = Number.isFinite(priceBdt) && priceBdt > 0 ? Math.round(priceBdt) : 0
  const commission = commissionBdt(price)
  return { priceBdt: price, commissionBdt: commission, sellerPayoutBdt: price - commission }
}
