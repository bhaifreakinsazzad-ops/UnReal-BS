import 'server-only'
import { ghlFetch } from './client'

export interface GHLWorkflow {
  id: string
  name: string
  status: 'published' | 'draft'
  version: number
  createdAt: string
  updatedAt: string
}

export async function getWorkflows(locationId: string) {
  try {
    const data = await ghlFetch<{ workflows: GHLWorkflow[] }>(
      `/workflows/?locationId=${locationId}`,
      { locationId }
    )
    return data.workflows ?? []
  } catch {
    return []
  }
}
