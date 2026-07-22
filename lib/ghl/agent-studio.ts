import 'server-only'
import { ghlFetch } from './client'

export interface GHLBot {
  id: string
  name: string
  description?: string
  status: 'active' | 'inactive'
  type: string
  channel?: string
  createdAt?: string
  updatedAt?: string
}

export interface GHLConversationAIConfig {
  isActive: boolean
  botName?: string
  botPersonality?: string
  botPrompt?: string
  channels?: string[]
}

export async function getConversationAIBots(locationId: string) {
  try {
    const data = await ghlFetch<{ bots: GHLBot[] }>(
      `/conversations/providers/bots?locationId=${locationId}`,
      { locationId }
    )
    return data.bots ?? []
  } catch {
    return []
  }
}

export async function getConversationAIConfig(locationId: string) {
  try {
    const data = await ghlFetch<GHLConversationAIConfig>(
      `/locations/${locationId}/conversation-ai/config`,
      { locationId }
    )
    return data
  } catch {
    return null
  }
}

export async function updateConversationAIConfig(
  locationId: string,
  config: Partial<GHLConversationAIConfig>
) {
  return ghlFetch<GHLConversationAIConfig>(
    `/locations/${locationId}/conversation-ai/config`,
    { method: 'PUT', locationId, body: config }
  )
}
