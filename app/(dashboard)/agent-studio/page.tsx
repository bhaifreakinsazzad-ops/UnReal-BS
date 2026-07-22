import { AgentStudioShell } from '@/components/agent-studio/AgentStudioShell'
import { getConversationAIBots, getConversationAIConfig } from '@/lib/ghl/agent-studio'

const LOCATION_ID = process.env.GHL_LOCATION_ID!

export default async function AgentStudioPage() {
  const [bots, config] = await Promise.all([
    getConversationAIBots(LOCATION_ID),
    getConversationAIConfig(LOCATION_ID),
  ])
  return <AgentStudioShell bots={bots} config={config} locationId={LOCATION_ID} />
}
