'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, Clock, Copy, Loader2, Smartphone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useStoreLocale } from './StorefrontChrome'
import { trackMetaEvent } from '@/lib/meta/client-events'

interface Order {
  accessToken: string
  productTitle: string
  productKind: string
  buyerName: string
  buyerPhone: string
  priceBdt: number
  status: string
  paymentMethod: string | null
  payerReference: string | null
  purchaseEventId?: string | null
}

interface Target {
  method: string
  number: string
  label: string
}

function bdt(v: number) {
  return `৳${Math.round(v).toLocaleString('en-US')}`
}

export function CheckoutView({ accessToken }: { accessToken: string }) {
  const locale = useStoreLocale()
  const isBn = locale === 'bn'

  const [order, setOrder] = useState<Order | null>(null)
  const [targets, setTargets] = useState<Target[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)

  const [form, setForm] = useState({ method: '', payerReference: '', payerMsisdn: '' })

  function load() {
    return fetch(`/api/checkout/${accessToken}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('failed'))))
      .then((json: { order: Order; payment: { targets: Target[] } }) => {
        setOrder(json.order)
        setTargets(json.payment?.targets ?? [])
        setForm((f) => ({
          ...f,
          method: f.method || json.payment?.targets?.[0]?.method || 'bkash',
          payerMsisdn: f.payerMsisdn || json.order.buyerPhone,
        }))
      })
  }

  useEffect(() => {
    load()
      .catch(() => setError(isBn ? 'অর্ডার পাওয়া যায়নি।' : 'Could not find this order.'))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken])

  useEffect(() => {
    if (order?.status !== 'paid' || !order.purchaseEventId) return
    const key = `unreal_bs_purchase_pixel_${order.purchaseEventId}`
    const send = () => {
      if (localStorage.getItem(key)) return
      if (trackMetaEvent('Purchase', { value: order.priceBdt, currency: 'BDT' }, order.purchaseEventId ?? undefined)) {
        localStorage.setItem(key, '1')
      }
    }
    send()
    window.addEventListener('unreal-meta-ready', send)
    window.addEventListener('unreal-consent-change', send)
    return () => {
      window.removeEventListener('unreal-meta-ready', send)
      window.removeEventListener('unreal-consent-change', send)
    }
  }, [order])

  useEffect(() => {
    if (order?.status !== 'verification_submitted') return
    const timer = window.setInterval(() => void load().catch(() => undefined), 15_000)
    return () => window.clearInterval(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order?.status])

  async function submit() {
    if (!form.payerReference.trim()) {
      setError(isBn ? 'TrxID লিখুন।' : 'Enter the Transaction ID.')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch(`/api/checkout/${accessToken}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method: form.method || 'bkash',
          payerReference: form.payerReference.trim(),
          payerMsisdn: form.payerMsisdn.trim() || undefined,
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json?.message ?? 'Could not save that.')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save that.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 text-sm text-gray-500 py-16">
        <Loader2 className="w-4 h-4 animate-spin" />
        {isBn ? 'লোড হচ্ছে…' : 'Loading…'}
      </div>
    )
  }

  if (!order) {
    return (
      <Card className="text-center py-12">
        <p className="text-sm text-gray-600">
          {error ?? (isBn ? 'অর্ডার পাওয়া যায়নি।' : 'Order not found.')}
        </p>
      </Card>
    )
  }

  if (order.status === 'paid') {
    return (
      <Card className="text-center py-10">
        <CheckCircle2 className="w-10 h-10 text-[#00A85F] mx-auto mb-3" />
        <p className="text-base font-semibold text-gray-900">
          {isBn ? 'পেমেন্ট নিশ্চিত হয়েছে' : 'Payment confirmed'}
        </p>
        <p className="text-sm text-gray-600 mt-1 mb-5">
          {isBn ? 'এখনই দেখা শুরু করতে পারেন।' : 'You can open it now.'}
        </p>
        <a href={`/learn/${accessToken}`}>
          <Button size="lg">{isBn ? 'খুলুন' : 'Open it'}</Button>
        </a>
      </Card>
    )
  }

  if (order.status === 'rejected' || order.status === 'refunded') {
    return (
      <Card className="text-center py-10">
        <p className="text-base font-semibold text-gray-900">
          {order.status === 'refunded'
            ? isBn
              ? 'টাকা ফেরত দেওয়া হয়েছে'
              : 'This order was refunded'
            : isBn
              ? 'পেমেন্ট মেলেনি'
              : 'Payment could not be matched'}
        </p>
        <p className="text-sm text-gray-600 mt-2">
          {isBn
            ? 'সমস্যা মনে হলে বিক্রেতার সাথে যোগাযোগ করুন।'
            : 'If you think this is wrong, contact the seller.'}
        </p>
      </Card>
    )
  }

  const awaiting = order.status === 'verification_submitted'

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">
          {isBn ? 'পেমেন্ট করুন' : 'Complete your payment'}
        </h1>
        <p className="text-sm text-gray-600 mt-1">{order.productTitle}</p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {awaiting ? (
        <Card className="bg-[#FFFBEB] border-[#FDE68A]">
          <div className="flex gap-3">
            <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-gray-900">
                {isBn ? 'পেমেন্ট যাচাই করা হচ্ছে' : 'We are checking your payment'}
              </p>
              <p className="text-sm text-gray-700 mt-1">
                {isBn
                  ? 'আপনার TrxID পাওয়া গেছে। মিলে গেলেই আপনি অ্যাক্সেস পাবেন — সাধারণত কয়েক ঘণ্টার মধ্যে। এই পেজটি সেভ করে রাখুন।'
                  : 'We have your Transaction ID. Access opens as soon as it is matched — usually within a few hours. Save this page.'}
              </p>
              {order.payerReference && (
                <p className="text-xs text-gray-500 mt-2">
                  TrxID: <code className="font-mono">{order.payerReference}</code>
                </p>
              )}
            </div>
          </div>
        </Card>
      ) : (
        <>
          <Card>
            <p className="text-sm font-semibold text-gray-900 mb-1">
              {isBn ? 'ধাপ ১ — টাকা পাঠান' : 'Step 1 — Send the money'}
            </p>
            <p className="text-sm text-gray-600 mb-4">
              {isBn
                ? `নিচের যেকোনো নম্বরে ${bdt(order.priceBdt)} "Send Money" করুন।`
                : `Send ${bdt(order.priceBdt)} to any of these numbers using "Send Money".`}
            </p>

            {targets.length === 0 ? (
              <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-3 text-sm text-amber-800">
                {isBn
                  ? 'পেমেন্ট নম্বর এখনো সেট করা হয়নি। বিক্রেতার সাথে যোগাযোগ করুন।'
                  : 'No payment number is configured yet. Please contact the seller.'}
              </div>
            ) : (
              <div className="space-y-2">
                {targets.map((t) => (
                  <div
                    key={t.method}
                    className="flex items-center gap-3 rounded-lg border border-gray-200 px-3 py-3"
                  >
                    <Smartphone className="w-4 h-4 text-gray-400 shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs text-gray-500">{t.label}</p>
                      <p className="text-base font-semibold text-gray-900 font-mono">{t.number}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(t.number)
                        setCopied(t.method)
                        setTimeout(() => setCopied(null), 2000)
                      }}
                    >
                      {copied === t.method ? (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      {copied === t.method ? (isBn ? 'কপি' : 'Copied') : isBn ? 'কপি' : 'Copy'}
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4 rounded-lg bg-gray-50 border border-gray-200 px-3 py-2.5">
              <p className="text-xs text-gray-600">
                {isBn ? 'পরিমাণ' : 'Amount'}:{' '}
                <strong className="text-gray-900">{bdt(order.priceBdt)}</strong>
              </p>
            </div>
          </Card>

          <Card>
            <p className="text-sm font-semibold text-gray-900 mb-1">
              {isBn ? 'ধাপ ২ — TrxID দিন' : 'Step 2 — Enter your Transaction ID'}
            </p>
            <p className="text-sm text-gray-600 mb-4">
              {isBn
                ? 'পেমেন্টের পর যে SMS আসবে তাতে TrxID থাকে। সেটি এখানে লিখুন।'
                : 'The SMS you get after paying contains a Transaction ID. Enter it here.'}
            </p>

            <div className="space-y-3">
              <div className="w-full">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {isBn ? 'কোনটি দিয়ে পাঠিয়েছেন' : 'Which one did you use'}
                </label>
                <select
                  value={form.method}
                  onChange={(e) => setForm((f) => ({ ...f, method: e.target.value }))}
                  className="w-full h-10 rounded-lg border border-gray-300 bg-white text-sm px-3"
                >
                  {(targets.length > 0
                    ? targets
                    : [
                        { method: 'bkash', label: 'bKash', number: '' },
                        { method: 'nagad', label: 'Nagad', number: '' },
                        { method: 'rocket', label: 'Rocket', number: '' },
                      ]
                  ).map((t) => (
                    <option key={t.method} value={t.method}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <Input
                label="TrxID"
                value={form.payerReference}
                onChange={(e) => setForm((f) => ({ ...f, payerReference: e.target.value }))}
                placeholder="8N7A1B2C3D"
                required
              />

              <Input
                label={isBn ? 'যে নম্বর থেকে পাঠিয়েছেন' : 'Number you sent from'}
                value={form.payerMsisdn}
                onChange={(e) => setForm((f) => ({ ...f, payerMsisdn: e.target.value }))}
                inputMode="tel"
              />
            </div>

            <Button className="w-full mt-4" size="lg" onClick={submit} loading={submitting}>
              {isBn ? 'জমা দিন' : 'Submit'}
            </Button>
          </Card>
        </>
      )}

      <p className="text-xs text-gray-400 text-center">
        {isBn
          ? 'এই পেজের লিংকটি রেখে দিন — এটিই আপনার অর্ডার।'
          : 'Keep this page — the link is your order.'}
      </p>
    </div>
  )
}
