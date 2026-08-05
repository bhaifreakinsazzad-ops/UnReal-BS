'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Check,
  Copy,
  Eye,
  FileUp,
  GripVertical,
  Loader2,
  Plus,
  Trash2,
  Video,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input, Textarea } from '@/components/ui/input'
import { useLocale } from '@/lib/i18n/context'
import { commissionBdt, sellerPayoutBdt, MIN_PRICE_BDT } from '@/lib/commerce/pricing'
import { parseVideoUrl } from '@/lib/commerce/video'
import { absoluteUrl, productPath } from '@/lib/commerce/links'
import { KINDS, STATUS_LABEL, bdt } from './ProductsShell'

interface Lesson {
  id: string
  moduleTitle: string | null
  title: string
  videoUrl: string | null
  videoProvider: string | null
  durationMinutes: number | null
  contentMd: string | null
  position: number
  isPreview: boolean
}

interface Asset {
  id: string
  fileName: string
  sizeBytes: number | null
  mimeType: string | null
}

interface Product {
  id: string
  kind: string
  slug: string
  title: string
  subtitle: string | null
  description: string | null
  coverImageUrl: string | null
  priceBdt: number
  compareAtPriceBdt: number | null
  deliveryNote: string | null
  contactWhatsapp: string | null
  status: string
  reviewNote: string | null
  salesCount: number
}

