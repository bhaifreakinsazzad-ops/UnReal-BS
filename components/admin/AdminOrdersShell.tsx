'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, CheckCircle2, Loader2, RotateCcw, Search, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

interface Order {
  id: string
  productTitle: string
  productKind: string
  sellerName: string | null
  sellerEmail: string | null
  buyerName: string
  buyerPhone: string
  buyerEmail: string | null
  priceBdt: number
  commissionBdt: number
  sellerPayoutBdt: number
  status: string
  paymentMethod: string | null
  payerReference: string | null
  payerMsisdn: string | null
  ghlSynced: boolean
  adminNote: string | null
  paidAt: string | null
  createdAt: string
}

const STATUS: Record<string, { label: string; tone: string }> = {
  awaiting_confirmation: { label: 'Waiting on you', tone: 'bg-amber-50 text-amber-700' },
  paid: { label: 'Paid', tone: 'bg-green-50 text-green-700' },
  rejected: { label: 'Rejected', tone: 'bg-red-50 text-red-700' },
  refunded: { label: 'Refunded', tone: 'bg-gray-100 text-gray-600' },
  pending_payment: { label: 'Not paid', tone: 'bg-gray-100 text-gray-500' },
}

function bdt(v: number) {
  return `৳${Math.round(v).toLocaleString('en-US')}`
}

export function AdminOrdersShell() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [notes, setNotes] = useState<Record<string, string>>({})

  function load() {
    return fetch('/api/admin/orders')
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('failed'))))
      .then((json: { orders: Order[] }) => setOrders(json.orders ?? []))
  }

  useEffect(() => {
    load()
      .catch(() => setError('Could not load orders.'))
      .finally(() => setLoading(false))
  }, [])

  async function act(orderId: string, action: 'confirm' | 'reject' | 'refund') {
    if (action === 'refund' && !window.confirm('Refund this order and take the money back from the seller?')) {
      return
    }
    setBusy(orderId)
    setError(null)
    setNotice(null)
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, action, note: notes[orderId]?.trim() || undefined }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json?.message ?? 'Could not update this order.')
      setNotice(
        action === 'confirm'
          ? 'Confirmed. The seller has been credited.'
          : action === 'refund'
            ? 'Refunded.'
            : 'Rejected.'
      )
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update this order.')
    } finally {
      setBusy(null)
    }
  }

  const q = query.trim().toLowerCase()
  const filtered = q
    ? orders.filter((o) =>
        [o.payerReference, o.buyerPhone, o.buyerName, o.productTitle, o.sellerEmail]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(q))
      )
    : orders

  const waiting = filtered.filter((o) => o.status === 'awaiting_confirmation')
  const rest = filtered.filter((o) => o.status !== 'awaiting_confirmation')

  function renderOrder(o: Order) {
    const s = STATUS[o.status] ?? STATUS.pending_payment
    const actionable = o.status === 'awaiting_confirmation'
    return (
      <Card key={o.id} className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900">{o.productTitle}</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {o.buyerName} · {o.buyerPhone}
              {o.buyerEmail ? ` · ${o.buyerEmail}` : ''}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              Seller: {o.sellerName ?? o.sellerEmail ?? '—'}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-base font-bold text-gray-900">{bdt(o.priceBdt)}</p>
            <p className="text-[11px] text-gray-400">
              seller {bdt(o.sellerPayoutBdt)} · fee {bdt(o.commissionBdt)}
            </p>
            <span className={`inline-block mt-1 text-xs font-semibold px-2 py-0.5 rounded-full ${s.tone}`}>
              {s.label}
            </span>
          </div>
        </div>

        {(o.payerReference || o.payerMsisdn) && (
          <div className="rounded-lg bg-gray-50 border border-gray-200 px-3 py-2 text-sm">
            <span className="text-gray-500">Claimed payment: </span>
            <strong className="text-gray-900">{o.paymentMethod ?? '—'}</strong>
            {o.payerReference && (
              <>
                {' · TrxID '}
                <code className="font-mono text-gray-900">{o.payerReference}</code>
              </>
            )}
            {o.payerMsisdn && <span className="text-gray-500"> · from {o.payerMsisdn}</span>}
          </div>
        )}

        {o.status === 'paid' && !o.ghlSynced && (
          <p className="text-xs text-amber-700 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" />
            Buyer was not added to the seller&apos;s GHL contacts — the seller has no workspace
            connected, or GHL was unreachable. The sale itself is fine.
          </p>
        )}

        {o.adminNote && <p className="text-xs text-gray-500">Note: {o.adminNote}</p>}

        {actionable && (
          <div className="space-y-2 pt-1">
            <Input
              placeholder="Note (optional) — shown to the buyer if you reject"
              value={notes[o.id] ?? ''}
              onChange={(e) => setNotes((n) => ({ ...n, [o.id]: e.target.value }))}
            />
            <div className="flex flex-wrap gap-2">
              <Button
                variant="accent"
                size="sm"
                loading={busy === o.id}
                onClick={() => act(o.id, 'confirm')}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Confirm payment
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={busy === o.id}
                onClick={() => act(o.id, 'reject')}
              >
                <XCircle className="w-3.5 h-3.5" />
                No matching payment
              </Button>
            </div>
          </div>
        )}

        {o.status === 'paid' && (
          <Button
            variant="ghost"
            size="sm"
            disabled={busy === o.id}
            onClick={() => act(o.id, 'refund')}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Refund
          </Button>
        )}
      </Card>
    )
  }

  return (
    <div className="mx-auto max-w-[900px] space-y-5 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Product Orders</h1>
        <p className="text-sm text-gray-500 mt-1 max-w-2xl">
          Match each TrxID against the bKash/Nagad statement before confirming. Confirming is what
          credits the seller — it is not reversible without a refund.
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

      <Input
        placeholder="Search TrxID, phone, buyer or product"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        leftIcon={<Search className="w-4 h-4" />}
      />

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-12 text-sm text-gray-500">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading…
        </div>
      ) : (
        <>
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-gray-700">
              Waiting on you ({waiting.length})
            </h2>
            {waiting.length === 0 ? (
              <Card className="text-center py-8">
                <p className="text-sm text-gray-500">Nothing waiting. Queue is clear.</p>
              </Card>
            ) : (
              waiting.map(renderOrder)
            )}
          </section>

          {rest.length > 0 && (
            <section className="space-y-3 pt-2">
              <h2 className="text-sm font-semibold text-gray-700">Everything else ({rest.length})</h2>
              {rest.map(renderOrder)}
            </section>
          )}
        </>
      )}
    </div>
  )
}
