import 'server-only'
import { ghlFetch } from './client'

export interface GHLLocation {
  id: string
  name: string
  phone: string
  email: string
  address: string
  city: string
  country: string
  timezone: string
  logoUrl?: string
}

export async function getLocation(locationId: string) {
  return ghlFetch<{ location: GHLLocation }>(`/locations/${locationId}`, { locationId })
}

export async function getLocationStats(locationId: string) {
  return ghlFetch<{
    contactsCount: number
    opportunitiesCount: number
    appointmentsCount: number
  }>(`/locations/${locationId}/stats`, { locationId })
}
