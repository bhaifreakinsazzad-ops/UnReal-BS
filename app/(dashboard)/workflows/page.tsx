import { WorkflowsShell } from '@/components/workflows/WorkflowsShell'
import { getWorkflows } from '@/lib/ghl/workflows'
import { getTenantLocationId } from '@/lib/tenant'
import { WorkspaceNotConnected } from '@/components/shared/WorkspaceNotConnected'

export const dynamic = 'force-dynamic'

export default async function WorkflowsPage() {
  const locationId = await getTenantLocationId()
  if (!locationId) return <WorkspaceNotConnected feature="Sales Pipeline" />

  const workflows = await getWorkflows(locationId)
  return <WorkflowsShell workflows={workflows} />
}
