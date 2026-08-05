'use client'

import { useEffect, useState } from 'react'
import { BookOpen, CheckCircle2, Clock, Download, Loader2, PlayCircle, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useStoreLocale } from './StorefrontChrome'
import { captureAttribution, createMetaEventId, trackMetaEvent } from '@/lib/meta/client-events'

export interface PublicLesson {
  id: string
  moduleTitle: string | null
  title: string
  durationMinutes: number | null
  isPreview: boolean
  /** Only present when the lesson is a free preview. */
  videoUrl: string | null
}

export interface PublicProduct {
  slug: string
  kind: string
  title: string
  subtitle: string | null
  description: string | null
  coverImageUrl: string | null
  priceBdt: number
  compareAtPriceBdt: number | null
  salesCount: number
  sellerName: string | null
  deliveryNote: string | null
  lessonCount: number
  totalMinutes: number
  fileCount: number
}

function bdt(v: number) {
  return `৳${Math.round(v).toLocaleString('en-US')}`
}

const KIND_LABEL: Record<string, { bn: string; en: string }> = {
  course: { bn: 'অনলাইন কোর্স', en: 'Online course' },
  download: { bn: 'ডিজিটাল ফাইল', en: 'Digital file' },
  service: { bn: 'সার্ভিস', en: 'Service' },
  consultation: { bn: 'পরামর্শ', en: 'Consultation' },
}

