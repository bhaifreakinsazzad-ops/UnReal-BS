'use client'

import { FormEvent, useDeferredValue, useState, useTransition } from 'react'
import {
  Activity,
  ArrowRight,
  Bot,
  BrainCircuit,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  ExternalLink,
  Headphones,
  LockKeyhole,
  MessageSquareText,
  Mic2,
  Play,
  Plus,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  WandSparkles,
  X,
} from 'lucide-react'
import { cn, formatDate } from '@/lib/utils'
import { useLocale } from '@/lib/i18n/context'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sheet } from '@/components/ui/sheet'
import type {
  AgentStatus,
  AgentStudioCapability,
  AgentStudioSnapshot,
  StudioAgent,
  VoiceAgent,
} from '@/lib/ghl/agent-studio'

type StudioTab = 'studio' | 'voice' | 'recommendations'
type SheetState =
  | { type: 'create-voice' }
  | { type: 'agent'; agent: StudioAgent }
  | { type: 'voice'; agent: VoiceAgent }
  | null

interface Props {
  initialSnapshot: AgentStudioSnapshot
}

const recommendations = [
  {
    id: 'lead-qualification',
    label: 'Qualify inbound leads',
    title: 'Start with an Agent Studio lead qualifier',
    description: 'Use a staged agent to collect intent, route qualified prospects, and retain execution history before promotion.',
    tab: 'studio' as const,
    icon: BrainCircuit,
  },
  {
    id: 'phone-coverage',
    label: 'Cover inbound calls',
    title: 'Create a Voice AI front desk',
    description: 'Use a Voice AI agent for greeting, FAQ coverage, and post-call notifications. Configure a phone number only after the agent is ready.',
    tab: 'voice' as const,
    icon: Headphones,
  },
  {
    id: 'consultation-routing',
    label: 'Route consultations',
    title: 'Build an intake and routing agent',
    description: 'Model the required questions, human handoff boundary, and booking action before publishing it to production.',
    tab: 'studio' as const,
    icon: MessageSquareText,
  },
]

function capabilityVariant(state: AgentStudioCapability['state']) {
  return state === 'available' ? 'success' : state === 'requires_scope' ? 'warning' : 'gray'
}

function statusVariant(status: AgentStatus) {
  return status === 'active' ? 'success' : status === 'inactive' ? 'warning' : 'gray'
}

function agentStudioUrl() {
  return 'https://app.gohighlevel.com/agent-studio'
}

async function parseResponse(response: Response) {
  const payload = await response.json().catch(() => ({})) as { error?: string }
  if (!response.ok) throw new Error(payload.error ?? 'The requested action failed.')
  return payload
}

