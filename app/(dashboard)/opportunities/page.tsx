import { OpportunityFeedShell } from '@/components/opportunities/OpportunityFeedShell'
import { demoOpportunities } from '@/lib/unreal/opportunities'

export const metadata = { title: 'Opportunities - UNREAL BS' }

export default function OpportunitiesPage() {
  return <OpportunityFeedShell opportunities={demoOpportunities} />
}
