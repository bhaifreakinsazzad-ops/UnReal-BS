import { describe, it, expect } from 'vitest'
import {
  COMMISSION_CAP_BDT,
  COMMISSION_FLOOR_BDT,
  COMMISSION_RATE,
  MAX_PRICE_BDT,
  MIN_PRICE_BDT,
  commissionBdt,
  commissionPercent,
  isSellablePrice,
  sellerPayoutBdt,
  splitPrice,
} from './pricing'

describe('commissionBdt', () => {
  it('charges the headline rate in the normal range', () => {
    expect(commissionBdt(500)).toBe(50)
    expect(commissionBdt(1500)).toBe(150)
    expect(commissionBdt(10_000)).toBe(1000)
  })

  it('applies the floor on cheap products', () => {
    // Below ৳100 the percentage would not cover the attention an order costs,
    // but the floor equals 10% at exactly ৳100 so it is never a surprise.
    expect(commissionBdt(50)).toBe(COMMISSION_FLOOR_BDT)
    expect(commissionBdt(80)).toBe(COMMISSION_FLOOR_BDT)
    expect(commissionBdt(100)).toBe(COMMISSION_FLOOR_BDT)
  })

  it('applies the cap on expensive products', () => {
    expect(commissionBdt(50_000)).toBe(COMMISSION_CAP_BDT)
    expect(commissionBdt(200_000)).toBe(COMMISSION_CAP_BDT)
  })

  it('crosses from rate to cap at the expected point', () => {
    const crossover = COMMISSION_CAP_BDT / COMMISSION_RATE // 20,000
    expect(commissionBdt(crossover - 1000)).toBeLessThan(COMMISSION_CAP_BDT)
    expect(commissionBdt(crossover + 1000)).toBe(COMMISSION_CAP_BDT)
  })

  it('takes nothing from a free product', () => {
    // A free lead magnet is the whole point of allowing ৳0, so it must not be
    // dragged up to the floor.
    expect(commissionBdt(0)).toBe(0)
    expect(sellerPayoutBdt(0)).toBe(0)
  })

  it('returns zero rather than the floor for nonsense input', () => {
    expect(commissionBdt(-100)).toBe(0)
    expect(commissionBdt(Number.NaN)).toBe(0)
    expect(commissionBdt(Number.POSITIVE_INFINITY)).toBe(0)
  })

  it('never exceeds the price itself', () => {
    // Guards the case where the floor is above a very cheap price.
    for (const price of [1, 5, 9, 10, 25, 50, 100]) {
      expect(commissionBdt(price)).toBeLessThanOrEqual(price)
    }
  })

  it('is whole taka — a seller is never shown paisa', () => {
    for (const price of [333, 777, 1249, 8999, 15_432]) {
      expect(Number.isInteger(commissionBdt(price))).toBe(true)
      expect(Number.isInteger(sellerPayoutBdt(price))).toBe(true)
    }
  })

  it('is monotonic — a dearer product never earns us less', () => {
    let prev = 0
    for (const price of [50, 100, 500, 2000, 10_000, 20_000, 100_000]) {
      const commission = commissionBdt(price)
      expect(commission).toBeGreaterThanOrEqual(prev)
      prev = commission
    }
  })
})

describe('the split always adds up', () => {
  // This is the invariant the whole feature rests on: the seller is quoted a
  // payout in the browser and the database writes a commission from the same
  // module, and unreal_bs_orders has a CHECK constraint asserting the same
  // equation. If rounding could ever invent or lose a taka, the check would
  // start rejecting real orders at checkout time.
  it('holds across a wide sweep of prices', () => {
    for (let price = 0; price <= 60_000; price += 7) {
      const commission = commissionBdt(price)
      const payout = sellerPayoutBdt(price)
      expect(commission + payout).toBe(Math.round(price))
      expect(commission).toBeGreaterThanOrEqual(0)
      expect(payout).toBeGreaterThanOrEqual(0)
    }
  })

  it('holds for fractional prices, which round to whole taka', () => {
    for (const price of [99.4, 99.5, 100.5, 1249.99, 4999.01]) {
      const { priceBdt, commissionBdt: c, sellerPayoutBdt: p } = splitPrice(price)
      expect(priceBdt).toBe(Math.round(price))
      expect(c + p).toBe(priceBdt)
    }
  })

  it('splitPrice agrees with the individual functions', () => {
    for (const price of [0, 50, 100, 999, 20_000, 90_000]) {
      const split = splitPrice(price)
      expect(split.commissionBdt).toBe(commissionBdt(price))
      expect(split.sellerPayoutBdt).toBe(sellerPayoutBdt(price))
    }
  })
})

describe('isSellablePrice', () => {
  it('allows free products', () => {
    expect(isSellablePrice(0)).toBe(true)
  })

  it('refuses prices between free and the minimum rather than eating them', () => {
    // At ৳20 the floor would be half the price. Refusing is more honest than
    // quietly taking 50%.
    expect(isSellablePrice(1)).toBe(false)
    expect(isSellablePrice(49)).toBe(false)
    expect(isSellablePrice(MIN_PRICE_BDT)).toBe(true)
  })

  it('refuses negatives and absurd amounts', () => {
    expect(isSellablePrice(-1)).toBe(false)
    expect(isSellablePrice(MAX_PRICE_BDT + 1)).toBe(false)
    expect(isSellablePrice(MAX_PRICE_BDT)).toBe(true)
  })
})

describe('commissionPercent', () => {
  it('never shows a share above 20% for a sellable price', () => {
    // The worst case is exactly at the minimum price, where the floor binds.
    expect(commissionPercent(MIN_PRICE_BDT)).toBeLessThanOrEqual(20)
  })

  it('falls as the price grows, so bigger sellers keep more', () => {
    expect(commissionPercent(100_000)).toBeLessThan(commissionPercent(1000))
    expect(commissionPercent(1000)).toBeLessThanOrEqual(commissionPercent(MIN_PRICE_BDT))
  })

  it('is zero for a free product', () => {
    expect(commissionPercent(0)).toBe(0)
  })
})