export function ProductPublicView({
  product,
  lessons,
}: {
  product: PublicProduct
  lessons: PublicLesson[]
}) {
  const locale = useStoreLocale()
  const isBn = locale === 'bn'

  const [form, setForm] = useState({ buyerName: '', buyerPhone: '', buyerEmail: '' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [playing, setPlaying] = useState<string | null>(null)

  const isFree = product.priceBdt === 0
  const previewLessons = lessons.filter((l) => l.isPreview && l.videoUrl)

  useEffect(() => {
    trackMetaEvent('ViewContent', { content_ids: [product.slug], content_name: product.title, value: product.priceBdt, currency: 'BDT' })
  }, [product.priceBdt, product.slug, product.title])

  async function buy() {
    if (!form.buyerName.trim() || !form.buyerPhone.trim()) {
      setError(isBn ? 'নাম ও মোবাইল নম্বর দিন।' : 'Enter your name and mobile number.')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const eventId = createMetaEventId()
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: product.slug,
          buyerName: form.buyerName.trim(),
          buyerPhone: form.buyerPhone.trim(),
          buyerEmail: form.buyerEmail.trim() || undefined,
          ...captureAttribution(),
          eventId,
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json?.message ?? 'Could not start your order.')
      trackMetaEvent('InitiateCheckout', { content_ids: [product.slug], value: product.priceBdt, currency: 'BDT' }, eventId)

      // A free product is already paid for by the time this returns, so the
      // buyer goes straight to what they came for.
      window.location.href =
        json.order.status === 'paid'
          ? `/learn/${json.order.accessToken}`
          : `/checkout/${json.order.accessToken}`
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start your order.')
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-5">
      {product.coverImageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={product.coverImageUrl}
          alt=""
          className="w-full rounded-xl border border-gray-200 object-cover max-h-72"
        />
      )}

      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-[#7C3AED]">
          {isBn ? KIND_LABEL[product.kind]?.bn : KIND_LABEL[product.kind]?.en}
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">{product.title}</h1>
        {product.subtitle && <p className="text-base text-gray-600 mt-2">{product.subtitle}</p>}
        {product.sellerName && (
          <p className="text-sm text-gray-500 mt-2">
            {isBn ? 'বিক্রেতা' : 'Sold by'} <strong className="text-gray-700">{product.sellerName}</strong>
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-gray-600">
        {product.lessonCount > 0 && (
          <span className="inline-flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-gray-400" />
            {product.lessonCount} {isBn ? 'টি ক্লাস' : 'lessons'}
          </span>
        )}
        {product.totalMinutes > 0 && (
          <span className="inline-flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-gray-400" />
            {Math.floor(product.totalMinutes / 60) > 0
              ? `${Math.floor(product.totalMinutes / 60)} ${isBn ? 'ঘন্টা' : 'hr'} `
              : ''}
            {product.totalMinutes % 60} {isBn ? 'মিনিট' : 'min'}
          </span>
        )}
        {product.fileCount > 0 && (
          <span className="inline-flex items-center gap-1.5">
            <Download className="w-4 h-4 text-gray-400" />
            {product.fileCount} {isBn ? 'টি ফাইল' : 'files'}
          </span>
        )}
        {product.salesCount > 0 && (
          <span className="inline-flex items-center gap-1.5 text-[#00A85F] font-medium">
            <CheckCircle2 className="w-4 h-4" />
            {product.salesCount} {isBn ? 'জন কিনেছেন' : 'sold'}
          </span>
        )}
      </div>

      {/* ── Buy box ───────────────────────────────────────────────────────── */}
      <Card className="border-[#DDD6FE] bg-[#FAF9FF]">
        <div className="flex items-baseline gap-3 mb-4">
          <span className="text-3xl font-bold text-gray-900">
            {isFree ? (isBn ? 'ফ্রি' : 'Free') : bdt(product.priceBdt)}
          </span>
          {product.compareAtPriceBdt != null && product.compareAtPriceBdt > product.priceBdt && (
            <span className="text-lg text-gray-400 line-through">
              {bdt(product.compareAtPriceBdt)}
            </span>
          )}
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <Input
            label={isBn ? 'আপনার নাম' : 'Your name'}
            value={form.buyerName}
            onChange={(e) => setForm((f) => ({ ...f, buyerName: e.target.value }))}
            required
          />
          <Input
            label={isBn ? 'মোবাইল নম্বর' : 'Mobile number'}
            value={form.buyerPhone}
            onChange={(e) => setForm((f) => ({ ...f, buyerPhone: e.target.value }))}
            placeholder="01XXXXXXXXX"
            inputMode="tel"
            required
            hint={
              isBn
                ? 'এই নম্বরেই অ্যাক্সেসের লিংক পাঠানো হবে।'
                : 'Your access link is tied to this number.'
            }
          />
          <Input
            label={isBn ? 'ইমেইল (ঐচ্ছিক)' : 'Email (optional)'}
            type="email"
            value={form.buyerEmail}
            onChange={(e) => setForm((f) => ({ ...f, buyerEmail: e.target.value }))}
          />
        </div>

        <Button className="w-full mt-4" size="lg" onClick={buy} loading={submitting}>
          {submitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : isFree ? (
            isBn ? 'ফ্রি পান' : 'Get it free'
          ) : isBn ? (
            'কিনুন'
          ) : (
            'Buy now'
          )}
        </Button>

        {!isFree && (
          <p className="text-xs text-gray-500 mt-3 text-center">
            {isBn
              ? 'পরের ধাপে বিকাশ/নগদ নম্বর ও TrxID দেওয়ার নিয়ম দেখানো হবে। অ্যাকাউন্ট খোলার দরকার নেই।'
              : 'The next step shows you the bKash/Nagad number and where to enter your TrxID. No account needed.'}
          </p>
        )}

        <p className="text-xs text-gray-400 mt-3 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5" />
          {isBn
            ? 'পেমেন্ট যাচাই না হওয়া পর্যন্ত কোনো অ্যাক্সেস দেওয়া হয় না।'
            : 'Access is only given once payment is verified.'}
        </p>
      </Card>

      {/* ── Free preview ──────────────────────────────────────────────────── */}
      {previewLessons.length > 0 && (
        <Card>
          <h2 className="text-base font-semibold text-gray-900 mb-1">
            {isBn ? 'ফ্রি দেখুন' : 'Watch free'}
          </h2>
          <p className="text-xs text-gray-500 mb-4">
            {isBn
              ? 'কেনার আগে দেখে নিন কেমন পড়ানো হয়।'
              : 'See how it is taught before you pay.'}
          </p>
          <div className="space-y-3">
            {previewLessons.map((l) => (
              <div key={l.id}>
                {playing === l.id ? (
                  <div className="aspect-video w-full rounded-lg overflow-hidden bg-black">
                    <iframe
                      src={l.videoUrl!}
                      title={l.title}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      referrerPolicy="strict-origin-when-cross-origin"
                    />
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setPlaying(l.id)}
                    className="w-full flex items-center gap-3 rounded-lg border border-gray-200 px-3 py-3 text-left hover:border-[#7C3AED]"
                  >
                    <PlayCircle className="w-5 h-5 text-[#7C3AED] shrink-0" />
                    <span className="flex-1 text-sm font-medium text-gray-900">{l.title}</span>
                    {l.durationMinutes ? (
                      <span className="text-xs text-gray-400">
                        {l.durationMinutes} {isBn ? 'মিনিট' : 'min'}
                      </span>
                    ) : null}
                  </button>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ── Description ───────────────────────────────────────────────────── */}
      {product.description && (
        <Card>
          <h2 className="text-base font-semibold text-gray-900 mb-3">
            {isBn ? 'বিস্তারিত' : 'About this'}
          </h2>
          <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
            {product.description}
          </p>
        </Card>
      )}

      {/* ── Curriculum ────────────────────────────────────────────────────── */}
      {lessons.length > 0 && (
        <Card>
          <h2 className="text-base font-semibold text-gray-900 mb-3">
            {isBn ? 'কী কী থাকছে' : 'What is inside'}
          </h2>
          <ol className="space-y-1.5">
            {lessons.map((l, i) => (
              <li key={l.id} className="flex items-center gap-3 text-sm py-1.5">
                <span className="text-xs text-gray-400 w-5 shrink-0">{i + 1}</span>
                <span className="flex-1 text-gray-800">{l.title}</span>
                {l.isPreview && (
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#D1FAE5] text-[#059669]">
                    {isBn ? 'ফ্রি' : 'Free'}
                  </span>
                )}
                {l.durationMinutes ? (
                  <span className="text-xs text-gray-400 shrink-0">
                    {l.durationMinutes} {isBn ? 'মি.' : 'min'}
                  </span>
                ) : null}
              </li>
            ))}
          </ol>
        </Card>
      )}

      {product.deliveryNote && (
        <Card>
          <h2 className="text-base font-semibold text-gray-900 mb-2">
            {isBn ? 'কীভাবে পাবেন' : 'How you get it'}
          </h2>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{product.deliveryNote}</p>
        </Card>
      )}
    </div>
  )
}
