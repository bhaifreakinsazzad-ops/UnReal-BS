import { AIAgentsShell } from '@/components/ai-agents/AIAgentsShell'

export const metadata = { title: 'AI এজেন্ট — UnReal BS' }

export default function AIAgentsPage() {
  const locationId = process.env.GHL_LOCATION_ID ?? ''
  return <AIAgentsShell locationId={locationId} />
}
