import 'server-only'
import { ghlFetch } from './client'

export interface GHLConversation {
  id: string
  locationId: string
  contactId: string
  fullName: string
  contactName: string
  companyName: string | null
  email: string
  tags: string[]
  type: string
  lastMessageDate: number
  lastMessageBody: string
  lastMessageType: string
  lastMessageDirection: string
  unreadCount: number
  inbox: boolean
  dateAdded: number
  dateUpdated: number
}

export interface GHLMessage {
  id: string
  conversationId: string
  body: string
  direction: 'inbound' | 'outbound'
  dateAdded: string
  type: string
  status: string
  contentType?: string
}

export async function getConversations(locationId: string, limit = 20, query?: string) {
  let path = `/conversations/search?locationId=${locationId}&limit=${limit}`
  if (query) path += `&query=${encodeURIComponent(query)}`
  return ghlFetch<{ conversations: GHLConversation[]; total: number }>(path, { locationId })
}

export async function getMessages(conversationId: string, locationId: string, limit = 20) {
  return ghlFetch<{ messages: GHLMessage[]; total: number }>(
    `/conversations/${conversationId}/messages?limit=${limit}`,
    { locationId }
  )
}

export async function sendMessage(
  conversationId: string,
  locationId: string,
  body: string,
  type = 'SMS'
) {
  return ghlFetch<{ message: GHLMessage }>('/conversations/messages', {
    method: 'POST',
    locationId,
    body: { conversationId, body, type },
  })
}

export async function markAsRead(conversationId: string, locationId: string) {
  return ghlFetch(`/conversations/${conversationId}/read`, {
    method: 'PUT',
    locationId,
  })
}
