import { UnrealBSLanding } from '@/components/marketing/UnrealBSLanding'
import { brand } from '@/lib/brand'

export const metadata = {
  title: `${brand.name} - SaaS IT Agency Partner Program`,
  description: brand.description,
}

export default function UnrealBSPage() {
  return <UnrealBSLanding />
}
