'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, Clock, CreditCard, Eye, Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/input'
import { useLocale } from '@/lib/i18n/context'

interface VirtualCard {
  id: string
  label: string
  cardBrand: string | null
  last4: string
  expiryMonth: number | null
  expiryYear: number | null
  status: string
  revealed: boolean
}

interface CardOrder {
  id: string
  requested_note: string | null
  marketed_price_usd: number | null
  charged_amount_bdt: number | null
  status: string
  created_at: string
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

export function VirtualCardsShell() {
  const locale = useLocale()
  const isBn = locale === 'bn'

  return (
    <div className="mx-auto max-w-[1100px] space-y-5 p-4 md:p-6">
      <div className="rounded-2xl bg-[#07101F] p-5 text-white md:p-7">
        <Badge variant="accent" dot>{isBn ? 'ভার্চুয়াল কার্ড' : 'Virtual Cards'}</Badge>
        <h1 className="mt-4 text-2xl font-black md:text-4xl">{isBn ? 'ভার্চুয়াল কার্ড' : 'Virtual Cards'}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-white/65">
          {isBn
            ? 'যেকোনো জায়গায় অনলাইনে খরচ করার জন্য একটি প্রিপেইড ভার্চুয়াল কার্ড অর্ডার করুন, আপনার ওয়ালেট থেকে ফান্ড করা হবে।'
            : 'Order a prepaid virtual card for spending anywhere online, funded from your wallet balance.'}
        </p>
      </div>

      <MyCardsCard isBn={isBn} />
      <OrderCardCard isBn={isBn} />
    </div>
  )
}

function MyCardsCard({ isBn }: { isBn: boolean }) {
  const [cards, setCards] = useState<VirtualCard[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [revealing, setRevealing] = useState<string | null>(null)
  const [revealedValue, setRevealedValue] = useState<{ cardId: string; value: string } | null>(null)
  const [revealError, setRevealError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch('/api/virtual-cards')
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('failed'))))
      .then((json: { cards: VirtualCard[] }) => {
        if (!cancelled) setCards(json.cards ?? [])
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

  async function reveal(card: VirtualCard) {
    setRevealing(card.id)
    setRevealError(null)
    try {
      const res = await fetch(`/api/virtual-cards/${card.id}/reveal`)
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(json?.message ?? (isBn ? 'কার্ডের তথ্য দেখানো যায়নি।' : 'Could not reveal card credentials.'))
      }
      setRevealedValue({ cardId: card.id, value: json.credential })
      setCards((prev) => prev.map((c) => (c.id === card.id ? { ...c, revealed: true } : c)))
    } catch (err) {
      setRevealError(err instanceof Error ? err.message : isBn ? 'কার্ডের তথ্য দেখানো যায়নি।' : 'Could not reveal card credentials.')
    } finally {
      setRevealing(null)
    }
  }

  return (
    <Card padding="none" className="overflow-hidden border-gray-200">
      <CardHeader className="border-b border-gray-100 px-5 py-4">
        <div className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-[#7C3AED]" />
          <CardTitle>{isBn ? 'আমার কার্ড' : 'My Cards'}</CardTitle>
        </div>
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
            {isBn ? 'আপনার কার্ড লোড করা যায়নি।' : 'Could not load your cards.'}
          </div>
        ) : cards.length === 0 ? (
          <p className="text-sm text-gray-500">
            {isBn ? 'এখনো কোনো কার্ড দেওয়া হয়নি — নিচে একটি অর্ডার করুন।' : 'No cards assigned yet — order one below.'}
          </p>
        ) : (
          <div className="space-y-3">
            {cards.map((c) => (
              <div key={c.id} className="rounded-xl border border-gray-200 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-gray-900">
                      {c.cardBrand ?? (isBn ? 'কার্ড' : 'Card')} •••• {c.last4}
                    </p>
                    <p className="text-xs text-gray-500">
                      {c.label}
                      {c.expiryMonth && c.expiryYear ? ` · ${isBn ? 'মেয়াদ' : 'exp'} ${c.expiryMonth}/${c.expiryYear}` : ''}
                    </p>
                  </div>
                  {c.revealed ? (
                    <Badge variant="gray">{isBn ? 'দেখানো হয়েছে' : 'Revealed'}</Badge>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => reveal(c)}
                      loading={revealing === c.id}
                      disabled={revealing !== null}
                    >
                      <Eye className="mr-1.5 h-3.5 w-3.5" />
                      {isBn ? 'দেখুন' : 'Reveal'}
                    </Button>
                  )}
                </div>

                {revealedValue?.cardId === c.id && (
                  <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
                    <p className="font-mono text-sm text-amber-900 break-all">{revealedValue.value}</p>
                    <p className="mt-1 text-[11px] text-amber-700">
                      {isBn ? 'আপনি এটি একবারই দেখতে পারবেন — নিরাপদ জায়গায় সংরক্ষণ করুন।' : 'You can only view this once — save it somewhere safe.'}
                    </p>
                  </div>
                )}
              </div>
            ))}
            {revealError && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
                {revealError}
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  )
}

function OrderCardCard({ isBn }: { isBn: boolean }) {
  const [order, setOrder] = useState<CardOrder | null>(null)
  const [loading, setLoading] = useState(true)
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch('/api/virtual-cards/order')
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('failed'))))
      .then((json: { order: CardOrder | null }) => {
        if (!cancelled) setOrder(json.order)
      })
      .catch(() => {
        if (!cancelled) setError(isBn ? 'আপনার অর্ডারের অবস্থা লোড করা যায়নি।' : 'Could not load your order status.')
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
      const res = await fetch('/api/virtual-cards/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(json?.message ?? (isBn ? 'অর্ডার জমা দেওয়া যায়নি।' : 'Could not submit order.'))
      }
      setOrder(json.order)
      setNote('')
    } catch (err) {
      setError(err instanceof Error ? err.message : isBn ? 'অর্ডার জমা দেওয়া যায়নি।' : 'Could not submit order.')
    } finally {
      setSubmitting(false)
    }
  }

  const isPending = order?.status === 'pending'

  return (
    <Card className="border-gray-200">
      <CardHeader className="mb-3">
        <div className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-[#7C3AED]" />
          <CardTitle>{isBn ? 'ভার্চুয়াল কার্ড অর্ডার করুন' : 'Order a Virtual Card'}</CardTitle>
        </div>
      </CardHeader>
      <p className="text-sm leading-6 text-gray-600">
        {isBn
          ? 'একটি অনুরোধ জমা দিন এবং আমাদের টিম আপনাকে একটি কার্ড দেবে, আপনার ওয়ালেট থেকে চার্জ করা হবে।'
          : 'Submit a request and our team will assign you a card, charged to your wallet balance.'}
      </p>

      <div className="mt-4">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            {isBn ? 'অর্ডারের অবস্থা লোড হচ্ছে...' : 'Loading order status...'}
          </div>
        ) : isPending && order ? (
          <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-800">
            <Clock className="h-4 w-4 flex-shrink-0" />
            <span>
              {isBn
                ? `${formatDateTime(order.created_at, isBn)} থেকে অর্ডার অপেক্ষমাণ — আমাদের টিম শীঘ্রই আপনার কার্ড দেবে।`
                : `Order pending since ${formatDateTime(order.created_at, isBn)} — our team will assign your card shortly.`}
            </span>
          </div>
        ) : (
          <div className="space-y-3">
            <Textarea
              label={isBn ? 'নোট (ঐচ্ছিক)' : 'Note (optional)'}
              placeholder={isBn ? 'পছন্দের কার্ডের ধরন, খরচের পরিমাণ, টিমের জানা দরকার এমন কিছু...' : 'Preferred card type, spend amount, anything the team should know...'}
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
              {isBn ? 'কার্ডের জন্য অনুরোধ করুন' : 'Request a Card'}
            </Button>
          </div>
        )}
      </div>
    </Card>
  )
}