export function AgentStudioShell({ initialSnapshot }: Props) {
  const locale = useLocale()
  const [snapshot, setSnapshot] = useState(initialSnapshot)
  const [tab, setTab] = useState<StudioTab>('studio')
  const [query, setQuery] = useState('')
  const [sheet, setSheet] = useState<SheetState>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const deferredQuery = useDeferredValue(query.trim().toLowerCase())

  const filteredStudioAgents = snapshot.studioAgents.filter((agent) => (
    !deferredQuery || `${agent.name} ${agent.description}`.toLowerCase().includes(deferredQuery)
  ))
  const filteredVoiceAgents = snapshot.voiceAgents.filter((agent) => (
    !deferredQuery || `${agent.name} ${agent.businessName ?? ''}`.toLowerCase().includes(deferredQuery)
  ))
  const activeStudioAgents = snapshot.studioAgents.filter((agent) => agent.status === 'active').length

  function refresh() {
    setError(null)
    startTransition(async () => {
      try {
        const next = await fetch('/api/agent-studio', { cache: 'no-store' }).then(parseResponse) as AgentStudioSnapshot
        setSnapshot(next)
        setNotice('Live HighLevel data refreshed.')
      } catch (refreshError) {
        setError(refreshError instanceof Error ? refreshError.message : 'Could not refresh Agent Studio.')
      }
    })
  }

  async function updateAgent(agent: StudioAgent, changes: Pick<StudioAgent, 'name' | 'description' | 'status'>) {
    setError(null)
    const previous = snapshot
    setSnapshot((current) => ({
      ...current,
      studioAgents: current.studioAgents.map((item) => item.id === agent.id ? { ...item, ...changes } : item),
    }))

    try {
      await fetch('/api/agent-studio', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId: agent.id, ...changes }),
      }).then(parseResponse)
      setNotice(`${changes.name} updated in HighLevel.`)
      setSheet(null)
      refresh()
    } catch (updateError) {
      setSnapshot(previous)
      setError(updateError instanceof Error ? updateError.message : 'Could not update this agent.')
    }
  }

  const copy = locale === 'bn'
    ? {
        kicker: 'লাইভ GHl ইন্টিগ্রেশন',
        title: 'Agent Studio',
        subtitle: 'আপনার Private Integration যেসব AI capability অনুমতি দেয়, শুধু সেগুলোই এখানে চালু থাকে।',
        refresh: 'রিফ্রেশ',
        studio: 'Agent Studio',
        voice: 'Voice AI',
        recommendations: 'Recommendation',
        create: 'নতুন Voice Agent',
      }
    : {
        kicker: 'LIVE GHL INTEGRATION',
        title: 'Agent Studio',
        subtitle: 'Operate only the AI capabilities your Private Integration is actually allowed to access.',
        refresh: 'Refresh',
        studio: 'Agent Studio',
        voice: 'Voice AI',
        recommendations: 'Recommendations',
        create: 'New Voice Agent',
      }

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
      <section className="relative overflow-hidden rounded-3xl border border-violet-200 bg-[#0D0D1A] px-5 py-6 text-white shadow-xl md:px-7 md:py-8">
        <div className="pointer-events-none absolute inset-0 opacity-80" style={{ background: 'radial-gradient(circle at 15% 15%, rgba(124,58,237,.52), transparent 35%), radial-gradient(circle at 85% 25%, rgba(0,200,117,.22), transparent 30%)' }} />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-bold tracking-[0.14em] text-violet-100">
              <Activity className="h-3.5 w-3.5 text-emerald-300" /> {copy.kicker}
            </div>
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{copy.title}</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-violet-100/80 md:text-base">{copy.subtitle}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" className="border-white/20 bg-white/10 text-white hover:border-white/35 hover:bg-white/15 hover:text-white" onClick={refresh} loading={isPending}>
              <RefreshCw className="h-4 w-4" /> {copy.refresh}
            </Button>
            <Button variant="accent" onClick={() => setSheet({ type: 'create-voice' })}>
              <Plus className="h-4 w-4" /> {copy.create}
            </Button>
          </div>
        </div>
      </section>

      {(notice || error) && (
        <div className={cn('flex items-start gap-3 rounded-xl border px-4 py-3 text-sm', error ? 'border-red-200 bg-red-50 text-red-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800')} role={error ? 'alert' : 'status'}>
          {error ? <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" /> : <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />}
          <p className="flex-1">{error ?? notice}</p>
          <button className="rounded p-0.5 hover:bg-black/5" aria-label="Dismiss notification" onClick={() => { setError(null); setNotice(null) }}><X className="h-4 w-4" /></button>
        </div>
      )}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric icon={BrainCircuit} label="Production agents" value={snapshot.studioTotal} detail={`${activeStudioAgents} active`} color="violet" />
        <Metric icon={Mic2} label="Voice agents" value={snapshot.voiceTotal} detail="Live GHL inventory" color="emerald" />
        <Metric icon={Activity} label="Voice call logs" value={snapshot.voiceCallLogTotal} detail="Token-authorized data" color="blue" />
        <Metric icon={ShieldCheck} label="Verified capabilities" value={snapshot.capabilities.filter((item) => item.state === 'available').length} detail={`of ${snapshot.capabilities.length} monitored`} color="amber" />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1fr_320px]">
        <div className="min-w-0 rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-gray-100 p-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap gap-1 rounded-xl bg-gray-100 p-1" role="tablist" aria-label="Agent Studio views">
              {[
                { id: 'studio' as const, label: copy.studio, icon: Bot },
                { id: 'voice' as const, label: copy.voice, icon: Mic2 },
                { id: 'recommendations' as const, label: copy.recommendations, icon: WandSparkles },
              ].map((item) => (
                <button key={item.id} role="tab" aria-selected={tab === item.id} onClick={() => setTab(item.id)} className={cn('inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors', tab === item.id ? 'bg-white text-violet-700 shadow-sm' : 'text-gray-500 hover:text-gray-900')}>
                  <item.icon className="h-4 w-4" /> {item.label}
                </button>
              ))}
            </div>
            {tab !== 'recommendations' && (
              <label className="relative block md:w-64">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search live agents" className="pl-9" />
              </label>
            )}
          </div>

          <div className="p-4 md:p-5">
            {tab === 'studio' && (
              <StudioTab
                agents={filteredStudioAgents}
                total={snapshot.studioTotal}
                onOpen={(agent) => setSheet({ type: 'agent', agent })}
                onOpenGhl={() => window.open(agentStudioUrl(), '_blank', 'noopener,noreferrer')}
              />
            )}
            {tab === 'voice' && (
              <VoiceTab agents={filteredVoiceAgents} onOpen={(agent) => setSheet({ type: 'voice', agent })} onCreate={() => setSheet({ type: 'create-voice' })} />
            )}
            {tab === 'recommendations' && (
              <RecommendationTab onChoose={(nextTab) => setTab(nextTab)} />
            )}
          </div>
        </div>

        <aside className="space-y-5">
          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <LockKeyhole className="h-4 w-4 text-violet-600" />
              <h2 className="font-semibold text-gray-900">Private integration access</h2>
            </div>
            <div className="space-y-3">
              {snapshot.capabilities.map((capability) => (
                <div key={capability.key} className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-gray-800">{capability.label}</p>
                    <Badge variant={capabilityVariant(capability.state)}>{capability.state === 'available' ? 'Live' : capability.state === 'requires_scope' ? 'Scope needed' : 'Unverified'}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">{capability.detail}</p>
                  <p className="mt-2 font-mono text-[11px] text-gray-400">{capability.scope}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50 to-white p-5">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-violet-600 p-2 text-white"><Sparkles className="h-4 w-4" /></div>
              <div>
                <h2 className="font-semibold text-gray-900">Recommended next move</h2>
                <p className="mt-1 text-sm leading-6 text-gray-600">{snapshot.studioTotal === 0 ? 'Create your first staged Agent Studio workflow, then use the live test panel before production promotion.' : 'Use the test panel to validate a live agent with a controlled input before changing its production status.'}</p>
                <button onClick={() => setTab('recommendations')} className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-violet-700 hover:text-violet-900">
                  Open recommendations <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </section>
        </aside>
      </section>

      <p className="text-center text-xs text-gray-400">Last synchronized {formatDate(snapshot.fetchedAt, locale)}. Token values and raw HighLevel errors are never shown in this workspace.</p>

      <AgentSheets sheet={sheet} onClose={() => setSheet(null)} onUpdate={updateAgent} onRefresh={refresh} setError={setError} setNotice={setNotice} />
    </div>
  )
}

function Metric({ icon: Icon, label, value, detail, color }: { icon: typeof BrainCircuit; label: string; value: number; detail: string; color: 'violet' | 'emerald' | 'blue' | 'amber' }) {
  const colors = {
    violet: 'bg-violet-50 text-violet-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    blue: 'bg-blue-50 text-blue-600',
    amber: 'bg-amber-50 text-amber-600',
  }
  return <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"><div className="flex items-center gap-3"><div className={cn('rounded-xl p-2.5', colors[color])}><Icon className="h-5 w-5" /></div><div><p className="text-2xl font-bold tracking-tight text-gray-900">{value.toLocaleString()}</p><p className="text-sm font-medium text-gray-700">{label}</p></div></div><p className="mt-3 text-xs text-gray-400">{detail}</p></div>
}

function StudioTab({ agents, total, onOpen, onOpenGhl }: { agents: StudioAgent[]; total: number; onOpen: (agent: StudioAgent) => void; onOpenGhl: () => void }) {
  if (total === 0) {
    return <EmptyState icon={BrainCircuit} title="No active Agent Studio workflows yet" body="The connected location has no active Agent Studio agents. Create a staged workflow in HighLevel, then return here to monitor, test, and publish with the available private-integration scopes." action="Open HighLevel Agent Studio" onAction={onOpenGhl} />
  }
  if (agents.length === 0) return <EmptyState icon={Search} title="No agents match this search" body="Try a different name, status, or workflow description." />
  return <div className="grid gap-3 lg:grid-cols-2">{agents.map((agent) => <button key={agent.id} onClick={() => onOpen(agent)} className="group rounded-2xl border border-gray-200 p-4 text-left transition-all hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-md"><div className="flex items-start gap-3"><div className="rounded-xl bg-violet-100 p-2.5 text-violet-700"><BrainCircuit className="h-5 w-5" /></div><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><h3 className="truncate font-semibold text-gray-900">{agent.name}</h3><Badge variant={statusVariant(agent.status)}>{agent.status}</Badge></div><p className="mt-1 line-clamp-2 text-sm leading-5 text-gray-500">{agent.description}</p></div><ChevronRight className="mt-1 h-4 w-4 text-gray-300 transition-transform group-hover:translate-x-0.5" /></div><div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3 text-xs text-gray-500"><span>{agent.versions.length} version{agent.versions.length === 1 ? '' : 's'}</span><span>{agent.updatedAt ? `Updated ${formatDate(agent.updatedAt)}` : 'No update timestamp'}</span></div></button>)}</div>
}

function VoiceTab({ agents, onOpen, onCreate }: { agents: VoiceAgent[]; onOpen: (agent: VoiceAgent) => void; onCreate: () => void }) {
  if (agents.length === 0) return <EmptyState icon={Mic2} title="No Voice AI agents in this location" body="The private integration can read Voice AI inventory. Use the guided creator to submit a real Voice AI configuration when the write scope is enabled." action="Create Voice AI agent" onAction={onCreate} />
  return <div className="grid gap-3 lg:grid-cols-2">{agents.map((agent) => <button key={agent.id} onClick={() => onOpen(agent)} className="group rounded-2xl border border-gray-200 p-4 text-left transition-all hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md"><div className="flex items-start gap-3"><div className="rounded-xl bg-emerald-100 p-2.5 text-emerald-700"><Mic2 className="h-5 w-5" /></div><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><h3 className="truncate font-semibold text-gray-900">{agent.name}</h3><Badge variant={agent.isBackupDisabled ? 'gray' : 'success'}>{agent.isBackupDisabled ? 'Backup off' : 'Backup ready'}</Badge></div><p className="mt-1 truncate text-sm text-gray-500">{agent.businessName ?? 'Business not configured'}</p></div><ChevronRight className="mt-1 h-4 w-4 text-gray-300 transition-transform group-hover:translate-x-0.5" /></div><div className="mt-4 flex flex-wrap gap-2 border-t border-gray-100 pt-3"><Badge variant="outline">{agent.language ?? 'Language unset'}</Badge><Badge variant="outline">{agent.inboundNumber ?? 'No inbound number'}</Badge></div></button>)}</div>
}

function RecommendationTab({ onChoose }: { onChoose: (tab: StudioTab) => void }) {
  return <div className="grid gap-4 md:grid-cols-3">{recommendations.map((recommendation) => <div key={recommendation.id} className="flex flex-col rounded-2xl border border-gray-200 bg-gradient-to-b from-white to-gray-50 p-5"><div className="mb-5 inline-flex w-fit rounded-xl bg-violet-100 p-2.5 text-violet-700"><recommendation.icon className="h-5 w-5" /></div><p className="text-xs font-bold uppercase tracking-[0.12em] text-violet-600">{recommendation.label}</p><h3 className="mt-2 font-semibold text-gray-900">{recommendation.title}</h3><p className="mt-2 flex-1 text-sm leading-6 text-gray-600">{recommendation.description}</p><button onClick={() => onChoose(recommendation.tab)} className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-violet-700 hover:text-violet-900">Review the right workspace <ArrowRight className="h-4 w-4" /></button></div>)}</div>
}

function EmptyState({ icon: Icon, title, body, action, onAction }: { icon: typeof BrainCircuit; title: string; body: string; action?: string; onAction?: () => void }) {
  return <div className="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-6 text-center"><div className="rounded-2xl bg-violet-100 p-4 text-violet-700"><Icon className="h-7 w-7" /></div><h3 className="mt-4 font-semibold text-gray-900">{title}</h3><p className="mt-2 max-w-md text-sm leading-6 text-gray-500">{body}</p>{action && onAction && <Button className="mt-5" onClick={onAction}><ExternalLink className="h-4 w-4" />{action}</Button>}</div>
}

function AgentSheets({ sheet, onClose, onUpdate, onRefresh, setError, setNotice }: { sheet: SheetState; onClose: () => void; onUpdate: (agent: StudioAgent, changes: Pick<StudioAgent, 'name' | 'description' | 'status'>) => Promise<void>; onRefresh: () => void; setError: (value: string | null) => void; setNotice: (value: string | null) => void }) {
  if (!sheet) return null
  if (sheet.type === 'create-voice') return <VoiceCreateSheet onClose={onClose} onRefresh={onRefresh} setError={setError} setNotice={setNotice} />
  if (sheet.type === 'voice') return <VoiceDetailSheet agent={sheet.agent} onClose={onClose} />
  return <StudioAgentSheet agent={sheet.agent} onClose={onClose} onUpdate={onUpdate} setError={setError} />
}

function StudioAgentSheet({ agent, onClose, onUpdate, setError }: { agent: StudioAgent; onClose: () => void; onUpdate: (agent: StudioAgent, changes: Pick<StudioAgent, 'name' | 'description' | 'status'>) => Promise<void>; setError: (value: string | null) => void }) {
  const [name, setName] = useState(agent.name)
  const [description, setDescription] = useState(agent.description)
  const [status, setStatus] = useState<AgentStatus>(agent.status === 'unknown' ? 'inactive' : agent.status)
  const [testInput, setTestInput] = useState('')
  const [executionId, setExecutionId] = useState<string | undefined>()
  const [testOutput, setTestOutput] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)

  async function save(event: FormEvent) {
    event.preventDefault()
    if (status === 'unknown') return
    setSaving(true)
    await onUpdate(agent, { name, description, status })
    setSaving(false)
  }

  async function testAgent(event: FormEvent) {
    event.preventDefault()
    if (!testInput.trim()) return
    setTesting(true)
    setError(null)
    try {
      const result = await fetch('/api/agent-studio', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'execute-agent', input: { agentId: agent.id, message: testInput, executionId } }) }).then(parseResponse) as Record<string, unknown>
      const nextExecutionId = typeof result.executionId === 'string' ? result.executionId : undefined
      if (nextExecutionId) setExecutionId(nextExecutionId)
      setTestOutput(typeof result.output === 'string' ? result.output : JSON.stringify(result, null, 2))
    } catch (testError) {
      setError(testError instanceof Error ? testError.message : 'Could not execute this agent.')
    } finally {
      setTesting(false)
    }
  }

  return <Sheet open title={agent.name} onClose={onClose} width="w-full max-w-xl"><div className="space-y-7 p-5"><section className="rounded-2xl bg-violet-50 p-4"><div className="flex items-center gap-3"><div className="rounded-xl bg-violet-600 p-2.5 text-white"><BrainCircuit className="h-5 w-5" /></div><div><p className="font-semibold text-violet-950">Agent Studio workflow</p><p className="text-sm text-violet-800">Manage metadata, inspect versions, and run a controlled execution.</p></div></div></section><form onSubmit={save} className="space-y-4"><Field label="Agent name"><Input value={name} onChange={(event) => setName(event.target.value)} required /></Field><Field label="Description"><textarea value={description} onChange={(event) => setDescription(event.target.value)} required rows={4} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-200" /></Field><Field label="Production status"><select value={status} onChange={(event) => setStatus(event.target.value as AgentStatus)} className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200"><option value="active">Active</option><option value="inactive">Inactive</option><option value="archived">Archived</option></select></Field><Button type="submit" loading={saving} className="w-full"><SlidersHorizontal className="h-4 w-4" />Save metadata</Button></form><section className="border-t border-gray-100 pt-6"><div className="mb-3 flex items-center gap-2"><Play className="h-4 w-4 text-emerald-600" /><h3 className="font-semibold text-gray-900">Controlled test</h3></div><p className="mb-3 text-sm text-gray-500">Execution uses the published HighLevel agent and retains the returned session ID only in this browser tab.</p><form onSubmit={testAgent} className="space-y-3"><textarea value={testInput} onChange={(event) => setTestInput(event.target.value)} placeholder="Enter a safe test input" rows={3} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-200" /><Button type="submit" variant="accent" loading={testing} disabled={agent.status !== 'active'}><Send className="h-4 w-4" />Run test</Button></form>{agent.status !== 'active' && <p className="mt-2 text-xs text-amber-700">Only active agents can be executed by HighLevel.</p>}{testOutput && <pre className="mt-4 max-h-72 overflow-auto rounded-xl bg-gray-950 p-3 text-xs leading-5 text-emerald-200">{testOutput}</pre>}</section><section className="border-t border-gray-100 pt-6"><h3 className="mb-3 font-semibold text-gray-900">Versions</h3>{agent.versions.length ? <div className="space-y-2">{agent.versions.map((version) => <div key={version.id} className="rounded-xl bg-gray-50 p-3"><div className="flex items-center justify-between gap-2"><p className="text-sm font-medium text-gray-800">{version.name}</p><Badge variant="gray">{version.status}</Badge></div>{version.updatedAt && <p className="mt-1 text-xs text-gray-400">Updated {formatDate(version.updatedAt)}</p>}</div>)}</div> : <p className="text-sm text-gray-500">The API did not return version detail for this agent.</p>}</section></div></Sheet>
}

function VoiceCreateSheet({ onClose, onRefresh, setError, setNotice }: { onClose: () => void; onRefresh: () => void; setError: (value: string | null) => void; setNotice: (value: string | null) => void }) {
  const [form, setForm] = useState({ agentName: '', businessName: '', welcomeMessage: '', agentPrompt: '', language: 'en-US', maxCallDuration: 300 })
  const [saving, setSaving] = useState(false)
  async function submit(event: FormEvent) {
    event.preventDefault()
    setSaving(true); setError(null)
    try {
      await fetch('/api/agent-studio', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'create-voice', input: form }) }).then(parseResponse)
      setNotice('Voice AI agent created in HighLevel.')
      onClose(); onRefresh()
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Could not create the Voice AI agent.')
    } finally { setSaving(false) }
  }
  return <Sheet open title="Create Voice AI agent" onClose={onClose} width="w-full max-w-xl"><form onSubmit={submit} className="space-y-5 p-5"><section className="rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-950"><div className="flex gap-3"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" /><p>This submits a real Voice AI configuration to HighLevel. A missing <code>voice-ai-agents.write</code> scope will be reported without changing local state.</p></div></section><Field label="Agent name"><Input value={form.agentName} maxLength={40} required onChange={(event) => setForm({ ...form, agentName: event.target.value })} /></Field><Field label="Business name"><Input value={form.businessName} required onChange={(event) => setForm({ ...form, businessName: event.target.value })} /></Field><Field label="Welcome message"><textarea value={form.welcomeMessage} maxLength={190} required rows={3} onChange={(event) => setForm({ ...form, welcomeMessage: event.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200" /></Field><Field label="Agent instructions"><textarea value={form.agentPrompt} required rows={6} onChange={(event) => setForm({ ...form, agentPrompt: event.target.value })} placeholder="Define business-safe behavior, escalation rules, and the desired tone." className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200" /></Field><div className="grid grid-cols-2 gap-3"><Field label="Language"><select value={form.language} onChange={(event) => setForm({ ...form, language: event.target.value })} className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"><option value="en-US">English (US)</option><option value="multi">Multi-language</option><option value="es">Spanish</option><option value="fr">French</option><option value="de">German</option><option value="it">Italian</option><option value="nl-NL">Dutch</option><option value="pt-BR">Portuguese (BR)</option></select></Field><Field label="Max call duration"><select value={form.maxCallDuration} onChange={(event) => setForm({ ...form, maxCallDuration: Number(event.target.value) })} className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"><option value={180}>3 minutes</option><option value={300}>5 minutes</option><option value={600}>10 minutes</option><option value={900}>15 minutes</option></select></Field></div><Button type="submit" variant="accent" loading={saving} className="w-full"><Mic2 className="h-4 w-4" />Create Voice AI agent</Button></form></Sheet>
}

