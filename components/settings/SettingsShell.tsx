'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, Building2, Clock, Loader2, ShieldCheck, Sparkles } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/input'

interface ErrorLog {
  id: string
  source: string
  message: string
  created_at: string
}

interface UpgradeRequest {
  id: string
  note: string | null
  status: string
  created_at: string
}

interface AIUsageByModel {
  provider: string
  modelId: string
  calls: number
  costBdt: number
  inputTokens: number
  outputTokens: number
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function SettingsShell() {
  return (
    <div className="mx-auto max-w-[1100px] space-y-5 p-4 md:p-6">
      <div className="rounded-2xl bg-[#07101F] p-5 text-white md:p-7">
        <Badge variant="accent" dot>Settings</Badge>
        <h1 className="mt-4 text-2xl font-black md:text-4xl">Settings</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-white/65">
          Account status, system health, and account-level requests.
        </p>
      </div>

      <UpgradeRequestCard />
      {/* Account upgrade request section above (Part 3); error monitoring below (Part 2). */}
      <AIUsageSummaryCard />
      <ErrorLogsCard />
    </div>
  )
}

function UpgradeRequestCard() {
  const [request, setRequest] = useState<UpgradeRequest | null>(null)
  const [loading, setLoading] = useState(true)
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch('/api/settings/upgrade-request')
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('failed'))))
      .then((json: { request: UpgradeRequest | null }) => {
        if (!cancelled) setRequest(json.request)
      })
      .catch(() => {
        if (!cancelled) setError('Could not load your request status.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  async function submit() {
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/settings/upgrade-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(json?.message ?? 'Could not submit request.')
      }
      setRequest(json.request)
      setNote('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not submit request.')
    } finally {
      setSubmitting(false)
    }
  }

  const isPending = request?.status === 'pending'

  return (
    <Card className="border-gray-200">
      <CardHeader className="mb-3">
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-[#7C3AED]" />
          <CardTitle>Dedicated GHL Sub-Account</CardTitle>
        </div>
      </CardHeader>
      <p className="text-sm leading-6 text-gray-600">
        You&apos;re currently on the shared UnReal BS account. Request your own dedicated sub-account
        for full data isolation and custom branding — our team will reach out once approved.
      </p>

      <div className="mt-4">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading request status...
          </div>
        ) : isPending && request ? (
          <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-800">
            <Clock className="h-4 w-4 flex-shrink-0" />
            <span>Request pending since {formatDateTime(request.created_at)} — our team will follow up.</span>
          </div>
        ) : (
          <div className="space-y-3">
            <Textarea
              label="Note (optional)"
              placeholder="Anything the team should know about your setup..."
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
                {error}
              </div>
            )}
            <Button onClick={submit} loading={submitting} disabled={submitting}>
              Request Dedicated Account
            </Button>
          </div>
        )}
      </div>
    </Card>
  )
}

function AIUsageSummaryCard() {
  const [byModel, setByModel] = useState<AIUsageByModel[]>([])
  const [totalCostBdt, setTotalCostBdt] = useState(0)
  const [totalCalls, setTotalCalls] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch('/api/settings/ai-usage-summary')
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('failed'))))
      .then((json: { byModel: AIUsageByModel[]; totalCostBdt: number; totalCalls: number }) => {
        if (!cancelled) {
          setByModel(json.byModel ?? [])
          setTotalCostBdt(json.totalCostBdt ?? 0)
          setTotalCalls(json.totalCalls ?? 0)
        }
      })
      .catch(() => {
        if (!cancelled) setError(true)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <Card padding="none" className="overflow-hidden border-gray-200">
      <CardHeader className="border-b border-gray-100 px-5 py-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-[#7C3AED]" />
          <CardTitle>AI Subscriptions Usage</CardTitle>
        </div>
        <Badge variant="gray">Last 30 days</Badge>
      </CardHeader>

      <div className="p-5">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading...
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            Could not load usage summary.
          </div>
        ) : byModel.length === 0 ? (
          <p className="text-sm text-gray-500">No AI usage in the last 30 days.</p>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-4 rounded-xl bg-gray-50 px-4 py-3 text-sm">
              <span className="text-gray-500">
                Total spend: <span className="font-semibold text-gray-900">৳{totalCostBdt.toFixed(2)}</span>
              </span>
              <span className="text-gray-500">
                Total calls: <span className="font-semibold text-gray-900">{totalCalls}</span>
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] text-left text-sm">
                <thead className="text-xs uppercase tracking-wide text-gray-400">
                  <tr>
                    <th className="py-2 pr-4">Provider</th>
                    <th className="py-2 pr-4">Model</th>
                    <th className="py-2 pr-4">Calls</th>
                    <th className="py-2 pr-4">Tokens (in/out)</th>
                    <th className="py-2 pr-4">Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {byModel.map((m) => (
                    <tr key={`${m.provider}:${m.modelId}`}>
                      <td className="py-2.5 pr-4 text-gray-800">{m.provider}</td>
                      <td className="py-2.5 pr-4 font-mono text-xs text-gray-500">{m.modelId}</td>
                      <td className="py-2.5 pr-4 text-gray-800">{m.calls}</td>
                      <td className="py-2.5 pr-4 text-gray-500">
                        {m.inputTokens.toLocaleString()} / {m.outputTokens.toLocaleString()}
                      </td>
                      <td className="py-2.5 pr-4 whitespace-nowrap text-gray-800">৳{m.costBdt.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}

function ErrorLogsCard() {
  const [logs, setLogs] = useState<ErrorLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch('/api/settings/error-logs')
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('failed'))))
      .then((json: { logs: ErrorLog[] }) => {
        if (!cancelled) setLogs(json.logs ?? [])
      })
      .catch(() => {
        if (!cancelled) setError(true)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <Card padding="none" className="overflow-hidden border-gray-200">
      <CardHeader className="border-b border-gray-100 px-5 py-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-[#7C3AED]" />
          <CardTitle>Recent Errors</CardTitle>
        </div>
        <Badge variant="gray">Last 20</Badge>
      </CardHeader>

      <div className="p-5">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading...
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            Could not load error logs.
          </div>
        ) : logs.length === 0 ? (
          <p className="text-sm text-gray-500">No errors logged — good sign.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-gray-400">
                <tr>
                  <th className="py-2 pr-4">Source</th>
                  <th className="py-2 pr-4">Message</th>
                  <th className="py-2 pr-4">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td className="py-2.5 pr-4 font-mono text-xs text-gray-500">{log.source}</td>
                    <td className="py-2.5 pr-4 text-gray-800">{log.message}</td>
                    <td className="py-2.5 pr-4 whitespace-nowrap text-gray-500">{formatDateTime(log.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Card>
  )
}
