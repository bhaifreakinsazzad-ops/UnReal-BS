'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, CreditCard, Loader2 } from 'lucide-react'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input, Textarea } from '@/components/ui/input'
import { requestPasswordReverification } from '@/lib/security/reverify-client'

interface PendingOrder {
  id: string
  userId: string
  businessName: string | null
  email: string | null
  requestedNote: string | null
  marketedPriceUsd: number | null
  createdAt: string
}

// Minimal, unlisted admin page — the only place in the app that ever
// touches a plaintext card credential, and only for the single moment it
// takes to encrypt and store it. Not linked in nav.
export function AdminVirtualCardsShell() {
  const [orders, setOrders] = useState<PendingOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [assigningId, setAssigningId] = useState<string | null>(null)

  function refetch() {
    setLoading(true)
    fetch('/api/admin/virtual-cards/pending-orders')
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('failed'))))
      .then((json: { orders: PendingOrder[] }) => setOrders(json.orders ?? []))
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetch('/api/admin/virtual-cards/pending-orders')
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('failed'))))
      .then((json: { orders: PendingOrder[] }) => setOrders(json.orders ?? []))
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="mx-auto max-w-[900px] space-y-5 p-4 md:p-6">
      <div className="rounded-2xl bg-[#07101F] p-5 text-white md:p-7">
        <h1 className="text-2xl font-black md:text-3xl">Virtual Card Assignment</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-white/65">
          Assign a real card to a pending order. Debits the customer&apos;s wallet, encrypts the credential
          before storage — nothing here is ever logged or shown again.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading pending orders...
        </div>
      ) : error ? (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          Could not load pending orders.
        </div>
      ) : orders.length === 0 ? (
        <p className="text-sm text-gray-500">No pending orders.</p>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <AssignOrderCard
              key={order.id}
              order={order}
              busy={assigningId === order.id}
              onAssigning={(id) => setAssigningId(id)}
              onAssigned={() => {
                setAssigningId(null)
                refetch()
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function AssignOrderCard({
  order,
  busy,
  onAssigning,
  onAssigned,
}: {
  order: PendingOrder
  busy: boolean
  onAssigning: (id: string | null) => void
  onAssigned: () => void
}) {
  const [label, setLabel] = useState('')
  const [cardBrand, setCardBrand] = useState('')
  const [last4, setLast4] = useState('')
  const [expiryMonth, setExpiryMonth] = useState('')
  const [expiryYear, setExpiryYear] = useState('')
  const [credential, setCredential] = useState('')
  const [chargedAmountBdt, setChargedAmountBdt] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function submit() {
    setError(null)
    if (!label || !/^\d{4}$/.test(last4) || !credential || !chargedAmountBdt) {
      setError('Label, last 4 digits, credential, and charged amount are required.')
      return
    }

    onAssigning(order.id)
    try {
      const idempotencyKey = crypto.randomUUID().replace(/-/g, '')
      const assign = () => fetch('/api/admin/virtual-cards/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Idempotency-Key': idempotencyKey },
        body: JSON.stringify({
          orderId: order.id,
          label,
          cardBrand: cardBrand || undefined,
          last4,
          expiryMonth: expiryMonth ? Number(expiryMonth) : undefined,
          expiryYear: expiryYear ? Number(expiryYear) : undefined,
          credential,
          chargedAmountBdt: Number(chargedAmountBdt),
        }),
      })
      let res = await assign()
      if (res.status === 428) {
        const password = await requestPasswordReverification('Re-enter your password to authorize this card assignment.')
        if (!password) throw new Error('Password verification was cancelled.')
        const verified = await fetch('/api/auth/reverify', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }),
        })
        if (!verified.ok) throw new Error('Password verification failed.')
        res = await assign()
      }
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(json?.message ?? 'Assignment failed.')
      }
      onAssigned()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Assignment failed.')
      onAssigning(null)
    }
  }

  return (
    <Card className="border-gray-200">
      <CardHeader className="mb-3">
        <div className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-[#7C3AED]" />
          <CardTitle>{order.businessName ?? order.email ?? order.userId}</CardTitle>
        </div>
      </CardHeader>
      {order.requestedNote && <p className="text-sm text-gray-600">Note: {order.requestedNote}</p>}
      {order.marketedPriceUsd && (
        <p className="text-sm text-gray-600">Marketed price: ${order.marketedPriceUsd.toFixed(2)}</p>
      )}

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Input label="Label" placeholder="Card #14 - Payoneer Visa" value={label} onChange={(e) => setLabel(e.target.value)} />
        <Input label="Brand (optional)" placeholder="Visa" value={cardBrand} onChange={(e) => setCardBrand(e.target.value)} />
        <Input label="Last 4 digits" placeholder="1234" maxLength={4} value={last4} onChange={(e) => setLast4(e.target.value)} />
        <Input label="Charged amount (৳)" type="number" min={1} value={chargedAmountBdt} onChange={(e) => setChargedAmountBdt(e.target.value)} />
        <Input label="Expiry month (optional)" type="number" min={1} max={12} value={expiryMonth} onChange={(e) => setExpiryMonth(e.target.value)} />
        <Input label="Expiry year (optional)" type="number" min={2024} max={2099} value={expiryYear} onChange={(e) => setExpiryYear(e.target.value)} />
      </div>

      <div className="mt-3">
        <Textarea
          label="Full card credential (number / expiry / CVV) — entered once, encrypted immediately"
          placeholder="4242 4242 4242 4242, exp 12/28, CVV 123"
          rows={2}
          value={credential}
          onChange={(e) => setCredential(e.target.value)}
        />
      </div>

      {error && (
        <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
          {error}
        </div>
      )}

      <div className="mt-4">
        <Button onClick={submit} loading={busy} disabled={busy}>
          Assign Card &amp; Debit Wallet
        </Button>
      </div>
    </Card>
  )
}
