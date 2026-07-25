import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import {
  createVoiceAgent,
  executeStudioAgent,
  getAgentStudioSnapshot,
  updateStudioAgentMetadata,
  type CreateVoiceAgentInput,
} from '@/lib/ghl/agent-studio'
import { GHLRequestError } from '@/lib/ghl/client'
import { logError } from '@/lib/log-error'

export const dynamic = 'force-dynamic'

const locationId = process.env.GHL_LOCATION_ID
const supportedVoiceLanguages = new Set<CreateVoiceAgentInput['language']>([
  'en-US',
  'multi',
  'es',
  'fr',
  'de',
  'it',
  'nl-NL',
  'pt-BR',
])

function jsonError(status: number, message: string) {
  return NextResponse.json({ error: message }, { status })
}

function isVoiceInput(value: unknown): value is CreateVoiceAgentInput {
  const input = value as Partial<CreateVoiceAgentInput>
  return Boolean(
    input
    && typeof input.agentName === 'string' && input.agentName.trim().length > 0 && input.agentName.length <= 40
    && typeof input.businessName === 'string' && input.businessName.trim().length > 0
    && typeof input.welcomeMessage === 'string' && input.welcomeMessage.trim().length > 0 && input.welcomeMessage.length <= 190
    && typeof input.agentPrompt === 'string' && input.agentPrompt.trim().length > 0
    && typeof input.language === 'string' && supportedVoiceLanguages.has(input.language as CreateVoiceAgentInput['language'])
    && typeof input.maxCallDuration === 'number' && input.maxCallDuration >= 180 && input.maxCallDuration <= 900,
  )
}

async function requireSession() {
  const session = await auth()
  return Boolean(session?.user)
}

async function handleGhlError(error: unknown) {
  await logError('agent-studio-route', error)
  if (error instanceof GHLRequestError) {
    const message = error.status === 401 || error.status === 403
      ? 'The private integration does not have the required HighLevel scope for this action.'
      : 'HighLevel could not complete this action. Review the agent configuration and try again.'
    return jsonError(error.status, message)
  }
  return jsonError(502, 'Could not reach HighLevel. Please retry shortly.')
}

export async function GET() {
  if (!await requireSession()) return jsonError(401, 'Authentication required.')
  if (!locationId) return jsonError(500, 'GHL location is not configured.')

  try {
    return NextResponse.json(await getAgentStudioSnapshot(locationId), {
      headers: { 'Cache-Control': 'no-store' },
    })
  } catch (error) {
    return handleGhlError(error)
  }
}

export async function POST(request: NextRequest) {
  if (!await requireSession()) return jsonError(401, 'Authentication required.')
  if (!locationId) return jsonError(500, 'GHL location is not configured.')

  const body = await request.json().catch(() => null) as { action?: string; input?: unknown } | null
  if (!body?.action) return jsonError(400, 'Action is required.')

  try {
    if (body.action === 'create-voice') {
      if (!isVoiceInput(body.input)) return jsonError(400, 'Voice agent details are incomplete or invalid.')
      return NextResponse.json(await createVoiceAgent(locationId, body.input), { status: 201 })
    }

    if (body.action === 'execute-agent') {
      const input = body.input as { agentId?: string; message?: string; executionId?: string }
      if (!input?.agentId || !input.message?.trim()) return jsonError(400, 'An agent and test message are required.')
      return NextResponse.json(await executeStudioAgent(locationId, input.agentId, {
        message: input.message.trim(),
        executionId: input.executionId,
      }))
    }

    return jsonError(400, 'Unsupported action.')
  } catch (error) {
    return handleGhlError(error)
  }
}

export async function PATCH(request: NextRequest) {
  if (!await requireSession()) return jsonError(401, 'Authentication required.')
  if (!locationId) return jsonError(500, 'GHL location is not configured.')

  const body = await request.json().catch(() => null) as {
    agentId?: string
    name?: string
    description?: string
    status?: 'active' | 'inactive' | 'archived'
  } | null

  if (!body?.agentId || !body.name?.trim() || !body.description?.trim() || !body.status) {
    return jsonError(400, 'Complete agent metadata is required.')
  }

  try {
    return NextResponse.json(await updateStudioAgentMetadata(locationId, body.agentId, {
      name: body.name.trim(),
      description: body.description.trim(),
      status: body.status,
    }))
  } catch (error) {
    return handleGhlError(error)
  }
}
