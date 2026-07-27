import { IntegrationsShell } from '@/components/integrations/IntegrationsShell'
import { getTenantLocationId } from '@/lib/tenant'
import { WorkspaceNotConnected } from '@/components/shared/WorkspaceNotConnected'

export const dynamic = 'force-dynamic'

export default async function IntegrationsPage() {
  const locationId = await getTenantLocationId()
  if (!locationId) return <WorkspaceNotConnected feature="Integrations" />

  return <IntegrationsShell locationId={locationId} />
}
