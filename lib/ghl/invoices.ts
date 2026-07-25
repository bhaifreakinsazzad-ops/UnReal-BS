import 'server-only'
import { ghlFetch } from './client'

// Endpoint verified against marketplace.gohighlevel.com/docs/ghl/invoices
// (2026-07-25): GET /invoices/ — "API to get list of invoices."
export interface GHLInvoice {
  _id: string
  status: string
  total: number
  contactId: string
  locationId: string
}

export async function getInvoices(locationId: string) {
  return ghlFetch<{ invoices: GHLInvoice[]; total: number }>(
    `/invoices/?locationId=${locationId}&limit=20`,
    { locationId }
  )
}
