import { CreditCenterShell } from '@/components/credit-center/CreditCenterShell'
import { demoOpportunities } from '@/lib/unreal/opportunities'

export const metadata = { title: 'Credit Center - UNREAL BS' }

export default function CreditCenterPage() {
  return <CreditCenterShell opportunities={demoOpportunities} />
}
