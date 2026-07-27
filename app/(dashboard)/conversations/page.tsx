import { getConversations, type GHLConversation } from '@/lib/ghl/conversations'
import { ConversationsShell } from '@/components/conversations/ConversationsShell'
import { getTenantLocationId } from '@/lib/tenant'
import { WorkspaceNotConnected } from '@/components/shared/WorkspaceNotConnected'

export const dynamic = 'force-dynamic'

export default async function ConversationsPage() {
  const locationId = await getTenantLocationId()
  if (!locationId) return <WorkspaceNotConnected feature="Inbox" />

  let conversations: GHLConversation[] = []
  let total = 0

  try {
    const res = await getConversations(locationId, 30)
    conversations = res.conversations
    total = res.total
  } catch {
    // Falls back to empty state
  }

  return <ConversationsShell conversations={conversations} total={total} locationId={locationId} />
}
