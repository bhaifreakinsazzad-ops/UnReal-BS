import { ServicesMarketplaceShell } from '@/components/services/ServicesMarketplaceShell'
import { servicePacks } from '@/lib/unreal/services'

export const metadata = { title: '400 Services - UNREAL BS' }

export default function ServicesPage() {
  return <ServicesMarketplaceShell services={servicePacks} />
}
