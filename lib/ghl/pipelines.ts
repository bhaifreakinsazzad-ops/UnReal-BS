import 'server-only'
import { ghlFetch } from './client'

export interface GHLPipeline {
  id: string
  name: string
  stages: { id: string; name: string; position: number }[]
}

export async function getPipelines(locationId: string) {
  return ghlFetch<{ pipelines: GHLPipeline[] }>(
    `/opportunities/pipelines?locationId=${locationId}`,
    { locationId }
  )
}

export interface GHLOpportunity {
  id: string
  name: string
  pipelineId: string
  pipelineStageId: string
  status: string
  monetaryValue: number
  contactId: string
  contact: { name: string; email: string; phone: string }
  createdAt: string
  updatedAt: string
}

export async function getOpportunities(locationId: string, pipelineId?: string) {
  const qs = pipelineId ? `&pipelineId=${pipelineId}` : ''
  return ghlFetch<{ opportunities: GHLOpportunity[]; total: number }>(
    `/opportunities/search?location_id=${locationId}${qs}&limit=20`,
    { locationId }
  )
}
