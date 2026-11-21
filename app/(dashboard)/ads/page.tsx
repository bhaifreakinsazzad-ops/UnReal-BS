import { AdsShell } from '@/components/ads/AdsShell'

export const metadata = { title: 'Facebook Ads - UnReal Systems' }

export const dynamic = 'force-dynamic'

// Ads do not require a connected GHL workspace — campaigns live in our own
// per-user table, so this works from the moment someone signs up.
export default function AdsPage() {
  return <AdsShell />
}
