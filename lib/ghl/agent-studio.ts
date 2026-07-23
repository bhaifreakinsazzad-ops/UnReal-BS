import 'server-only'

import { ghlFetch } from './client'

export type AgentStatus = 'active' | 'inactive' | 'archived' | 'unknown'
export type CapabilityState = 'available' | 'requires_scope' | 'unavailable'

interface RawStudioAgent {
  id?: string
  agentId?: string
  name?: string
  description?: string
  status?: string
  versions?: Array<{
    id?: string
    versionId?: string
    name?: string
    status?: string
    createdAt?: string
    updatedAt?: string
  }>
  createdAt?: string
  updatedAt?: string
}

interface RawVoiceAgent {
  id?: string
  agentName?: string
  name?: string
  businessName?: string
  welcomeMessage?: string
  language?: string
  inboundNumber?: string
  isAgentAsBackupDisabled?: boolean
  updatedAt?: string
  createdAt?: string
}

export interface StudioAgent {
  id: string
  name: string
  description: string
  status: AgentStatus
  versions: Array<{
    id: string
    name: string
    status: string
    updatedAt?: string
  }>
  updatedAt?: string
}

export interface VoiceAgent {
  id: string
  name: string
  businessName?: string
  welcomeMessage?: string
  language?: string
  inboundNumber?: string
  isBackupDisabled: boolean
  updatedAt?: string
}

export interface AgentStudioCapability {
  key: 'agentStudioRead' | 'agentStudioWrite' | 'voiceRead' | 'voiceWrite' | 'voiceAnalytics'
  label: string
  scope: string
  state: CapabilityState
  detail: string
}

export interface AgentStudioSnapshot {
  studioAgents: StudioAgent[]
  studioTotal: number
  voiceAgents: VoiceAgent[]
  voiceTotal: number
  voiceCallLogTotal: number
  capabilities: AgentStudioCapability[]
  fetchedAt: string
}

export interface CreateVoiceAgentInput {
  agentName: string
  businessName: string
  welcomeMessage: string
  agentPrompt: string
  language: 'en-US' | 'multi' | 'es' | 'fr' | 'de' | 'it' | 'nl-NL' | 'pt-BR'
  maxCallDuration: number
}

function normalizeStatus(value?: string): AgentStatus {
  return value === 'active' || value === 'inactive' || value === 'archived' ? value : 'unknown'
}

function getMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown API error'
}

function capabilityFromError(
  key: AgentStudioCapability['key'],
  label: string,
  scope: string,
  error?: unknown,
): AgentStudioCapability {
  const message = error ? getMessage(error) : ''
  const denied = /\b(401|403|scope|permission|unauthori[sz]ed)\b/i.test(message)
  return {
    key,
    label,
    scope,
    state: denied ? 'requires_scope' : 'unavailable',
    detail: denied
      ? `The private integration needs ${scope}.`
      : 'This capability could not be verified from the current token.',
  }
}

