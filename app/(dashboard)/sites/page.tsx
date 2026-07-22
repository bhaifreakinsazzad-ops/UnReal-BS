import { SitesShell } from '@/components/sites/SitesShell'
import { getFunnels } from '@/lib/ghl/sites'

const LOCATION_ID = process.env.GHL_LOCATION_ID!

export default async function SitesPage() {
  const { funnels, count } = await getFunnels(LOCATION_ID, 50)
  return <SitesShell funnels={funnels} total={count} locationId={LOCATION_ID} />
}
