import 'server-only'
import { ghlFetch } from './client'

export interface GHLFunnelPage {
  id: string
  name: string
  pathUri: string
  url: string
  sequence: number
  stepId: string
}

export interface GHLFunnel {
  id: string
  name: string
  type: 'funnel' | 'website'
  url: string
  domainId?: string
  steps: GHLFunnelPage[]
  dateUpdated: string
  dateCreated: string
}

export interface GHLSiteStats {
  visitors: number
  pageViews: number
  optIns: number
}

export async function getFunnels(locationId: string, limit = 20, search?: string) {
  try {
    let path = `/funnels/?locationId=${locationId}&limit=${limit}`
    if (search) path += `&search=${encodeURIComponent(search)}`
    const data = await ghlFetch<{ funnels: GHLFunnel[]; count: number }>(path, { locationId })
    return { funnels: data.funnels ?? [], count: data.count ?? 0 }
  } catch {
    return { funnels: [], count: 0 }
  }
}

export async function getFunnelPages(funnelId: string, locationId: string) {
  try {
    const data = await ghlFetch<{ steps: GHLFunnelPage[] }>(
      `/funnels/${funnelId}/pages?locationId=${locationId}`,
      { locationId }
    )
    return data.steps ?? []
  } catch {
    return []
  }
}
