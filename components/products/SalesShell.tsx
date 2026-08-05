'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Banknote, CheckCircle2, Clock, Loader2, ShoppingBag, Wallet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useLocale } from '@/lib/i18n/context'
import { MIN_PAYOUT_BDT } from '@/lib/commerce/pricing'
import { bdt } from './ProductsShell'

interface Order {
  id: string
  productTitle: string
  productKind: string
  buyerName: string
  buyerPhone: string
  priceBdt: number
  commissionBdt: number
  sellerPayoutBdt: number
  status: string
  paymentMethod: string | null
  payerReference: string | null
  ghlSynced: boolean
  paidAt: string | null
  createdAt: string
}

interface Payout {
  id: string
  amountBdt: number
  method: string
  accountNumber: string
  status: string
  adminNote: string | null
  paidAt: string | null
  createdAt: string
}

interface Summary {
  paidOrders: number
  awaitingConfirmation: number
  lifetimeEarnedBdt: number
  lifetimeCommissionBdt: number
}

const ORDER_STATUS: Record<string, { en: string; bn: string; tone: string }> = {
  pending_payment: { en: 'Not paid yet', bn: 'পেমেন্ট হয়নি', tone: 'bg-gray-100 text-gray-500' },
  awaiting_confirmation: {
    en: 'Checking payment',
    bn: 'পেমেন্ট যাচাই হচ্ছে',
    tone: 'bg-amber-50 text-amber-700',
  },
  paid: { en: 'Paid', bn: 'পেমেন্ট হয়েছে', tone: 'bg-green-50 text-green-700' },
  rejected: { en: 'Rejected', bn: 'বাতিল', tone: 'bg-red-50 text-red-700' },
  refunded: { en: 'Refunded', bn: 'ফেরত', tone: 'bg-gray-100 text-gray-600' },
}

const PAYOUT_STATUS: Record<string, { en: string; bn: string; tone: string }> = {
  pending: { en: 'Processing', bn: 'প্রক্রিয়াধীন', tone: 'bg-amber-50 text-amber-700' },
  paid: { en: 'Sent', bn: 'পাঠানো হয়েছে', tone: 'bg-green-50 text-green-700' },
  rejected: { en: 'Returned to wallet', bn: 'ওয়ালেটে ফেরত', tone: 'bg-gray-100 text-gray-600' },
}

