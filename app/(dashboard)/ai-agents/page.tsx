import { AIAgentsShell } from '@/components/ai-agents/AIAgentsShell'
import { getTenantLocationId } from '@/lib/tenant'
import { WorkspaceNotConnected } from '@/components/shared/WorkspaceNotConnected'

export const metadata = { title: 'AI এজেন্ট — UnReal Systems' }

export const dynamic = 'force-dynamic'

export default async function AIAgentsPage() {
  // The outbound GHL configuration links on this page point into a specific
  // sub-account, so they must be built from the caller's own location — not
  // the shared env default.
  const locationId = await getTenantLocationId()
  if (!locationId) return <WorkspaceNotConnected feature="AI Agents" />

  return <AIAgentsShell locationId={locationId} />
}
