import 'server-only'
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/client'
import { redactSensitive } from '@/lib/security/redaction'

export async function recordAuditEvent(input: {
  eventType: string
  actorEmail?: string | null
  actorUserId?: string | null
  targetType?: string | null
  targetId?: string | null
  requestId?: string | null
  metadata?: Record<string, unknown>
}): Promise<void> {
  const event = {
    event_type: input.eventType.slice(0, 120),
    actor_email_hash: input.actorEmail ? await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input.actorEmail.trim().toLowerCase())).then((b) => Buffer.from(b).toString('hex')) : null,
    actor_user_id: input.actorUserId ?? null,
    target_type: input.targetType?.slice(0, 80) ?? null,
    target_id: input.targetId?.slice(0, 200) ?? null,
    request_id: input.requestId?.slice(0, 80) ?? null,
    metadata: redactSensitive(input.metadata ?? {}),
  }
  if (!isSupabaseConfigured()) {
    console.info('[security-audit]', event)
    return
  }
  try {
    const { error } = await getSupabaseAdmin().from('unreal_bs_audit_events').insert(event)
    if (error) console.error('[security-audit] persistence failed', { eventType: event.event_type, code: error.code })
  } catch {
    console.error('[security-audit] persistence failed', { eventType: event.event_type })
  }
}