export function SalesShell() {
  const locale = useLocale()
  const isBn = locale === 'bn'

  const [orders, setOrders] = useState<Order[]>([])
  const [payouts, setPayouts] = useState<Payout[]>([])
  const [summary, setSummary] = useState<Summary | null>(null)
  const [balance, setBalance] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [requesting, setRequesting] = useState(false)
  const [showPayout, setShowPayout] = useState(false)

  const [payoutForm, setPayoutForm] = useState({
    amountBdt: '',
    method: 'bkash',
    accountNumber: '',
    accountName: '',
  })

  function load() {
    return fetch('/api/sales')
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('failed'))))
      .then(
        (json: {
          orders: Order[]
          payouts: Payout[]
          summary: Summary
          balanceBdt: number
        }) => {
          setOrders(json.orders ?? [])
          setPayouts(json.payouts ?? [])
          setSummary(json.summary ?? null)
          setBalance(json.balanceBdt ?? 0)
        }
      )
  }

  useEffect(() => {
    load()
      .catch(() => setError(isBn ? 'তথ্য লোড করা যায়নি।' : 'Could not load your sales.'))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function requestPayout() {
    setRequesting(true)
    setError(null)
    setNotice(null)
    try {
      const res = await fetch('/api/payouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amountBdt: Number(payoutForm.amountBdt) || 0,
          method: payoutForm.method,
          accountNumber: payoutForm.accountNumber.trim(),
          accountName: payoutForm.accountName.trim() || undefined,
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json?.message ?? 'Could not request a payout.')
      setNotice(
        isBn
          ? 'অনুরোধ পাঠানো হয়েছে। টাকা ওয়ালেট থেকে সরিয়ে রাখা হয়েছে, শীঘ্রই পাঠানো হবে।'
          : 'Request sent. The amount is held out of your wallet and will be transferred shortly.'
      )
      setShowPayout(false)
      setPayoutForm({ amountBdt: '', method: 'bkash', accountNumber: '', accountName: '' })
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not request a payout.')
    } finally {
      setRequesting(false)
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      <Link
        href="/products"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        {isBn ? 'প্রোডাক্ট' : 'Products'}
      </Link>

      <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6">
        {isBn ? 'বিক্রি ও আয়' : 'Sales & Earnings'}
      </h1>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {notice && (
        <div className="mb-4 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800">
          {notice}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <Card padding="sm">
          <div className="flex items-center gap-2 text-gray-500 mb-1">
            <Wallet className="w-4 h-4" />
            <span className="text-xs font-medium">{isBn ? 'ব্যালেন্স' : 'Balance'}</span>
          </div>
          <p className="text-lg font-bold text-gray-900">{bdt(balance)}</p>
        </Card>
        <Card padding="sm">
          <div className="flex items-center gap-2 text-gray-500 mb-1">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-xs font-medium">{isBn ? 'মোট আয়' : 'Total earned'}</span>
          </div>
          <p className="text-lg font-bold text-[#00A85F]">
            {bdt(summary?.lifetimeEarnedBdt ?? 0)}
          </p>
        </Card>
        <Card padding="sm">
          <div className="flex items-center gap-2 text-gray-500 mb-1">
            <ShoppingBag className="w-4 h-4" />
            <span className="text-xs font-medium">{isBn ? 'বিক্রি' : 'Sales'}</span>
          </div>
          <p className="text-lg font-bold text-gray-900">{summary?.paidOrders ?? 0}</p>
        </Card>
        <Card padding="sm">
          <div className="flex items-center gap-2 text-gray-500 mb-1">
            <Clock className="w-4 h-4" />
            <span className="text-xs font-medium">{isBn ? 'যাচাই হচ্ছে' : 'Checking'}</span>
          </div>
          <p className="text-lg font-bold text-amber-600">{summary?.awaitingConfirmation ?? 0}</p>
        </Card>
      </div>

      <Card className="mb-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-gray-900">
              {isBn ? 'টাকা তুলুন' : 'Withdraw your money'}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              {isBn
                ? `সর্বনিম্ন ৳${MIN_PAYOUT_BDT}। বিকাশ, নগদ, রকেট বা ব্যাংকে পাঠানো হবে।`
                : `Minimum ৳${MIN_PAYOUT_BDT}. Sent to bKash, Nagad, Rocket or a bank account.`}
            </p>
          </div>
          <Button variant="outline" onClick={() => setShowPayout((v) => !v)}>
            <Banknote className="w-4 h-4" />
            {isBn ? 'অনুরোধ করুন' : 'Request payout'}
          </Button>
        </div>

        {showPayout && (
          <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label={isBn ? 'পরিমাণ (৳)' : 'Amount (৳)'}
                type="number"
                min={MIN_PAYOUT_BDT}
                value={payoutForm.amountBdt}
                onChange={(e) => setPayoutForm((f) => ({ ...f, amountBdt: e.target.value }))}
                hint={`${isBn ? 'আপনার ব্যালেন্স' : 'Your balance'}: ${bdt(balance)}`}
              />
              <div className="w-full">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {isBn ? 'কোথায় পাঠাব' : 'Send to'}
                </label>
                <select
                  value={payoutForm.method}
                  onChange={(e) => setPayoutForm((f) => ({ ...f, method: e.target.value }))}
                  className="w-full h-10 rounded-lg border border-gray-300 bg-white text-sm px-3"
                >
                  <option value="bkash">bKash</option>
                  <option value="nagad">Nagad</option>
                  <option value="rocket">Rocket</option>
                  <option value="bank">{isBn ? 'ব্যাংক' : 'Bank'}</option>
                </select>
              </div>
              <Input
                label={isBn ? 'নম্বর / অ্যাকাউন্ট' : 'Number / account'}
                value={payoutForm.accountNumber}
                onChange={(e) => setPayoutForm((f) => ({ ...f, accountNumber: e.target.value }))}
                placeholder="01XXXXXXXXX"
                required
              />
              <Input
                label={isBn ? 'নাম (ঐচ্ছিক)' : 'Account name (optional)'}
                value={payoutForm.accountName}
                onChange={(e) => setPayoutForm((f) => ({ ...f, accountName: e.target.value }))}
              />
            </div>
            <Button onClick={requestPayout} loading={requesting}>
              {isBn ? 'পাঠান' : 'Send request'}
            </Button>
          </div>
        )}

        {payouts.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
            {payouts.map((p) => {
              const s = PAYOUT_STATUS[p.status] ?? PAYOUT_STATUS.pending
              return (
                <div key={p.id} className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-gray-700">
                    {bdt(p.amountBdt)} · {p.method} {p.accountNumber}
                  </span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${s.tone}`}>
                    {isBn ? s.bn : s.en}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      <h2 className="text-base font-semibold text-gray-900 mb-3">{isBn ? 'অর্ডার' : 'Orders'}</h2>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-gray-500 py-12 justify-center">
          <Loader2 className="w-4 h-4 animate-spin" />
          {isBn ? 'লোড হচ্ছে…' : 'Loading…'}
        </div>
      ) : orders.length === 0 ? (
        <Card className="text-center py-10">
          <ShoppingBag className="w-9 h-9 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-600">
            {isBn
              ? 'এখনো কোনো অর্ডার নেই। প্রোডাক্টের লিংক শেয়ার করা শুরু করুন।'
              : 'No orders yet. Start sharing your product link.'}
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {orders.map((o) => {
            const s = ORDER_STATUS[o.status] ?? ORDER_STATUS.pending_payment
            return (
              <Card key={o.id} padding="sm" className="flex flex-wrap items-center gap-3">
                <div className="flex-1 min-w-[180px]">
                  <p className="text-sm font-medium text-gray-900">{o.productTitle}</p>
                  <p className="text-xs text-gray-500">
                    {o.buyerName} · {o.buyerPhone}
                    {o.payerReference ? ` · TrxID ${o.payerReference}` : ''}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">
                    {o.status === 'paid' ? bdt(o.sellerPayoutBdt) : bdt(o.priceBdt)}
                  </p>
                  {o.status === 'paid' && (
                    <p className="text-[11px] text-gray-400">
                      {isBn ? 'ফি' : 'fee'} {bdt(o.commissionBdt)}
                    </p>
                  )}
                </div>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${s.tone}`}>
                  {isBn ? s.bn : s.en}
                </span>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
