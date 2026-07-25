import 'server-only'
import { ghlFetch } from './client'

// Endpoint verified against marketplace.gohighlevel.com/docs/ghl/custom-fields
// (2026-07-25): GET /custom-fields/object-key/:objectKey — object key is
// typically 'contact' for standard contact custom fields.
export interface GHLCustomField {
  id: string
  name: string
  fieldKey: string
  dataType: string
}

export async function getCustomFields(locationId: string, objectKey = 'contact') {
  return ghlFetch<{ customFields: GHLCustomField[] }>(
    `/custom-fields/object-key/${objectKey}?locationId=${locationId}`,
    { locationId }
  )
}
