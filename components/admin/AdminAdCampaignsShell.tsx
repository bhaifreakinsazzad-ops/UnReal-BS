'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, ArrowUpRight, Loader2, Megaphone } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

interface AdminCampaign {
  id: string
  businessName: string | null
  email: string | null
  name: string
  objective: string
  platforms: string[]
  dailyBudgetBdt: number
  durationDays: number
  totalBudgetBdt: number
  status: string
  fulfilmentMode: string
  audienceLocation: string
  audienceAgeMin: number
  audienceAgeMax: number
  audienceGender: string
  audienceInterests: string | null
  headline: string
  primaryText: string
  callToAction: string
  destinationUrl: string | null
  whatsappNumber: string | null
  serviceFeeBdt: number
  reportedReach: number | null
  reportedClicks: number | null
  reportedSpendBdt: number | null
  createdAt: string
  submittedAt: string | null
}

// Which statuses an operator may move a campaign to, mirroring the transition
// graph the database enforces in unreal_bs_ad_campaign_set_status. Shown as
// buttons so an invalid move is not even offered.
const NEXT: Record<string, string[]> = {
  submitted: ['in_review', 'rejected', 'cancelled'],
  in_review: ['live', 'scheduled', 'rejected'],
  scheduled: ['live', 'paused'],
  live: ['paused', 'completed'],
  paused: ['live', 'completed'],
}

