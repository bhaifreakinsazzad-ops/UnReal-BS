'use client'

import { useEffect, useState } from 'react'
import { Check, Clock, Loader2, Sparkles } from 'lucide-react'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useLocale } from '@/lib/i18n/context'

interface Bundle {
  code: string
  nameEn: string
  nameBn: string
  taglineEn: string | null
  taglineBn: string | null
  priceBdt: number
  creditBdt: number
  bonusBdt: number
}

const METHODS = [
  { value: 'bkash', labelBn: 'বিকাশ', labelEn: 'bKash' },
  { value: 'nagad', labelBn: 'নগদ', labelEn: 'Nagad' },
  { value: 'rocket', labelBn: 'রকেট', labelEn: 'Rocket' },
  { value: 'upay', labelBn: 'উপায়', labelEn: 'Upay' },
  { value: 'bank', labelBn: 'ব্যাংক ট্রান্সফার', labelEn: 'Bank Transfer' },
  { value: 'cash', labelBn: 'নগদ টাকা', labelEn: 'Cash' },
]

function bdt(v: number) {
  return `৳${v.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
}

// Roughly what one business question + answer costs on the cheapest model,
// at the current rate card. Used to translate wallet credit into something a
// shop owner can picture. Kept deliberately conservative.
const CHEAP_CHAT_COST_BDT = 0.0592

export function BundlePicker({ onOrdered }: { onOrdered?: () => void }) {
  const locale = useLocale()
  const isBn = locale === 'bn'
  const [bundles, setBundles] = useState<Bundle[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<string | null>(null)
  const [method, setMethod] = useState('bkash')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ordered, setOrdered] = useState<{ price: number; credit: number } | null>(null)

  useEffect(() => {
    fetch('/api/bundles')
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('failed'))))
      .then((json: { bundles: Bundle[] }) => setBundles(json.bundles ?? []))
      .catch(() => setError(isBn ? 'প্যাকেজ লোড করা যায়নি।' : 'Could not load packages.'))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function order(code: string) {
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/bundles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, method }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json?.message ?? (isBn ? 'অর্ডার করা যায়নি।' : 'Could not place this order.'))

      setOrdered({ price: json.request.priceBdt, credit: json.request.creditBdt })
      onOrdered?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : isBn ? 'অর্ডার করা যায়নি।' : 'Could not place this order.')
    } finally {
      setSubmitting(false)
    }
  }

  if (ordered) {
    return (
      <Card className="border-green-200 bg-green-50/40">
        <div className="flex items-start gap-3">
          <Clock className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" />
          <div>
            <p className="text-sm font-bold text-gray-900">
              {isBn ? 'অর্ডার জমা হয়েছে' : 'Order submitted'}
            </p>
            <p className="mt-1 text-sm leading-6 text-gray-600">
              {isBn
                ? `${bdt(ordered.price)} পাঠান — আমাদের টিম নিশ্চিত করে আপনার ওয়ালেটে ${bdt(ordered.credit)} যোগ করবে।`
                : `Send ${bdt(ordered.price)} — once our team confirms it, ${bdt(ordered.credit)} will be added to your wallet.`}
            </p>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card padding="none" className="overflow-hidden border-gray-200">
      <CardHeader className="border-b border-gray-100 px-5 py-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-[#7C3AED]" />
          <CardTitle>{isBn ? 'AI প্যাকেজ' : 'AI Packages'}</CardTitle>
        </div>
      </CardHeader>

      <div className="p-5">
        <p className="mb-4 text-sm leading-6 text-gray-600">
          {isBn
            ? 'একবার টাকা দিন, ব্যবহার অনুযায়ী খরচ হবে। যা ব্যবহার করবেন শুধু তারই খরচ — বাকি টাকা আপনার ওয়ালেটে থেকে যাবে।'
            : 'Pay once, then spend as you use. You are charged only for what you actually use — the rest stays in your wallet.'}
        </p>

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            {isBn ? 'লোড হচ্ছে...' : 'Loading...'}
          </div>
        ) : bundles.length === 0 ? (
          <p className="text-sm text-gray-500">
            {isBn ? 'এখন কোনো প্যাকেজ নেই।' : 'No packages available right now.'}
          </p>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {bundles.map((b, i) => {
                const isSel = selected === b.code
                const best = i === bundles.length - 1
                const chats = Math.round(b.creditBdt / CHEAP_CHAT_COST_BDT)
                return (
                  <button
                    key={b.code}
                    onClick={() => setSelected(b.code)}
                    className={`relative rounded-2xl border p-4 text-left transition ${
                      isSel
                        ? 'border-[#7C3AED] bg-[#F5F3FF] shadow-[0_10px_30px_rgba(124,58,237,0.12)]'
                        : 'border-gray-200 bg-white hover:border-[#7C3AED]/40'
                    }`}
                  >
                    {best && (
                      <span className="absolute -top-2 right-3 rounded-full bg-[#00C875] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                        {isBn ? 'সেরা মূল্য' : 'Best value'}
                      </span>
                    )}
                    <p className="text-sm font-black text-gray-900">{isBn ? b.nameBn : b.nameEn}</p>
                    <p className="mt-0.5 text-[11px] leading-snug text-gray-500">
                      {isBn ? b.taglineBn : b.taglineEn}
                    </p>

                    <p className="mt-3 text-2xl font-black text-gray-950">{bdt(b.priceBdt)}</p>

                    <p className="mt-1 text-sm font-bold text-[#059669]">
                      {isBn ? `ওয়ালেটে ${bdt(b.creditBdt)}` : `${bdt(b.creditBdt)} in your wallet`}
                    </p>
                    {b.bonusBdt > 0 && (
                      <p className="text-[11px] font-semibold text-[#7C3AED]">
                        +{bdt(b.bonusBdt)} {isBn ? 'বোনাস' : 'bonus'}
                      </p>
                    )}

                    <p className="mt-2.5 text-[11px] leading-relaxed text-gray-500">
                      {isBn
                        ? `প্রায় ${chats.toLocaleString('en-US')}টি প্রশ্ন করা যাবে`
                        : `About ${chats.toLocaleString('en-US')} questions`}
                    </p>
                  </button>
                )
              })}
            </div>

            {error && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
                {error}
              </div>
            )}

            {selected && (
              <div className="mt-4 space-y-3 rounded-xl border border-gray-200 bg-gray-50 p-4">
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-gray-600">
                    {isBn ? 'কীভাবে টাকা পাঠাবেন' : 'How will you pay'}
                  </label>
                  <select
                    value={method}
                    onChange={(e) => setMethod(e.target.value)}
                    className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:border-[#7C3AED] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20"
                  >
                    {METHODS.map((m) => (
                      <option key={m.value} value={m.value}>{isBn ? m.labelBn : m.labelEn}</option>
                    ))}
                  </select>
                </div>

                <p className="text-[11px] leading-relaxed text-gray-500">
                  {isBn
                    ? 'অর্ডার করার পর টাকা পাঠান। আমাদের টিম নিশ্চিত করলেই ওয়ালেটে যোগ হবে।'
                    : 'Place the order, then send the money. It is added to your wallet once our team confirms it.'}
                </p>

                <Button onClick={() => order(selected)} loading={submitting} disabled={submitting}>
                  {isBn ? 'এই প্যাকেজ নিন' : 'Get this package'}
                </Button>
              </div>
            )}

            <div className="mt-5 space-y-1.5 border-t border-gray-100 pt-4">
              {(isBn
                ? ['যা ব্যবহার করবেন শুধু তারই খরচ', 'ব্যালেন্সের মেয়াদ শেষ হয় না', 'প্রতিটি খরচের হিসাব দেখতে পাবেন']
                : ['Charged only for what you use', 'Your balance never expires', 'Every charge is itemised']
              ).map((f) => (
                <div key={f} className="flex items-center gap-2 text-[11px] text-gray-500">
                  <Check className="h-3.5 w-3.5 flex-shrink-0 text-[#00C875]" />
                  <span>{f}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </Card>
  )
}
