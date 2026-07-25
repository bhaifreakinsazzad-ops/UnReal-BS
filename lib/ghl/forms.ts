import 'server-only'
import { ghlFetch } from './client'

// Endpoint verified against marketplace.gohighlevel.com/docs/ghl/forms
// (2026-07-25): GET /forms/ (API v3).
export interface GHLForm {
  id: string
  name: string
  locationId: string
}

export async function getForms(locationId: string) {
  return ghlFetch<{ forms: GHLForm[] }>(
    `/forms/?locationId=${locationId}`,
    { locationId, version: 'v3' }
  )
}
