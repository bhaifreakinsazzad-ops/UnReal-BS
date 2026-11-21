import { ServicesMarketplaceShell } from '@/components/services/ServicesMarketplaceShell'
import { servicePacks } from '@/lib/unreal/services'

export const metadata = { title: 'SaaS IT Services - UnReal Systems' }

export default function ServicesPage() {
  return <ServicesMarketplaceShell services={servicePacks} />
}
