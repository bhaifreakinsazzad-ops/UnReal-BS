'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, Building2, Clock, Loader2, ShieldCheck, Sparkles } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/input'
import { useLocale } from '@/lib/i18n/context'

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

function formatDateTime(iso: string, isBn: boolean) {
  return new Date(iso).toLocaleString(isBn ? 'bn-BD' : 'en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function SettingsShell() {
  const locale = useLocale()
  const isBn = locale === 'bn'

  return (
    <div className="mx-auto max-w-[1100px] space-y-5 p-4 md:p-6">
      <div className="rounded-2xl bg-[#07101F] p-5 text-white md:p-7">
        <Badge variant="accent" dot>{isBn ? 'সেটিংস' : 'Settings'}</Badge>
        <h1 className="mt-4 text-2xl font-black md:text-4xl">{isBn ? 'সেটিংস' : 'Settings'}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-white/65">
          {isBn ? 'অ্যাকাউন্টের অবস্থা, সিস্টেম স্বাস্থ্য এবং অ্যাকাউন্ট-স্তরের অনুরোধ।' : 'Account status, system health, and account-level requests.'}
        </p>
      </div>

      <UpgradeRequestCard isBn={isBn} />
      {/* Account upgrade request section above (Part 3); error monitoring below (Part 2). */}
      <AIUsageSummaryCard isBn={isBn} />
      <ErrorLogsCard isBn={isBn} />
    </div>
  )
}

function UpgradeRequestCard({ isBn }: { isBn: boolean }) {
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
        if (!cancelled) setError(isBn ? 'আপনার অনুরোধের অবস্থা লোড করা যায়নি।' : 'Could not load your request status.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        throw new Error(json?.message ?? (isBn ? 'অনুরোধ জমা দেওয়া যায়নি।' : 'Could not submit request.'))
      }
      setRequest(json.request)
      setNote('')
    } catch (err) {
      setError(err instanceof Error ? err.message : isBn ? 'অনুরোধ জমা দেওয়া যায়নি।' : 'Could not submit request.')
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
          <CardTitle>{isBn ? 'ডেডিকেটেড GHL সাব-অ্যাকাউন্ট' : 'Dedicated GHL Sub-Account'}</CardTitle>
        </div>
      </CardHeader>
      <p className="text-sm leading-6 text-gray-600">
        {isBn
          ? 'আপনি বর্তমানে শেয়ার্ড UnReal BS অ্যাকাউন্টে আছেন। সম্পূর্ণ ডেটা আইসোলেশন ও কাস্টম ব্র্যান্ডিংয়ের জন্য নিজের ডেডিকেটেড সাব-অ্যাকাউন্টের অনুরোধ করুন — অনুমোদিত হলে আমাদের টিম যোগাযোগ করবে।'
          : "You're currently on the shared UnReal BS account. Request your own dedicated sub-account for full data isolation and custom branding — our team will reach out once approved."}
      </p>

      <div className="mt-4">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            {isBn ? 'অনুরোধের অবস্থা লোড হচ্ছে...' : 'Loading request status...'}
          </div>
        ) : isPending && request ? (
          <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-800">
            <Clock className="h-4 w-4 flex-shrink-0" />
            <span>
              {isBn
                ? `${formatDateTime(request.created_at, isBn)} থেকে অনুরোধ অপেক্ষমাণ — আমাদের টিম ফলো-আপ করবে।`
                : `Request pending since ${formatDateTime(request.created_at, isBn)} — our team will follow up.`}
            </span>
          </div>
        ) : (
          <div className="space-y-3">
            <Textarea
              label={isBn ? 'নোট (ঐচ্ছিক)' : 'Note (optional)'}
              placeholder={isBn ? 'আপনার সেটআপ সম্পর্কে টিমের জানা দরকার এমন কিছু...' : 'Anything the team should know about your setup...'}
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
              {isBn ? 'ডেডিকেটেড অ্যাকাউন্টের অনুরোধ করুন' : 'Request Dedicated Account'}
            </Button>
          </div>
        )}
      </div>
    </Card>
  )
}