function formatBytes(bytes: number | null) {
  if (bytes == null) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export function ProductEditor({ productId }: { productId: string }) {
  const locale = useLocale()
  const isBn = locale === 'bn'

  const [product, setProduct] = useState<Product | null>(null)
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [copied, setCopied] = useState(false)

  const [form, setForm] = useState({
    title: '',
    subtitle: '',
    description: '',
    coverImageUrl: '',
    priceBdt: '0',
    compareAtPriceBdt: '',
    deliveryNote: '',
    contactWhatsapp: '',
  })

  const [newLesson, setNewLesson] = useState({
    moduleTitle: '',
    title: '',
    videoUrl: '',
    durationMinutes: '',
    contentMd: '',
    isPreview: false,
  })
  const [addingLesson, setAddingLesson] = useState(false)

  function load() {
    return fetch(`/api/products/${productId}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('failed'))))
      .then((json: { product: Product; lessons: Lesson[]; assets: Asset[] }) => {
        setProduct(json.product)
        setLessons(json.lessons ?? [])
        setAssets(json.assets ?? [])
        setForm({
          title: json.product.title ?? '',
          subtitle: json.product.subtitle ?? '',
          description: json.product.description ?? '',
          coverImageUrl: json.product.coverImageUrl ?? '',
          priceBdt: String(json.product.priceBdt ?? 0),
          compareAtPriceBdt:
            json.product.compareAtPriceBdt != null ? String(json.product.compareAtPriceBdt) : '',
          deliveryNote: json.product.deliveryNote ?? '',
          contactWhatsapp: json.product.contactWhatsapp ?? '',
        })
      })
  }

  useEffect(() => {
    load()
      .catch(() => setError(isBn ? 'প্রোডাক্ট লোড করা যায়নি।' : 'Could not load this product.'))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId])

  async function save(): Promise<boolean> {
    setSaving(true)
    setError(null)
    setSaved(false)
    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title.trim(),
          subtitle: form.subtitle.trim() || null,
          description: form.description.trim() || null,
          coverImageUrl: form.coverImageUrl.trim() || null,
          priceBdt: Number(form.priceBdt) || 0,
          compareAtPriceBdt: form.compareAtPriceBdt ? Number(form.compareAtPriceBdt) : null,
          deliveryNote: form.deliveryNote.trim() || null,
          contactWhatsapp: form.contactWhatsapp.trim() || null,
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json?.message ?? 'Could not save.')
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save.')
      return false
    } finally {
      setSaving(false)
    }
  }

  async function togglePublish() {
    const action = product?.status === 'published' ? 'unpublish' : 'publish'
    setPublishing(true)
    setError(null)

    // Save first when publishing, so validation runs against what the seller
    // can actually see on screen rather than the last saved version.
    if (action === 'publish') {
      const ok = await save()
      if (!ok) {
        setPublishing(false)
        return
      }
    }

    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json?.message ?? 'Could not update.')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update.')
    } finally {
      setPublishing(false)
    }
  }

  async function addLesson() {
    if (!newLesson.title.trim()) {
      setError(isBn ? 'ক্লাসের নাম দিন।' : 'Give the lesson a title.')
      return
    }
    setAddingLesson(true)
    setError(null)
    try {
      const res = await fetch(`/api/products/${productId}/lessons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moduleTitle: newLesson.moduleTitle.trim() || null,
          title: newLesson.title.trim(),
          videoUrl: newLesson.videoUrl.trim() || null,
          durationMinutes: newLesson.durationMinutes ? Number(newLesson.durationMinutes) : null,
          contentMd: newLesson.contentMd.trim() || null,
          isPreview: newLesson.isPreview,
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json?.message ?? 'Could not add the lesson.')
      setNewLesson({
        moduleTitle: newLesson.moduleTitle,
        title: '',
        videoUrl: '',
        durationMinutes: '',
        contentMd: '',
        isPreview: false,
      })
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add the lesson.')
    } finally {
      setAddingLesson(false)
    }
  }

  async function deleteLesson(lessonId: string) {
    setError(null)
    try {
      const res = await fetch(`/api/products/${productId}/lessons/${lessonId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Could not remove that lesson.')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not remove that lesson.')
    }
  }

  async function togglePreview(lesson: Lesson) {
    setError(null)
    try {
      const res = await fetch(`/api/products/${productId}/lessons/${lesson.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPreview: !lesson.isPreview }),
      })
      if (!res.ok) throw new Error('Could not update that lesson.')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update that lesson.')
    }
  }

  async function uploadFile(file: File) {
    setUploading(true)
    setError(null)
    try {
      const body = new FormData()
      body.append('file', file)
      const res = await fetch(`/api/products/${productId}/assets`, { method: 'POST', body })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json?.message ?? 'Could not upload that file.')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not upload that file.')
    } finally {
      setUploading(false)
    }
  }

  async function deleteAsset(assetId: string) {
    setError(null)
    try {
      const res = await fetch(`/api/products/${productId}/assets?assetId=${assetId}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Could not remove that file.')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not remove that file.')
    }
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center gap-2 text-sm text-gray-500">
        <Loader2 className="w-4 h-4 animate-spin" />
        {isBn ? 'লোড হচ্ছে…' : 'Loading…'}
      </div>
    )
  }

  if (!product) {
    return (
      <div className="p-8 text-center">
        <p className="text-sm text-gray-600">{error ?? (isBn ? 'পাওয়া যায়নি।' : 'Not found.')}</p>
        <Link href="/products" className="text-sm text-[#7C3AED] mt-2 inline-block">
          {isBn ? 'ফিরে যান' : 'Back to products'}
        </Link>
      </div>
    )
  }

  const kind = KINDS.find((k) => k.value === product.kind)
  const status = STATUS_LABEL[product.status] ?? STATUS_LABEL.draft
  const price = Number(form.priceBdt) || 0
  const publicPath = productPath(product.slug)
  const isCourse = product.kind === 'course'
  const isDownload = product.kind === 'download'
  const isService = product.kind === 'service' || product.kind === 'consultation'

  const shareText = isBn
    ? `${form.title} — ${price === 0 ? 'ফ্রি' : bdt(price)}`
    : `${form.title} — ${price === 0 ? 'Free' : bdt(price)}`

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      <Link
        href="/products"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        {isBn ? 'সব প্রোডাক্ট' : 'All products'}
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{product.title}</h1>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${status.tone}`}>
              {isBn ? status.bn : status.en}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {isBn ? kind?.bn : kind?.en}
            {product.salesCount > 0 && ` · ${product.salesCount} ${isBn ? 'বিক্রি' : 'sold'}`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={save} loading={saving}>
            {saved ? <Check className="w-4 h-4" /> : null}
            {saved ? (isBn ? 'সেভ হয়েছে' : 'Saved') : isBn ? 'সেভ' : 'Save'}
          </Button>
          <Button
            variant={product.status === 'published' ? 'outline' : 'accent'}
            onClick={togglePublish}
            loading={publishing}
          >
            {product.status === 'published'
              ? isBn
                ? 'লুকান'
                : 'Unpublish'
              : isBn
                ? 'পাবলিশ করুন'
                : 'Publish'}
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {product.status === 'rejected' && product.reviewNote && (
        <div className="mb-4 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
          {product.reviewNote}
        </div>
      )}

      {product.status === 'published' && (
        <Card className="mb-6 bg-[#F0FDF4] border-[#BBF7D0]">
          <p className="text-sm font-medium text-gray-900 mb-2">
            {isBn ? 'আপনার বিক্রির লিংক' : 'Your selling link'}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {/* The path is shown; the full URL is resolved when it is copied
                or shared, so the server and the browser never disagree about
                what this box says. */}
            <code className="flex-1 min-w-[200px] text-xs bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-700 truncate">
              {publicPath}
            </code>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                navigator.clipboard.writeText(absoluteUrl(publicPath))
                setCopied(true)
                setTimeout(() => setCopied(false), 2000)
              }}
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? (isBn ? 'কপি হয়েছে' : 'Copied') : isBn ? 'কপি' : 'Copy'}
            </Button>
            {/* WhatsApp and Facebook are where products in Bangladesh are
                actually sold, so sharing is one tap and not an afterthought. */}
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                window.open(
                  `https://wa.me/?text=${encodeURIComponent(`${shareText}\n${absoluteUrl(publicPath)}`)}`,
                  '_blank',
                  'noopener,noreferrer'
                )
              }
            >
              WhatsApp
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                window.open(
                  `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(absoluteUrl(publicPath))}`,
                  '_blank',
                  'noopener,noreferrer'
                )
              }
            >
              {isBn ? 'ফেসবুকে শেয়ার' : 'Share to Facebook'}
            </Button>
            <a href={publicPath} target="_blank" rel="noopener noreferrer">
              <Button size="sm" variant="ghost">
                <Eye className="w-3.5 h-3.5" />
                {isBn ? 'দেখুন' : 'Preview'}
              </Button>
            </a>
          </div>
        </Card>
      )}

      {/* ── Details ───────────────────────────────────────────────────────── */}
      <Card className="mb-4">
        <h2 className="text-base font-semibold text-gray-900 mb-4">
          {isBn ? 'বিবরণ' : 'Details'}
        </h2>
        <div className="space-y-4">
          <Input
            label={isBn ? 'নাম' : 'Title'}
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            required
          />
          <Input
            label={isBn ? 'এক লাইনের পরিচয়' : 'One-line summary'}
            value={form.subtitle}
            onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))}
            placeholder={
              isBn ? 'যেমন: ৭ দিনে ফেসবুক থেকে অর্ডার আনুন' : 'e.g. Get orders from Facebook in 7 days'
            }
          />
          <Textarea
            label={isBn ? 'বিস্তারিত' : 'Description'}
            rows={6}
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder={
              isBn
                ? 'ক্রেতা কী শিখবে বা কী পাবে, সহজ ভাষায় লিখুন।'
                : 'In plain language, what does the buyer learn or get?'
            }
          />
          <Input
            label={isBn ? 'কভার ছবির লিংক' : 'Cover image URL'}
            value={form.coverImageUrl}
            onChange={(e) => setForm((f) => ({ ...f, coverImageUrl: e.target.value }))}
            placeholder="https://…"
            hint={
              isBn
                ? 'ছবি না দিলেও চলবে — তবে ছবিসহ পোস্ট বেশি বিক্রি হয়।'
                : 'Optional, but a product with a picture sells more.'
            }
          />
        </div>
      </Card>

      {/* ── Pricing ───────────────────────────────────────────────────────── */}
      <Card className="mb-4">
        <h2 className="text-base font-semibold text-gray-900 mb-4">{isBn ? 'দাম' : 'Pricing'}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label={isBn ? 'দাম (৳)' : 'Price (৳)'}
            type="number"
            min={0}
            value={form.priceBdt}
            onChange={(e) => setForm((f) => ({ ...f, priceBdt: e.target.value }))}
            hint={
              isBn
                ? `ফ্রি দিতে ০ লিখুন, নয়তো কমপক্ষে ৳${MIN_PRICE_BDT}`
                : `Enter 0 for free, otherwise at least ৳${MIN_PRICE_BDT}`
            }
          />
          <Input
            label={isBn ? 'আগের দাম (৳)' : 'Compare-at price (৳)'}
            type="number"
            min={0}
            value={form.compareAtPriceBdt}
            onChange={(e) => setForm((f) => ({ ...f, compareAtPriceBdt: e.target.value }))}
            hint={isBn ? 'কাটা দাম দেখাতে চাইলে' : 'Shown struck through, if set'}
          />
        </div>

        <div className="mt-4 rounded-lg bg-gray-50 border border-gray-200 px-4 py-3 text-sm">
          {price === 0 ? (
            <p className="text-gray-600">
              {isBn
                ? 'ফ্রি — কোনো কমিশন নেই। ক্রেতার নাম ও নম্বর আপনার কনট্যাক্টে যোগ হবে।'
                : 'Free — no commission. Buyers still become contacts you can follow up with.'}
            </p>
          ) : (
            <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
              <span className="text-gray-600">
                {isBn ? 'প্রতি বিক্রিতে আপনি পাবেন' : 'You receive per sale'}{' '}
                <strong className="text-[#00A85F]">{bdt(sellerPayoutBdt(price))}</strong>
              </span>
              <span className="text-gray-400">
                {isBn ? 'প্ল্যাটফর্ম ফি' : 'Platform fee'} {bdt(commissionBdt(price))}
              </span>
            </div>
          )}
        </div>
      </Card>

      {/* ── Curriculum ────────────────────────────────────────────────────── */}
      {isCourse && (
        <Card className="mb-4">
          <h2 className="text-base font-semibold text-gray-900 mb-1">
            {isBn ? 'ক্লাসসমূহ' : 'Lessons'}
          </h2>
          <p className="text-xs text-gray-500 mb-4">
            {isBn
              ? 'YouTube বা Vimeo লিংক পেস্ট করুন। ভিডিও আপলোড করার দরকার নেই।'
              : 'Paste a YouTube or Vimeo link. There is no need to upload video.'}
          </p>

          {lessons.length > 0 && (
            <div className="space-y-2 mb-5">
              {lessons.map((l, i) => (
                <div
                  key={l.id}
                  className="flex items-center gap-3 rounded-lg border border-gray-200 px-3 py-2.5"
                >
                  <GripVertical className="w-4 h-4 text-gray-300 shrink-0" />
                  <span className="text-xs text-gray-400 w-5 shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{l.title}</p>
                    <p className="text-xs text-gray-500">
                      {l.moduleTitle ? `${l.moduleTitle} · ` : ''}
                      {l.videoProvider ? (
                        <span className="inline-flex items-center gap-1">
                          <Video className="w-3 h-3" />
                          {l.videoProvider}
                        </span>
                      ) : (
                        (isBn ? 'লেখা' : 'Text')
                      )}
                      {l.durationMinutes ? ` · ${l.durationMinutes} ${isBn ? 'মিনিট' : 'min'}` : ''}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => togglePreview(l)}
                    className={`text-xs font-medium px-2 py-1 rounded-full shrink-0 ${
                      l.isPreview ? 'bg-[#D1FAE5] text-[#059669]' : 'bg-gray-100 text-gray-500'
                    }`}
                    title={
                      isBn
                        ? 'ফ্রি প্রিভিউ — না কিনেও দেখা যাবে'
                        : 'Free preview — watchable before buying'
                    }
                  >
                    {isBn ? 'ফ্রি' : 'Preview'}
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteLesson(l.id)}
                    className="text-gray-300 hover:text-red-500 shrink-0"
                    aria-label={isBn ? 'মুছুন' : 'Delete'}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="rounded-lg border border-dashed border-gray-300 p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label={isBn ? 'সেকশন (ঐচ্ছিক)' : 'Section (optional)'}
                value={newLesson.moduleTitle}
                onChange={(e) => setNewLesson((l) => ({ ...l, moduleTitle: e.target.value }))}
                placeholder={isBn ? 'যেমন: শুরুর কথা' : 'e.g. Getting started'}
              />
              <Input
                label={isBn ? 'ক্লাসের নাম' : 'Lesson title'}
                value={newLesson.title}
                onChange={(e) => setNewLesson((l) => ({ ...l, title: e.target.value }))}
                required
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <Input
                  label={isBn ? 'ভিডিও লিংক' : 'Video link'}
                  value={newLesson.videoUrl}
                  onChange={(e) => setNewLesson((l) => ({ ...l, videoUrl: e.target.value }))}
                  placeholder="https://youtu.be/…"
                  error={
                    newLesson.videoUrl.trim() && !parseVideoUrl(newLesson.videoUrl)
                      ? isBn
                        ? 'YouTube বা Vimeo লিংক দিন'
                        : 'Use a YouTube or Vimeo link'
                      : undefined
                  }
                />
              </div>
              <Input
                label={isBn ? 'সময় (মিনিট)' : 'Length (min)'}
                type="number"
                min={0}
                value={newLesson.durationMinutes}
                onChange={(e) => setNewLesson((l) => ({ ...l, durationMinutes: e.target.value }))}
              />
            </div>
            <Textarea
              label={isBn ? 'লেখা (ঐচ্ছিক)' : 'Written notes (optional)'}
              rows={3}
              value={newLesson.contentMd}
              onChange={(e) => setNewLesson((l) => ({ ...l, contentMd: e.target.value }))}
            />
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={newLesson.isPreview}
                onChange={(e) => setNewLesson((l) => ({ ...l, isPreview: e.target.checked }))}
                className="rounded border-gray-300"
              />
              {isBn
                ? 'ফ্রি প্রিভিউ হিসেবে দেখান (না কিনেও দেখা যাবে)'
                : 'Show as a free preview (watchable before buying)'}
            </label>
            <Button size="sm" onClick={addLesson} loading={addingLesson}>
              <Plus className="w-3.5 h-3.5" />
              {isBn ? 'ক্লাস যোগ করুন' : 'Add lesson'}
            </Button>
          </div>
        </Card>
      )}

      {/* ── Files ─────────────────────────────────────────────────────────── */}
      {isDownload && (
        <Card className="mb-4">
          <h2 className="text-base font-semibold text-gray-900 mb-1">{isBn ? 'ফাইল' : 'Files'}</h2>
          <p className="text-xs text-gray-500 mb-4">
            {isBn
              ? 'পেমেন্ট নিশ্চিত হলে ক্রেতা এগুলো ডাউনলোড করতে পারবে। সর্বোচ্চ ৫০ MB।'
              : 'Buyers can download these once payment is confirmed. Up to 50 MB each.'}
          </p>

          {assets.length > 0 && (
            <div className="space-y-2 mb-4">
              {assets.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center gap-3 rounded-lg border border-gray-200 px-3 py-2.5"
                >
                  <FileUp className="w-4 h-4 text-gray-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 truncate">{a.fileName}</p>
                    <p className="text-xs text-gray-500">{formatBytes(a.sizeBytes)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => deleteAsset(a.id)}
                    className="text-gray-300 hover:text-red-500 shrink-0"
                    aria-label={isBn ? 'মুছুন' : 'Delete'}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <label className="inline-flex items-center gap-2 cursor-pointer rounded-lg border border-dashed border-gray-300 px-4 py-3 text-sm text-gray-600 hover:border-[#7C3AED] hover:text-[#7C3AED]">
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileUp className="w-4 h-4" />}
            {uploading ? (isBn ? 'আপলোড হচ্ছে…' : 'Uploading…') : isBn ? 'ফাইল বেছে নিন' : 'Choose a file'}
            <input
              type="file"
              className="hidden"
              disabled={uploading}
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) uploadFile(file)
                e.target.value = ''
              }}
            />
          </label>
        </Card>
      )}

      {/* ── Delivery for services ─────────────────────────────────────────── */}
      {isService && (
        <Card className="mb-4">
          <h2 className="text-base font-semibold text-gray-900 mb-1">
            {isBn ? 'কীভাবে দেবেন' : 'How you deliver'}
          </h2>
          <p className="text-xs text-gray-500 mb-4">
            {isBn
              ? 'পেমেন্টের পর ক্রেতা এটাই দেখবে। কীভাবে যোগাযোগ করবেন স্পষ্ট করে লিখুন।'
              : 'This is what the buyer sees after paying. Be clear about how you will reach them.'}
          </p>
          <div className="space-y-4">
            <Input
              label={isBn ? 'হোয়াটসঅ্যাপ নম্বর' : 'WhatsApp number'}
              value={form.contactWhatsapp}
              onChange={(e) => setForm((f) => ({ ...f, contactWhatsapp: e.target.value }))}
              placeholder="01XXXXXXXXX"
            />
            <Textarea
              label={isBn ? 'ডেলিভারির নোট' : 'Delivery note'}
              rows={4}
              value={form.deliveryNote}
              onChange={(e) => setForm((f) => ({ ...f, deliveryNote: e.target.value }))}
              placeholder={
                isBn
                  ? 'যেমন: পেমেন্টের ২৪ ঘণ্টার মধ্যে আমি হোয়াটসঅ্যাপে যোগাযোগ করব।'
                  : 'e.g. I will message you on WhatsApp within 24 hours of payment.'
              }
            />
          </div>
        </Card>
      )}
    </div>
  )
}
