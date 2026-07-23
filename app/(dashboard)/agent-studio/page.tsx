import { AgentStudioShell } from '@/components/agent-studio/AgentStudioShell'
import { getAgentStudioSnapshot } from '@/lib/ghl/agent-studio'

const LOCATION_ID = process.env.GHL_LOCATION_ID!

export default async function AgentStudioPage() {
  const snapshot = await getAgentStudioSnapshot(LOCATION_ID)
  return <AgentStudioShell initialSnapshot={snapshot} />
}