function bdt(v: number) {
  return `৳${v.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
}

export function AdminAdCampaignsShell() {
  const [campaigns, setCampaigns] = useState<AdminCampaign[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [results, setResults] = useState<Record<string, { reach: string; clicks: string; spend: string; fee: string }>>({})

  function load() {
    fetch('/api/admin/ad-campaigns')
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('failed'))))
      .then((json: { campaigns: AdminCampaign[] }) => {
        const list = json.campaigns ?? []
        setCampaigns(list)
        setResults(
          Object.fromEntries(
            list.map((c) => [
              c.id,
              {
                reach: c.reportedReach != null ? String(c.reportedReach) : '',
                clicks: c.reportedClicks != null ? String(c.reportedClicks) : '',
                spend: c.reportedSpendBdt != null ? String(c.reportedSpendBdt) : '',
                fee: String(c.serviceFeeBdt || ''),
              },
            ])
          )
        )
      })
      .catch(() => setError('Could not load campaigns.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  async function patch(id: string, payload: Record<string, unknown>) {
    setBusy(id)
    setError(null)
    try {
      const res = await fetch('/api/admin/ad-campaigns', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId: id, ...payload }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json?.message ?? 'Could not update this campaign.')
      setLoading(true)
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update this campaign.')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="mx-auto max-w-[1100px] space-y-5 p-4 md:p-6">
      <div className="rounded-2xl bg-[#07101F] p-5 text-white md:p-7">
        <Badge variant="accent" dot>Admin</Badge>
        <h1 className="mt-4 text-2xl font-black md:text-4xl">Ad Campaigns</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-white/65">
          Campaigns customers have submitted. Set each one up in Meta Ads Manager, then move
          it through the statuses here — the customer sees exactly this state. Enter real
          results once you have them; blank stays blank rather than showing the customer a
          zero.
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-600">
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <Card padding="none" className="overflow-hidden border-gray-200">
        <CardHeader className="border-b border-gray-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-[#7C3AED]" />
            <CardTitle>Campaign queue</CardTitle>
          </div>
          <Badge variant="gray">{campaigns.length}</Badge>
        </CardHeader>

        <div className="p-5">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading...
            </div>
          ) : campaigns.length === 0 ? (
            <p className="text-sm text-gray-500">No submitted campaigns.</p>
          ) : (
            <div className="space-y-4">
              {campaigns.map((c) => {
                const r = results[c.id] ?? { reach: '', clicks: '', spend: '', fee: '' }
                return (
                  <div key={c.id} className="rounded-xl border border-gray-200 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-900">{c.name}</p>
                        <p className="text-xs text-gray-500">
                          {c.businessName ?? c.email} · {c.objective} · {c.platforms.join(', ')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-bold text-gray-600">
                          {c.status}
                        </span>
                        {c.fulfilmentMode === 'managed' && (
                          <span className="rounded-full bg-blue-50 px-2 py-1 text-[10px] font-bold text-blue-700">
                            manual
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-1 gap-3 rounded-lg bg-gray-50 p-3 text-xs sm:grid-cols-2">
                      <div>
                        <p className="font-bold text-gray-700">Budget</p>
                        <p className="text-gray-600">
                          {bdt(c.dailyBudgetBdt)}/day × {c.durationDays} days = {bdt(c.totalBudgetBdt)}
                        </p>
                      </div>
                      <div>
                        <p className="font-bold text-gray-700">Audience</p>
                        <p className="text-gray-600">
                          {c.audienceLocation} · {c.audienceAgeMin}–{c.audienceAgeMax} · {c.audienceGender}
                          {c.audienceInterests ? ` · ${c.audienceInterests}` : ''}
                        </p>
                      </div>
                      <div className="sm:col-span-2">
                        <p className="font-bold text-gray-700">Creative</p>
                        <p className="text-gray-900">{c.headline}</p>
                        <p className="mt-0.5 whitespace-pre-wrap text-gray-600">{c.primaryText}</p>
                        <p className="mt-1 text-gray-500">
                          CTA {c.callToAction}
                          {c.whatsappNumber ? ` · WhatsApp ${c.whatsappNumber}` : ''}
                          {c.destinationUrl ? ` · ${c.destinationUrl}` : ''}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-end gap-2">
                      <div className="w-24">
                        <Input label="Reach" type="number" value={r.reach}
                          onChange={(e) => setResults((s) => ({ ...s, [c.id]: { ...r, reach: e.target.value } }))} />
                      </div>
                      <div className="w-24">
                        <Input label="Clicks" type="number" value={r.clicks}
                          onChange={(e) => setResults((s) => ({ ...s, [c.id]: { ...r, clicks: e.target.value } }))} />
                      </div>
                      <div className="w-28">
                        <Input label="Spent ৳" type="number" value={r.spend}
                          onChange={(e) => setResults((s) => ({ ...s, [c.id]: { ...r, spend: e.target.value } }))} />
                      </div>
                      <div className="w-28">
                        <Input label="Our fee ৳" type="number" value={r.fee}
                          onChange={(e) => setResults((s) => ({ ...s, [c.id]: { ...r, fee: e.target.value } }))} />
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={busy !== null}
                        onClick={() =>
                          patch(c.id, {
                            reportedReach: r.reach === '' ? null : Number(r.reach),
                            reportedClicks: r.clicks === '' ? null : Number(r.clicks),
                            reportedSpendBdt: r.spend === '' ? null : Number(r.spend),
                            serviceFeeBdt: r.fee === '' ? 0 : Number(r.fee),
                          })
                        }
                      >
                        Save results
                      </Button>
                    </div>

                    <div className="mt-3 flex flex-wrap items-end gap-2">
                      <div className="min-w-[220px] flex-1">
                        <Input
                          label="Note to customer (required to reject)"
                          value={notes[c.id] ?? ''}
                          onChange={(e) => setNotes((n) => ({ ...n, [c.id]: e.target.value }))}
                        />
                      </div>
                      {(NEXT[c.status] ?? []).map((next) => (
                        <Button
                          key={next}
                          size="sm"
                          variant={next === 'rejected' ? 'outline' : undefined}
                          loading={busy === c.id}
                          disabled={busy !== null || (next === 'rejected' && !(notes[c.id] ?? '').trim())}
                          onClick={() => patch(c.id, { status: next, note: notes[c.id]?.trim() || undefined })}
                        >
                          {next.replace('_', ' ')}
                        </Button>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </Card>

      <a
        href="https://adsmanager.facebook.com/adsmanager/manage/campaigns"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#7C3AED] hover:underline"
      >
        Open Meta Ads Manager
        <ArrowUpRight className="h-3.5 w-3.5" />
      </a>
    </div>
  )
}
