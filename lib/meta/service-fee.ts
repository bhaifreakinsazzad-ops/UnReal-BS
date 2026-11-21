// What UnReal Systems charges to set up and run a managed ad campaign.
//
// This is OUR fee for the work — it is not ad spend. Ad spend goes to Meta and
// never touches the wallet (see app/api/ads/campaigns/route.ts).
//
// SHAPE: 15% of ad spend, with a floor and a cap.
//
//   15%      matches what Bangladeshi agencies charge for managed social ads
//            (typically 15-20%), so it is defensible to a customer who shops
//            around, and it scales with the value delivered.
//
//   floor    a campaign takes roughly the same 45 minutes of operator time to
//   ৳199     brief, build in Ads Manager, monitor and report, whether it spends
//            ৳1,000 or ৳100,000. Without a floor a small campaign is worked at
//            a loss. The floor binds below ~৳1,327 of spend.
//
//   cap      above ~৳20,000 of spend a straight percentage stops tracking the
//   ৳2,999   work involved and starts feeling like a tax. Capping keeps larger
//            advertisers — the ones worth retaining — on the platform.
//
//   minimum  below ৳1,000 of total spend the floor would be a punitive share of
//   ৳1,000   the budget (a ৳500 campaign paying ৳199 is 40%), and the ad barely
//   spend    delivers anyway. Refused rather than quietly overcharged.
//
// Everything here is pure and unit-tested in service-fee.test.ts.

export const SERVICE_FEE_RATE = 0.15
export const SERVICE_FEE_FLOOR_BDT = 199
export const SERVICE_FEE_CAP_BDT = 2999
export const MIN_MANAGED_SPEND_BDT = 1000

/** Our fee for running a campaign whose total ad spend is `totalBudgetBdt`.
 *  Rounded to whole taka — a fee shown to a shop owner should not have paisa. */
export function serviceFeeBdt(totalBudgetBdt: number): number {
  if (totalBudgetBdt <= 0) return 0
  const raw = totalBudgetBdt * SERVICE_FEE_RATE
  return Math.min(SERVICE_FEE_CAP_BDT, Math.max(SERVICE_FEE_FLOOR_BDT, Math.round(raw)))
}

/** True when the campaign is large enough for us to run it profitably and for
 *  the fee to be a reasonable share of the customer's budget. */
export function meetsManagedMinimum(totalBudgetBdt: number): boolean {
  return totalBudgetBdt >= MIN_MANAGED_SPEND_BDT
}

/** The fee as a share of ad spend, for showing the customer what they are
 *  paying in terms they can judge. */
export function serviceFeePercent(totalBudgetBdt: number): number {
  if (totalBudgetBdt <= 0) return 0
  return Math.round((serviceFeeBdt(totalBudgetBdt) / totalBudgetBdt) * 1000) / 10
}
