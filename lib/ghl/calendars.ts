import 'server-only'
import { ghlFetch } from './client'

// Endpoint verified against marketplace.gohighlevel.com/docs/ghl/calendars
// (2026-07-25): GET /calendars/ — "all calendars in a location."
export interface GHLCalendar {
  id: string
  name: string
  calendarType: string
  isActive: boolean
}

export async function getCalendars(locationId: string) {
  return ghlFetch<{ calendars: GHLCalendar[] }>(
    `/calendars/?locationId=${locationId}`,
    { locationId }
  )
}
