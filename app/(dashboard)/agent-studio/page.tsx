import { AgentStudioShell } from '@/components/agent-studio/AgentStudioShell'
import { getAgentStudioSnapshot } from '@/lib/ghl/agent-studio'
import { getTenantLocationId } from '@/lib/tenant'
import { WorkspaceNotConnected } from '@/components/shared/WorkspaceNotConnected'

export const dynamic = 'force-dynamic'

export default async function AgentStudioPage() {
  const locationId = await getTenantLocationId()
  if (!locationId) return <WorkspaceNotConnected feature="Agent Studio" />

  const snapshot = await getAgentStudioSnapshot(locationId)
  return <AgentStudioShell initialSnapshot={snapshot} />
}
