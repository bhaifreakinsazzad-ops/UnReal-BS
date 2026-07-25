'use client'

import { useEffect, useState } from 'react'
import { Clock, Loader2, Wallet } from 'lucide-react'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input, Textarea } from '@/components/ui/input'

interface DepositRequest {
  id: string
  requested_amount_bdt: number
  method: string | null
  note: string | null
  status: string
  created_at: string
}

const METHODS = [
  { value: 'bkash', label: 'bKash' },
  { value: 'nagad', label: 'Nagad' },
  { value: 'rocket', label: 'Rocket' },
  { value: 'upay', label: 'Upay' },
  { value: 'bank', label: 'Bank Transfer' },
  { value: 'cash', label: 'Cash' },
  { value: 'other', label: 'Other' },
] as const

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Generalized deposit-request form — one shared wallet balance funds both
// AI subscriptions usage and virtual card purchases, so this is the single
// "top up my balance" entry point used from both surfaces.
export function DepositRequestCard() {
  const [request, setRequest] = useState<DepositRequest | null>(null)
  const [loading, setLoading] = useState(true)
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState<string>('bkash')
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch('/api/wallet/deposit-request')
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('failed'))))
      .then((json: { request: DepositRequest | null }) => {
        if (!cancelled) setRequest(json.request)
      })
      .catch(() => {
        if (!cancelled) setError('Could not load your deposit request status.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  async function submit() {
    const amountBdt = Number(amount)
    if (!amountBdt || amountBdt <= 0) {
      setError('Enter a valid amount.')
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/wallet/deposit-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amountBdt, method, note }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(json?.message ?? 'Could not submit deposit request.')
      }
      setRequest(json.request)
      setAmount('')
      setNote('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not submit deposit request.')
    } finally {
      setSubmitting(false)
    }
  }

  const isPending = request?.status === 'pending'

  return (
    <Card className="border-gray-200">
      <CardHeader className="mb-3">
        <div className="flex items-center gap-2">
          <Wallet className="h-5 w-5 text-[#7C3AED]" />
          <CardTitle>Deposit to Wallet</CardTitle>
        </div>
      </CardHeader>
      <p className="text-sm leading-6 text-gray-600">
        Send payment via bKash, Nagad, Rocket, Upay, bank transfer, or cash, then submit the amount below —
        our team will confirm and credit your wallet balance.
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
            <span>
              Deposit request pending since {formatDateTime(request.created_at)} — your team will confirm and
              credit your balance shortly.
            </span>
          </div>
        ) : (
          <div className="space-y-3">
            <Input
              label="Amount (৳)"
              type="number"
              min={1}
              placeholder="e.g. 1000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <div>
              <label className="mb-1.5 block text-xs font-bold text-gray-600">Payment method</label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED]"
              >
                {METHODS.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
            <Textarea
              label="Note (optional)"
              placeholder="Anything the team should know..."
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
              Request Deposit
            </Button>
          </div>
        )}
      </div>
    </Card>
  )
}
