'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, Loader2, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

interface Payout {
  id: string
  sellerName: string | null
  sellerEmail: string | null
  amountBdt: number
  method: string
  accountNumber: string
  accountName: string | null
  status: string
  adminNote: string | null
  operatorReference: string | null
  paidAt: string | null
  createdAt: string
}

const STATUS: Record<string, { label: string; tone: string }> = {
  pending: { label: 'To send', tone: 'bg-amber-50 text-amber-700' },
  paid: { label: 'Sent', tone: 'bg-green-50 text-green-700' },
  rejected: { label: 'Returned to wallet', tone: 'bg-gray-100 text-gray-600' },
}

function bdt(v: number) {
  return `৳${Math.round(v).toLocaleString('en-US')}`
}

export function AdminPayoutsShell() {
  const [payouts, setPayouts] = useState<Payout[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [refs, setRefs] = useState<Record<string, string>>({})

  function load() {
    return fetch('/api/admin/payouts')
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('failed'))))
      .then((json: { payouts: Payout[] }) => setPayouts(json.payouts ?? []))
  }

  useEffect(() => {
    load()
      .catch(() => setError('Could not load payout requests.'))
      .finally(() => setLoading(false))
  }, [])

  async function settle(payoutId: string, status: 'paid' | 'rejected') {
    if (
      status === 'rejected' &&
      !window.confirm('Reject this request and put the money back in the seller’s wallet?')
    ) {
      return
    }
    setBusy(payoutId)
    setError(null)
    setNotice(null)
    try {
      const res = await fetch('/api/admin/payouts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payoutId, status, reference: refs[payoutId]?.trim() || undefined }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json?.message ?? 'Could not update this payout.')
      setNotice(status === 'paid' ? 'Marked as sent.' : 'Returned to the seller’s wallet.')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update this payout.')
    } finally {
      setBusy(null)
    }
  }

  const pending = payouts.filter((p) => p.status === 'pending')
  const rest = payouts.filter((p) => p.status !== 'pending')

  function renderPayout(p: Payout) {
    const s = STATUS[p.status] ?? STATUS.pending
    return (
      <Card key={p.id} className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-gray-900">
              {p.sellerName ?? p.sellerEmail ?? '—'}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              {p.method} · <code className="font-mono">{p.accountNumber}</code>
              {p.accountName ? ` · ${p.accountName}` : ''}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-base font-bold text-gray-900">{bdt(p.amountBdt)}</p>
            <span className={`inline-block mt-1 text-xs font-semibold px-2 py-0.5 rounded-full ${s.tone}`}>
              {s.label}
            </span>
          </div>
        </div>

        {p.operatorReference && (
          <p className="text-xs text-gray-500">Reference: {p.operatorReference}</p>
        )}

        {p.status === 'pending' && (
          <div className="space-y-2">
            <Input
              placeholder="Your transfer reference (optional)"
              value={refs[p.id] ?? ''}
              onChange={(e) => setRefs((r) => ({ ...r, [p.id]: e.target.value }))}
            />
            <div className="flex flex-wrap gap-2">
              <Button
                variant="accent"
                size="sm"
                loading={busy === p.id}
                onClick={() => settle(p.id, 'paid')}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                I have sent it
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={busy === p.id}
                onClick={() => settle(p.id, 'rejected')}
              >
                <XCircle className="w-3.5 h-3.5" />
                Reject and return
              </Button>
            </div>
          </div>
        )}
      </Card>
    )
  }

  return (
    <div className="mx-auto max-w-[900px] space-y-5 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Seller Payouts</h1>
        <p className="text-sm text-gray-500 mt-1 max-w-2xl">
          The amount was already taken out of the seller&apos;s wallet when they requested it, so
          &ldquo;I have sent it&rdquo; only records that you made the transfer. Rejecting is what
          gives the money back.
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {notice && (
        <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800">
          {notice}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-12 text-sm text-gray-500">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading…
        </div>
      ) : (
        <>
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-gray-700">To send ({pending.length})</h2>
            {pending.length === 0 ? (
              <Card className="text-center py-8">
                <p className="text-sm text-gray-500">No payouts waiting.</p>
              </Card>
            ) : (
              pending.map(renderPayout)
            )}
          </section>

          {rest.length > 0 && (
            <section className="space-y-3 pt-2">
              <h2 className="text-sm font-semibold text-gray-700">History ({rest.length})</h2>
              {rest.map(renderPayout)}
            </section>
          )}
        </>
      )}
    </div>
  )
}
