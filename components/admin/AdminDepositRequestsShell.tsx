'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, Banknote, Check, Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface DepositRequest {
  id: string
  userId: string
  businessName: string | null
  email: string | null
  requestedAmountBdt: number
  method: string | null
  note: string | null
  createdAt: string
}

function formatBDT(v: number) {
  return `৳${v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
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

// Admin queue for approving wallet deposits. Before this existed there was no
// way to credit a wallet from inside the product at all — every top-up was
// hand-written SQL against Supabase.
export function AdminDepositRequestsShell() {
  const [requests, setRequests] = useState<DepositRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [amounts, setAmounts] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState<string | null>(null)
  const [done, setDone] = useState<Record<string, string>>({})

  // Same load-in-effect shape as AdminVirtualCardsShell — promise chain rather
  // than an async body, so setState happens in a callback and not synchronously
  // inside the effect.
  useEffect(() => {
    fetch('/api/admin/deposit-requests')
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('failed'))))
      .then((json: { requests: DepositRequest[] }) => {
        const list = json.requests ?? []
        setRequests(list)
        setAmounts(Object.fromEntries(list.map((r) => [r.id, String(r.requestedAmountBdt)])))
      })
      .catch(() => setError('Could not load pending deposit requests.'))
      .finally(() => setLoading(false))
  }, [])

  async function approve(r: DepositRequest) {
    const raw = amounts[r.id]
    const amount = Number(raw)
    if (!amount || amount <= 0) {
      setError(`Enter a valid amount for ${r.businessName ?? r.email ?? r.id}.`)
      return
    }

    setSubmitting(r.id)
    setError(null)
    try {
      const res = await fetch('/api/admin/deposit-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId: r.id, fulfilledAmountBdt: amount, method: r.method ?? undefined }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json?.message ?? 'Could not approve this deposit request.')

      setDone((d) => ({ ...d, [r.id]: formatBDT(amount) }))
      setRequests((prev) => prev.filter((x) => x.id !== r.id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not approve this deposit request.')
    } finally {
      setSubmitting(null)
    }
  }

  return (
    <div className="mx-auto max-w-[1100px] space-y-5 p-4 md:p-6">
      <div className="rounded-2xl bg-[#07101F] p-5 text-white md:p-7">
        <Badge variant="accent" dot>Admin</Badge>
        <h1 className="mt-4 text-2xl font-black md:text-4xl">Deposit Approvals</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-white/65">
          Approve a deposit only after you have confirmed the money actually arrived
          (bKash / Nagad / Rocket / Upay / bank / cash). Approving credits the
          customer&apos;s wallet immediately and writes a ledger entry.
        </p>
      </div>

      {Object.keys(done).length > 0 && (
        <div className="flex items-start gap-2 rounded-xl border border-green-200 bg-green-50 px-3 py-2.5 text-sm text-green-800">
          <Check className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <span>Credited: {Object.values(done).join(', ')}</span>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-600">
          <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <Card padding="none" className="overflow-hidden border-gray-200">
        <CardHeader className="border-b border-gray-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <Banknote className="h-5 w-5 text-[#7C3AED]" />
            <CardTitle>Pending Deposits</CardTitle>
          </div>
          <Badge variant="gray">{requests.length}</Badge>
        </CardHeader>

        <div className="p-5">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading...
            </div>
          ) : requests.length === 0 ? (
            <p className="text-sm text-gray-500">No pending deposit requests.</p>
          ) : (
            <div className="space-y-3">
              {requests.map((r) => (
                <div key={r.id} className="rounded-xl border border-gray-200 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-gray-900">
                        {r.businessName ?? r.email ?? r.userId}
                      </p>
                      <p className="text-xs text-gray-500">
                        Requested {formatBDT(r.requestedAmountBdt)}
                        {r.method ? ` · ${r.method}` : ''} · {formatDateTime(r.createdAt)}
                      </p>
                      {r.note && <p className="mt-1 text-xs text-gray-500">Note: {r.note}</p>}
                    </div>
                    <div className="flex items-end gap-2">
                      <div className="w-36">
                        <Input
                          label="Amount received (৳)"
                          type="number"
                          min={1}
                          value={amounts[r.id] ?? ''}
                          onChange={(e) => setAmounts((a) => ({ ...a, [r.id]: e.target.value }))}
                        />
                      </div>
                      <Button
                        onClick={() => approve(r)}
                        loading={submitting === r.id}
                        disabled={submitting !== null}
                      >
                        Approve &amp; Credit
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
