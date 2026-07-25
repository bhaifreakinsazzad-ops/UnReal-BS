import 'server-only'
import { ghlFetch } from './client'

// Endpoint verified against GHL's Products API docs (2026-07-25): GET
// /products/ — paginated list, filterable by name.
export interface GHLProduct {
  _id: string
  name: string
  productType: string
  locationId: string
}

export async function getProducts(locationId: string) {
  return ghlFetch<{ products: GHLProduct[]; total: number }>(
    `/products/?locationId=${locationId}&limit=20`,
    { locationId }
  )
}