function AIUsageSummaryCard({ isBn }: { isBn: boolean }) {
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
          <CardTitle>{isBn ? 'AI সাবস্ক্রিপশন ব্যবহার' : 'AI Subscriptions Usage'}</CardTitle>
        </div>
        <Badge variant="gray">{isBn ? 'গত ৩০ দিন' : 'Last 30 days'}</Badge>
      </CardHeader>

      <div className="p-5">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            {isBn ? 'লোড হচ্ছে...' : 'Loading...'}
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            {isBn ? 'ব্যবহারের সারাংশ লোড করা যায়নি।' : 'Could not load usage summary.'}
          </div>
        ) : byModel.length === 0 ? (
          <p className="text-sm text-gray-500">{isBn ? 'গত ৩০ দিনে কোনো AI ব্যবহার নেই।' : 'No AI usage in the last 30 days.'}</p>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-4 rounded-xl bg-gray-50 px-4 py-3 text-sm">
              <span className="text-gray-500">
                {isBn ? 'মোট খরচ' : 'Total spend'}: <span className="font-semibold text-gray-900">৳{totalCostBdt.toFixed(2)}</span>
              </span>
              <span className="text-gray-500">
                {isBn ? 'মোট কল' : 'Total calls'}: <span className="font-semibold text-gray-900">{totalCalls}</span>
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] text-left text-sm">
                <thead className="text-xs uppercase tracking-wide text-gray-400">
                  <tr>
                    <th className="py-2 pr-4">{isBn ? 'প্রোভাইডার' : 'Provider'}</th>
                    <th className="py-2 pr-4">{isBn ? 'মডেল' : 'Model'}</th>
                    <th className="py-2 pr-4">{isBn ? 'কল' : 'Calls'}</th>
                    <th className="py-2 pr-4">{isBn ? 'টোকেন (ইন/আউট)' : 'Tokens (in/out)'}</th>
                    <th className="py-2 pr-4">{isBn ? 'খরচ' : 'Cost'}</th>
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

function ErrorLogsCard({ isBn }: { isBn: boolean }) {
  const [logs, setLogs] = useState<ErrorLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  // The endpoint is admin-only and answers 404 to everyone else. Hide the whole
  // card in that case rather than showing a non-admin a broken panel.
  const [forbidden, setForbidden] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch('/api/settings/error-logs')
      .then((res) => {
        if (res.status === 404) {
          if (!cancelled) setForbidden(true)
          return null
        }
        return res.ok ? res.json() : Promise.reject(new Error('failed'))
      })
      .then((json: { logs: ErrorLog[] } | null) => {
        if (!cancelled && json) setLogs(json.logs ?? [])
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

  if (forbidden) return null

  return (
    <Card padding="none" className="overflow-hidden border-gray-200">
      <CardHeader className="border-b border-gray-100 px-5 py-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-[#7C3AED]" />
          <CardTitle>{isBn ? 'সাম্প্রতিক ত্রুটি' : 'Recent Errors'}</CardTitle>
        </div>
        <Badge variant="gray">{isBn ? 'সর্বশেষ ২০টি' : 'Last 20'}</Badge>
      </CardHeader>

      <div className="p-5">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            {isBn ? 'লোড হচ্ছে...' : 'Loading...'}
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            {isBn ? 'ত্রুটির লগ লোড করা যায়নি।' : 'Could not load error logs.'}
          </div>
        ) : logs.length === 0 ? (
          <p className="text-sm text-gray-500">{isBn ? 'কোনো ত্রুটি লগ হয়নি — ভালো লক্ষণ।' : 'No errors logged — good sign.'}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-gray-400">
                <tr>
                  <th className="py-2 pr-4">{isBn ? 'উৎস' : 'Source'}</th>
                  <th className="py-2 pr-4">{isBn ? 'বার্তা' : 'Message'}</th>
                  <th className="py-2 pr-4">{isBn ? 'সময়' : 'Time'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td className="py-2.5 pr-4 font-mono text-xs text-gray-500">{log.source}</td>
                    <td className="py-2.5 pr-4 text-gray-800">{log.message}</td>
                    <td className="py-2.5 pr-4 whitespace-nowrap text-gray-500">{formatDateTime(log.created_at, isBn)}</td>
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
