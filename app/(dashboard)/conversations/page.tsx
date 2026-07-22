import { getConversations, type GHLConversation } from '@/lib/ghl/conversations'
import { ConversationsShell } from '@/components/conversations/ConversationsShell'

const LOCATION_ID = process.env.GHL_LOCATION_ID!

export default async function ConversationsPage() {
  let conversations: GHLConversation[] = []
  let total = 0

  try {
    const res = await getConversations(LOCATION_ID, 30)
    conversations = res.conversations
    total = res.total
  } catch {
    // Falls back to empty state
  }

  return <ConversationsShell conversations={conversations} total={total} locationId={LOCATION_ID} />
}
