'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, Clock, Download, Loader2, MessageCircle, PlayCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useStoreLocale } from './StorefrontChrome'

interface Lesson {
  id: string
  moduleTitle: string | null
  title: string
  videoUrl: string | null
  videoProvider: string | null
  durationMinutes: number | null
  contentMd: string | null
  resourceUrl: string | null
}

interface Asset {
  id: string
  fileName: string
  sizeBytes: number | null
}

interface Product {
  kind: string
  title: string
  subtitle: string | null
  description: string | null
  coverImageUrl: string | null
  deliveryNote: string | null
  contactWhatsapp: string | null
}

function formatBytes(bytes: number | null) {
  if (bytes == null) return ''
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export function LearnView({ accessToken }: { accessToken: string }) {
  const locale = useStoreLocale()
  const isBn = locale === 'bn'

  const [access, setAccess] = useState(false)
  const [status, setStatus] = useState<string>('')
  const [product, setProduct] = useState<Product | null>(null)
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [assets, setAssets] = useState<Asset[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/learn/${accessToken}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('failed'))))
      .then(
        (json: {
          access: boolean
          order: { status: string }
          product: Product | null
          lessons: Lesson[]
          assets: Asset[]
        }) => {
          setAccess(json.access)
          setStatus(json.order?.status ?? '')
          setProduct(json.product)
          setLessons(json.lessons ?? [])
          setAssets(json.assets ?? [])
          setActiveId(json.lessons?.[0]?.id ?? null)
        }
      )
      .catch(() => setError(isBn ? 'পাওয়া যায়নি।' : 'Could not load this.'))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken])

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 text-sm text-gray-500 py-16">
        <Loader2 className="w-4 h-4 animate-spin" />
        {isBn ? 'লোড হচ্ছে…' : 'Loading…'}
      </div>
    )
  }

  if (error) {
    return (
      <Card className="text-center py-12">
        <p className="text-sm text-gray-600">{error}</p>
      </Card>
    )
  }

  if (!access) {
    return (
      <Card className="text-center py-10">
        <Clock className="w-10 h-10 text-amber-500 mx-auto mb-3" />
        <p className="text-base font-semibold text-gray-900">
          {status === 'awaiting_confirmation'
            ? isBn
              ? 'পেমেন্ট যাচাই করা হচ্ছে'
              : 'We are checking your payment'
            : isBn
              ? 'এখনো পেমেন্ট হয়নি'
              : 'Payment not completed yet'}
        </p>
        <p className="text-sm text-gray-600 mt-1 mb-5">
          {isBn
            ? 'নিশ্চিত হলে এই পেজেই সবকিছু খুলে যাবে।'
            : 'Everything opens on this same page once it is confirmed.'}
        </p>
        <a href={`/checkout/${accessToken}`}>
          <Button variant="outline">{isBn ? 'পেমেন্টে ফিরে যান' : 'Back to payment'}</Button>
        </a>
      </Card>
    )
  }

  const active = lessons.find((l) => l.id === activeId) ?? lessons[0] ?? null

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 text-sm text-[#00A85F] font-medium">
        <CheckCircle2 className="w-4 h-4" />
        {isBn ? 'অ্যাক্সেস চালু আছে' : 'Access unlocked'}
      </div>

      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{product?.title}</h1>
        {product?.subtitle && <p className="text-sm text-gray-600 mt-1">{product.subtitle}</p>}
      </div>

      {/* ── Course player ─────────────────────────────────────────────────── */}
      {lessons.length > 0 && (
        <>
          {active && (
            <Card padding="none" className="overflow-hidden">
              {active.videoUrl ? (
                <div className="aspect-video w-full bg-black">
                  <iframe
                    key={active.id}
                    src={active.videoUrl}
                    title={active.title}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    referrerPolicy="strict-origin-when-cross-origin"
                  />
                </div>
              ) : null}
              <div className="p-5">
                <h2 className="text-base font-semibold text-gray-900">{active.title}</h2>
                {active.contentMd && (
                  <p className="text-sm text-gray-700 whitespace-pre-wrap mt-3 leading-relaxed">
                    {active.contentMd}
                  </p>
                )}
                {active.resourceUrl && (
                  <a
                    href={active.resourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-[#7C3AED] mt-3"
                  >
                    <Download className="w-4 h-4" />
                    {isBn ? 'ক্লাসের ফাইল' : 'Lesson resource'}
                  </a>
                )}
              </div>
            </Card>
          )}

          <Card>
            <h2 className="text-base font-semibold text-gray-900 mb-3">
              {isBn ? 'সব ক্লাস' : 'All lessons'}
            </h2>
            <ol className="space-y-1">
              {lessons.map((l, i) => (
                <li key={l.id}>
                  <button
                    type="button"
                    onClick={() => setActiveId(l.id)}
                    className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                      l.id === active?.id ? 'bg-[#F5F3FF]' : 'hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-xs text-gray-400 w-5 shrink-0">{i + 1}</span>
                    {l.videoUrl ? (
                      <PlayCircle className="w-4 h-4 text-[#7C3AED] shrink-0" />
                    ) : (
                      <span className="w-4 shrink-0" />
                    )}
                    <span className="flex-1 text-sm text-gray-800">{l.title}</span>
                    {l.durationMinutes ? (
                      <span className="text-xs text-gray-400 shrink-0">
                        {l.durationMinutes} {isBn ? 'মি.' : 'min'}
                      </span>
                    ) : null}
                  </button>
                </li>
              ))}
            </ol>
          </Card>
        </>
      )}

      {/* ── Downloads ─────────────────────────────────────────────────────── */}
      {assets.length > 0 && (
        <Card>
          <h2 className="text-base font-semibold text-gray-900 mb-1">
            {isBn ? 'ডাউনলোড' : 'Downloads'}
          </h2>
          <p className="text-xs text-gray-500 mb-4">
            {isBn
              ? 'লিংকগুলো এক মিনিটের জন্য কাজ করে — শেষ হলে আবার ক্লিক করুন।'
              : 'Each link works for one minute — just click again if it expires.'}
          </p>
          <div className="space-y-2">
            {assets.map((a) => (
              <a
                key={a.id}
                href={`/api/learn/${accessToken}/download/${a.id}`}
                className="flex items-center gap-3 rounded-lg border border-gray-200 px-3 py-3 hover:border-[#7C3AED]"
              >
                <Download className="w-4 h-4 text-[#7C3AED] shrink-0" />
                <span className="flex-1 text-sm font-medium text-gray-900 truncate">
                  {a.fileName}
                </span>
                <span className="text-xs text-gray-400 shrink-0">{formatBytes(a.sizeBytes)}</span>
              </a>
            ))}
          </div>
        </Card>
      )}

      {/* ── Service / consultation delivery ───────────────────────────────── */}
      {(product?.deliveryNote || product?.contactWhatsapp) && (
        <Card>
          <h2 className="text-base font-semibold text-gray-900 mb-2">
            {isBn ? 'পরের ধাপ' : 'What happens next'}
          </h2>
          {product.deliveryNote && (
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{product.deliveryNote}</p>
          )}
          {product.contactWhatsapp && (
            <a
              href={`https://wa.me/${product.contactWhatsapp.replace(/[^0-9]/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-[#7C3AED] mt-3"
            >
              <MessageCircle className="w-4 h-4" />
              {isBn ? 'হোয়াটসঅ্যাপে যোগাযোগ' : 'Message on WhatsApp'}
            </a>
          )}
        </Card>
      )}

      {lessons.length === 0 && assets.length === 0 && !product?.deliveryNote && (
        <Card className="text-center py-8">
          <p className="text-sm text-gray-600">
            {isBn
              ? 'বিক্রেতা এখনো কনটেন্ট যোগ করেননি। শীঘ্রই এখানে দেখা যাবে।'
              : 'The seller has not added the content yet. It will appear here.'}
          </p>
        </Card>
      )}

      <p className="text-xs text-gray-400 text-center">
        {isBn
          ? 'এই লিংকটি সেভ করে রাখুন — এটাই আপনার অ্যাক্সেস।'
          : 'Save this link — it is your access.'}
      </p>
    </div>
  )
}
