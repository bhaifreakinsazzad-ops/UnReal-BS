import { BrandBoardShell } from '@/components/brand-board/BrandBoardShell'
import { getBrandBoard } from '@/lib/ghl/brand-board'
import { getTenantLocationId } from '@/lib/tenant'
import { WorkspaceNotConnected } from '@/components/shared/WorkspaceNotConnected'

export const dynamic = 'force-dynamic'

export default async function BrandBoardPage() {
  const locationId = await getTenantLocationId()
  if (!locationId) return <WorkspaceNotConnected feature="Brand Board" />

  const brand = await getBrandBoard(locationId)
  return <BrandBoardShell brand={brand} locationId={locationId} />
}
