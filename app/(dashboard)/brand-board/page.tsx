import { BrandBoardShell } from '@/components/brand-board/BrandBoardShell'
import { getBrandBoard } from '@/lib/ghl/brand-board'

const LOCATION_ID = process.env.GHL_LOCATION_ID!

export default async function BrandBoardPage() {
  const brand = await getBrandBoard(LOCATION_ID)
  return <BrandBoardShell brand={brand} locationId={LOCATION_ID} />
}