function VoiceDetailSheet({ agent, onClose }: { agent: VoiceAgent; onClose: () => void }) {
  return <Sheet open title={agent.name} onClose={onClose} width="w-full max-w-xl"><div className="space-y-6 p-5"><section className="rounded-2xl bg-emerald-50 p-5"><div className="flex items-center gap-3"><div className="rounded-xl bg-emerald-600 p-2.5 text-white"><Mic2 className="h-5 w-5" /></div><div><h3 className="font-semibold text-emerald-950">Voice AI agent</h3><p className="text-sm text-emerald-800">Live configuration from HighLevel.</p></div></div></section><dl className="space-y-3">{[{ label: 'Business', value: agent.businessName }, { label: 'Language', value: agent.language }, { label: 'Inbound number', value: agent.inboundNumber }, { label: 'Backup availability', value: agent.isBackupDisabled ? 'Disabled' : 'Available' }].map((item) => <div key={item.label} className="rounded-xl border border-gray-100 p-3"><dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">{item.label}</dt><dd className="mt-1 text-sm font-medium text-gray-800">{item.value ?? 'Not configured'}</dd></div>)}</dl>{agent.welcomeMessage && <section><p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Welcome message</p><p className="mt-2 rounded-xl bg-gray-50 p-3 text-sm leading-6 text-gray-700">{agent.welcomeMessage}</p></section>}<a href="https://app.gohighlevel.com/voice-ai" target="_blank" rel="noopener noreferrer" className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-800 hover:bg-emerald-100"><ExternalLink className="h-4 w-4" />Open Voice AI in HighLevel</a></div></Sheet>
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-1.5 block text-sm font-medium text-gray-700">{label}</span>{children}</label>
}
