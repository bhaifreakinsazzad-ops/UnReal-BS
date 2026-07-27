import { SitesShell } from '@/components/sites/SitesShell'
import { getFunnels } from '@/lib/ghl/sites'
import { getTenantLocationId } from '@/lib/tenant'
import { WorkspaceNotConnected } from '@/components/shared/WorkspaceNotConnected'

export const dynamic = 'force-dynamic'

export default async function SitesPage() {
  const locationId = await getTenantLocationId()
  if (!locationId) return <WorkspaceNotConnected feature="Sites & Funnels" />

  const { funnels, count } = await getFunnels(locationId, 50)
  return <SitesShell funnels={funnels} total={count} locationId={locationId} />
}