export async function getAgentStudioSnapshot(locationId: string): Promise<AgentStudioSnapshot> {
  const [studioResult, voiceResult, callLogResult] = await Promise.allSettled([
    ghlFetch<{ agents?: RawStudioAgent[]; pagination?: { total?: number } }>(
      `/agent-studio/agent?locationId=${encodeURIComponent(locationId)}&limit=100&offset=0`,
      { locationId, version: '2023-02-21' },
    ),
    ghlFetch<{ agents?: RawVoiceAgent[]; total?: number }>(
      `/voice-ai/agents?locationId=${encodeURIComponent(locationId)}&page=1&pageSize=50`,
      { locationId, version: 'v3' },
    ),
    ghlFetch<{ totalRecords?: number }>(
      `/voice-ai/dashboard/call-logs?locationId=${encodeURIComponent(locationId)}&page=1&pageSize=1`,
      { locationId, version: 'v3' },
    ),
  ])

  const studioData = studioResult.status === 'fulfilled' ? studioResult.value : undefined
  const voiceData = voiceResult.status === 'fulfilled' ? voiceResult.value : undefined
  const callLogData = callLogResult.status === 'fulfilled' ? callLogResult.value : undefined

  const studioAgents = (studioData?.agents ?? []).map((agent) => ({
    id: agent.id ?? agent.agentId ?? crypto.randomUUID(),
    name: agent.name ?? 'Untitled Agent',
    description: agent.description ?? 'No description provided.',
    status: normalizeStatus(agent.status),
    versions: (agent.versions ?? []).map((version) => ({
      id: version.id ?? version.versionId ?? crypto.randomUUID(),
      name: version.name ?? 'Untitled version',
      status: version.status ?? 'draft',
      updatedAt: version.updatedAt ?? version.createdAt,
    })),
    updatedAt: agent.updatedAt ?? agent.createdAt,
  }))

  const voiceAgents = (voiceData?.agents ?? []).map((agent) => ({
    id: agent.id ?? crypto.randomUUID(),
    name: agent.agentName ?? agent.name ?? 'Untitled voice agent',
    businessName: agent.businessName,
    welcomeMessage: agent.welcomeMessage,
    language: agent.language,
    inboundNumber: agent.inboundNumber,
    isBackupDisabled: Boolean(agent.isAgentAsBackupDisabled),
    updatedAt: agent.updatedAt ?? agent.createdAt,
  }))

  const capabilities: AgentStudioCapability[] = [
    studioResult.status === 'fulfilled'
      ? { key: 'agentStudioRead', label: 'Agent Studio inventory', scope: 'agent-studio.readonly', state: 'available', detail: 'Live agent inventory is connected.' }
      : capabilityFromError('agentStudioRead', 'Agent Studio inventory', 'agent-studio.readonly', studioResult.reason),
    { key: 'agentStudioWrite', label: 'Agent Studio publish and edit', scope: 'agent-studio.write', state: 'unavailable', detail: 'Enabled after a write action succeeds with the current private integration.' },
    voiceResult.status === 'fulfilled'
      ? { key: 'voiceRead', label: 'Voice AI inventory', scope: 'voice-ai-agents.readonly', state: 'available', detail: 'Live Voice AI agents are connected.' }
      : capabilityFromError('voiceRead', 'Voice AI inventory', 'voice-ai-agents.readonly', voiceResult.reason),
    { key: 'voiceWrite', label: 'Voice AI creation', scope: 'voice-ai-agents.write', state: 'unavailable', detail: 'Enabled after a creation action succeeds with the current private integration.' },
    callLogResult.status === 'fulfilled'
      ? { key: 'voiceAnalytics', label: 'Voice call analytics', scope: 'voice-ai-dashboard.readonly', state: 'available', detail: 'Live Voice AI call log totals are connected.' }
      : capabilityFromError('voiceAnalytics', 'Voice call analytics', 'voice-ai-dashboard.readonly', callLogResult.reason),
  ]

  return {
    studioAgents,
    studioTotal: studioData?.pagination?.total ?? studioAgents.length,
    voiceAgents,
    voiceTotal: voiceData?.total ?? voiceAgents.length,
    voiceCallLogTotal: callLogData?.totalRecords ?? 0,
    capabilities,
    fetchedAt: new Date().toISOString(),
  }
}

export async function updateStudioAgentMetadata(
  locationId: string,
  agentId: string,
  input: Pick<StudioAgent, 'name' | 'description' | 'status'>,
) {
  return ghlFetch(`/agent-studio/agent/${encodeURIComponent(agentId)}?source=api`, {
    method: 'PATCH',
    locationId,
    version: '2021-04-15',
    body: { locationId, ...input },
  })
}

export async function executeStudioAgent(
  locationId: string,
  agentId: string,
  input: { message: string; executionId?: string },
) {
  return ghlFetch<Record<string, unknown>>(`/agent-studio/agent/${encodeURIComponent(agentId)}/execute`, {
    method: 'POST',
    locationId,
    version: 'v3',
    body: { locationId, ...input },
  })
}

export async function createVoiceAgent(locationId: string, input: CreateVoiceAgentInput) {
  return ghlFetch<Record<string, unknown>>('/voice-ai/agents', {
    method: 'POST',
    locationId,
    version: 'v3',
    body: {
      locationId,
      ...input,
      patienceLevel: 'high',
      sendUserIdleReminders: true,
      reminderAfterIdleTimeSeconds: 8,
      callEndWorkflowIds: [],
      sendPostCallNotificationTo: {
        admins: true,
        allUsers: false,
        contactAssignedUser: false,
        specificUsers: [],
        customEmails: [],
      },
      agentWorkingHours: [],
      isAgentAsBackupDisabled: false,
      translation: { enabled: false },
    },
  })
}
