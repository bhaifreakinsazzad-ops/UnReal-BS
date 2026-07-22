import 'server-only'

export interface GHLAIAgent {
  id: string
  name: string
  type: 'voice' | 'conversation' | 'content'
  status: 'active' | 'inactive' | 'training'
  model?: string
  callsHandled?: number
  appointmentsBooked?: number
  messagesProcessed?: number
  contentGenerated?: number
  successRate?: number
}

export interface GHLAIAgentsData {
  agents: GHLAIAgent[]
  totalCallsHandled: number
  totalBookings: number
  totalMessages: number
}

export async function getAIAgentsData(): Promise<GHLAIAgentsData | null> {
  try {
    const token = process.env.GHL_PRIVATE_TOKEN
    const locationId = process.env.GHL_LOCATION_ID

    if (!token || !locationId) return null

    // GHL doesn't expose AI agents via public API yet — return structured demo data
    return null
  } catch {
    return null
  }
}
