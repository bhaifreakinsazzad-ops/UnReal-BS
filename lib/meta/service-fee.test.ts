import { describe, it, expect } from 'vitest'
import {
  MIN_MANAGED_SPEND_BDT,
  SERVICE_FEE_CAP_BDT,
  SERVICE_FEE_FLOOR_BDT,
  SERVICE_FEE_RATE,
  meetsManagedMinimum,
  serviceFeeBdt,
  serviceFeePercent,
} from './service-fee'

describe('serviceFeeBdt', () => {
  it('charges the headline rate in the normal range', () => {
    expect(serviceFeeBdt(1400)).toBe(210) // 15% of 1400
    expect(serviceFeeBdt(3000)).toBe(450)
    expect(serviceFeeBdt(7000)).toBe(1050)
  })

  it('applies the floor on small campaigns', () => {
    // A campaign costs the same operator time regardless of budget, so below
    // roughly ৳1,327 of spend the percentage would not cover the work.
    expect(serviceFeeBdt(1000)).toBe(SERVICE_FEE_FLOOR_BDT)
    expect(serviceFeeBdt(1200)).toBe(SERVICE_FEE_FLOOR_BDT)
  })

  it('applies the cap on large campaigns', () => {
    expect(serviceFeeBdt(60_000)).toBe(SERVICE_FEE_CAP_BDT)
    expect(serviceFeeBdt(1_000_000)).toBe(SERVICE_FEE_CAP_BDT)
  })

  it('crosses from floor to rate at the expected point', () => {
    const crossover = SERVICE_FEE_FLOOR_BDT / SERVICE_FEE_RATE // ~1327
    expect(serviceFeeBdt(Math.floor(crossover) - 100)).toBe(SERVICE_FEE_FLOOR_BDT)
    expect(serviceFeeBdt(Math.ceil(crossover) + 100)).toBeGreaterThan(SERVICE_FEE_FLOOR_BDT)
  })

  it('crosses from rate to cap at the expected point', () => {
    const crossover = SERVICE_FEE_CAP_BDT / SERVICE_FEE_RATE // ~19993
    expect(serviceFeeBdt(Math.floor(crossover) - 1000)).toBeLessThan(SERVICE_FEE_CAP_BDT)
    expect(serviceFeeBdt(Math.ceil(crossover) + 1000)).toBe(SERVICE_FEE_CAP_BDT)
  })

  it('never charges paisa — a fee shown to a shop owner is whole taka', () => {
    for (const spend of [1333, 2777, 4001, 9999, 15_432]) {
      expect(Number.isInteger(serviceFeeBdt(spend))).toBe(true)
    }
  })

  it('never exceeds the ad budget itself', () => {
    // A fee larger than the spend would be indefensible at any size.
    for (const spend of [1000, 1500, 5000, 50_000]) {
      expect(serviceFeeBdt(spend)).toBeLessThan(spend)
    }
  })

  it('is monotonic — a bigger budget never costs less to run', () => {
    let prev = 0
    for (const spend of [1000, 2000, 5000, 10_000, 20_000, 50_000, 200_000]) {
      const fee = serviceFeeBdt(spend)
      expect(fee).toBeGreaterThanOrEqual(prev)
      prev = fee
    }
  })

  it('returns zero for a zero or negative budget rather than the floor', () => {
    expect(serviceFeeBdt(0)).toBe(0)
    expect(serviceFeeBdt(-500)).toBe(0)
  })
})

describe('meetsManagedMinimum', () => {
  it('refuses campaigns too small to run sensibly', () => {
    // At ৳500 the floor fee would be 40% of the budget, and the ad barely
    // delivers. Refusing is more honest than quietly overcharging.
    expect(meetsManagedMinimum(500)).toBe(false)
    expect(meetsManagedMinimum(999)).toBe(false)
  })

  it('accepts from the minimum upward', () => {
    expect(meetsManagedMinimum(MIN_MANAGED_SPEND_BDT)).toBe(true)
    expect(meetsManagedMinimum(5000)).toBe(true)
  })
})

describe('serviceFeePercent', () => {
  it('never shows a share above 20% for an allowed campaign', () => {
    // The worst case is exactly at the minimum spend, where the floor binds.
    expect(serviceFeePercent(MIN_MANAGED_SPEND_BDT)).toBeLessThanOrEqual(20)
  })

  it('falls as the budget grows, so scale is rewarded', () => {
    expect(serviceFeePercent(60_000)).toBeLessThan(serviceFeePercent(3000))
    expect(serviceFeePercent(3000)).toBeLessThanOrEqual(serviceFeePercent(1000))
  })
})
