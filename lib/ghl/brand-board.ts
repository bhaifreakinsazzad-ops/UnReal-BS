import 'server-only'
import { ghlFetch } from './client'

export interface GHLBrandBoard {
  id: string
  name: string
  email: string
  phone: string
  address: string
  city: string
  state: string
  country: string
  timezone: string
  logoUrl?: string
  website?: string
  primaryColor?: string
  secondaryColor?: string
  businessDescription?: string
  social?: {
    facebook?: string
    instagram?: string
    twitter?: string
    linkedin?: string
    youtube?: string
  }
}

export async function getBrandBoard(locationId: string): Promise<GHLBrandBoard | null> {
  try {
    const data = await ghlFetch<{ location: GHLBrandBoard }>(
      `/locations/${locationId}`,
      { locationId }
    )
    return data.location ?? null
  } catch {
    return null
  }
}

export async function updateBrandBoard(locationId: string, data: Partial<GHLBrandBoard>) {
  return ghlFetch<{ location: GHLBrandBoard }>(`/locations/${locationId}`, {
    method: 'PUT',
    locationId,
    body: data,
  })
}
