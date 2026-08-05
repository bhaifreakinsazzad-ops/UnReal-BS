'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  BookOpen,
  Download,
  ExternalLink,
  Handshake,
  Loader2,
  Package,
  Phone,
  Plus,
  ShoppingBag,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useLocale } from '@/lib/i18n/context'
import { absoluteUrl, productPath, shopPath } from '@/lib/commerce/links'

export interface SellerProduct {
  id: string
  kind: string
  slug: string
  title: string
  subtitle: string | null
  priceBdt: number
  commissionBdt: number
  sellerPayoutBdt: number
  status: string
  reviewNote: string | null
  salesCount: number
  createdAt: string
}

export const KINDS = [
  {
    value: 'course',
    en: 'Online course',
    bn: 'অনলাইন কোর্স',
    descEn: 'Video lessons people watch after paying',
    descBn: 'পেমেন্টের পর ভিডিও ক্লাস দেখা যাবে',
    icon: BookOpen,
  },
  {
    value: 'download',
    en: 'Digital file',
    bn: 'ডিজিটাল ফাইল',
    descEn: 'PDF, ebook, template, design file',
    descBn: 'PDF, ইবুক, টেমপ্লেট, ডিজাইন ফাইল',
    icon: Download,
  },
  {
    value: 'service',
    en: 'Service',
    bn: 'সার্ভিস',
    descEn: 'Fixed-price work you deliver yourself',
    descBn: 'নির্দিষ্ট দামে আপনি নিজে করে দেবেন',
    icon: Handshake,
  },
  {
    value: 'consultation',
    en: 'Consultation',
    bn: 'পরামর্শ',
    descEn: 'Paid call or meeting',
    descBn: 'টাকার বিনিময়ে কল বা মিটিং',
    icon: Phone,
  },
] as const

export const STATUS_LABEL: Record<string, { en: string; bn: string; tone: string }> = {
  draft: { en: 'Draft', bn: 'খসড়া', tone: 'bg-gray-100 text-gray-600' },
  pending_review: { en: 'In review', bn: 'রিভিউতে', tone: 'bg-amber-50 text-amber-700' },
  published: { en: 'Live', bn: 'লাইভ', tone: 'bg-green-50 text-green-700' },
  unpublished: { en: 'Hidden', bn: 'লুকানো', tone: 'bg-gray-100 text-gray-600' },
  rejected: { en: 'Needs changes', bn: 'পরিবর্তন দরকার', tone: 'bg-red-50 text-red-700' },
}

export function bdt(v: number) {
  return `৳${Math.round(v).toLocaleString('en-US')}`
}

export function ProductsShell() {
  const router = useRouter()
  const locale = useLocale()
  const isBn = locale === 'bn'

  const [products, setProducts] = useState<SellerProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [form, setForm] = useState({ kind: 'course', title: '', priceBdt: '500' })

  const [storeSlug, setStoreSlug] = useState<string | null>(null)
  const [slugDraft, setSlugDraft] = useState('')
  const [savingSlug, setSavingSlug] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch('/api/products').then((res) =>
        res.ok ? res.json() : Promise.reject(new Error('failed'))
      ),
      fetch('/api/store')
        .then((res) => (res.ok ? res.json() : null))
        .catch(() => null),
    ])
      .then(([productsJson, storeJson]) => {
        setProducts((productsJson as { products: SellerProduct[] }).products ?? [])
        const slug = (storeJson as { store?: { storeSlug: string | null } } | null)?.store?.storeSlug
        setStoreSlug(slug ?? null)
        setSlugDraft(slug ?? '')
      })
      .catch(() =>
        setError(isBn ? 'প্রোডাক্ট লোড করা যায়নি।' : 'Could not load your products.')
      )
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function saveSlug() {
    setSavingSlug(true)
    setError(null)
    try {
      const res = await fetch('/api/store', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeSlug: slugDraft.trim().toLowerCase() }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json?.message ?? 'Could not save that shop name.')
      setStoreSlug(json.store.storeSlug)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save that shop name.')
    } finally {
      setSavingSlug(false)
    }
  }

  async function create() {
    if (!form.title.trim()) {
      setError(isBn ? 'একটি নাম দিন।' : 'Give it a name.')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: form.kind,
          title: form.title.trim(),
          priceBdt: Number(form.priceBdt) || 0,
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json?.message ?? 'Could not create this product.')
      router.push(`/products/${json.product.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create this product.')
      setSubmitting(false)
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            {isBn ? 'ডিজিটাল প্রোডাক্ট' : 'Digital Products'}
          </h1>
          <p className="text-sm text-gray-500 mt-1 max-w-2xl">
            {isBn
              ? 'কোর্স, ইবুক, টেমপ্লেট বা সার্ভিস — অনলাইনে বিক্রি করুন। লিংক শেয়ার করুন, বিকাশে পেমেন্ট নিন, টাকা আপনার ওয়ালেটে আসবে।'
              : 'Sell courses, ebooks, templates or services online. Share a link, take bKash payments, and the money lands in your wallet.'}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/sales">
            <Button variant="outline" size="md">
              <ShoppingBag className="w-4 h-4" />
              {isBn ? 'বিক্রি' : 'Sales'}
            </Button>
          </Link>
          <Button size="md" onClick={() => setCreating((v) => !v)}>
            <Plus className="w-4 h-4" />
            {isBn ? 'নতুন' : 'New'}
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {creating && (
        <Card className="mb-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">
            {isBn ? 'কী বিক্রি করবেন?' : 'What are you selling?'}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-5">
            {KINDS.map((k) => {
              const Icon = k.icon
              const active = form.kind === k.value
              return (
                <button
                  key={k.value}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, kind: k.value }))}
                  className={`text-left rounded-lg border p-3 transition-all ${
                    active
                      ? 'border-[#7C3AED] bg-[#F5F3FF] ring-2 ring-[#7C3AED]/20'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className={`w-4 h-4 ${active ? 'text-[#7C3AED]' : 'text-gray-400'}`} />
                    <span className="text-sm font-medium text-gray-900">{isBn ? k.bn : k.en}</span>
                  </div>
                  <p className="text-xs text-gray-500">{isBn ? k.descBn : k.descEn}</p>
                </button>
              )
            })}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label={isBn ? 'নাম' : 'Name'}
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder={isBn ? 'যেমন: ফেসবুক মার্কেটিং কোর্স' : 'e.g. Facebook Marketing Course'}
              required
            />
            <Input
              label={isBn ? 'দাম (৳)' : 'Price (৳)'}
              type="number"
              min={0}
              value={form.priceBdt}
              onChange={(e) => setForm((f) => ({ ...f, priceBdt: e.target.value }))}
              hint={isBn ? 'ফ্রি দিতে চাইলে ০ লিখুন' : 'Enter 0 to give it away free'}
            />
          </div>

          <div className="mt-4 rounded-lg bg-gray-50 border border-gray-200 px-4 py-3 text-sm">
            <p className="text-gray-600">
              {isBn ? 'এটি প্ল্যাটফর্মের নিজস্ব প্রোডাক্ট। বিক্রয়মূল্য সম্পূর্ণ প্ল্যাটফর্ম রাজস্ব হিসেবে রেকর্ড হবে।' : 'This is platform-owned inventory. The full sale price is recorded as platform revenue.'}
            </p>
          </div>

          <div className="flex gap-2 mt-5">
            <Button onClick={create} loading={submitting}>
              {isBn ? 'তৈরি করুন' : 'Create'}
            </Button>
            <Button variant="ghost" onClick={() => setCreating(false)} disabled={submitting}>
              {isBn ? 'বাতিল' : 'Cancel'}
            </Button>
          </div>
        </Card>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-gray-500 py-12 justify-center">
          <Loader2 className="w-4 h-4 animate-spin" />
          {isBn ? 'লোড হচ্ছে…' : 'Loading…'}
        </div>
      ) : products.length === 0 ? (
        <Card className="text-center py-12">
          <Package className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-900">
            {isBn ? 'এখনো কোনো প্রোডাক্ট নেই' : 'No products yet'}
          </p>
          <p className="text-sm text-gray-500 mt-1 mb-4">
            {isBn
              ? 'প্রথম কোর্স বা ফাইলটি তৈরি করুন — কয়েক মিনিটেই বিক্রির জন্য প্রস্তুত।'
              : 'Create your first course or file — it takes a few minutes to be ready to sell.'}
          </p>
          <Button onClick={() => setCreating(true)}>
            <Plus className="w-4 h-4" />
            {isBn ? 'শুরু করুন' : 'Get started'}
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {products.map((p) => {
            const kind = KINDS.find((k) => k.value === p.kind)
            const Icon = kind?.icon ?? Package
            const status = STATUS_LABEL[p.status] ?? STATUS_LABEL.draft
            return (
              <Card key={p.id} className="flex flex-wrap items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-[#F5F3FF] flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-[#7C3AED]" />
                </div>

                <div className="flex-1 min-w-[200px]">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link
                      href={`/products/${p.id}`}
                      className="text-sm font-semibold text-gray-900 hover:text-[#7C3AED]"
                    >
                      {p.title}
                    </Link>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${status.tone}`}>
                      {isBn ? status.bn : status.en}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {isBn ? kind?.bn : kind?.en} · {p.priceBdt === 0 ? (isBn ? 'ফ্রি' : 'Free') : bdt(p.priceBdt)}
                    {p.salesCount > 0 && (
                      <>
                        {' · '}
                        <span className="text-[#00A85F] font-medium">
                          {p.salesCount} {isBn ? 'বিক্রি' : 'sold'}
                        </span>
                      </>
                    )}
                  </p>
                  {p.status === 'rejected' && p.reviewNote && (
                    <p className="text-xs text-red-600 mt-1">{p.reviewNote}</p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {p.status === 'published' && (
                    <a
                      href={productPath(p.slug)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-[#7C3AED]"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      {isBn ? 'দেখুন' : 'View'}
                    </a>
                  )}
                  <Link href={`/products/${p.id}`}>
                    <Button variant="outline" size="sm">
                      {isBn ? 'সম্পাদনা' : 'Edit'}
                    </Button>
                  </Link>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* One link for the whole shop — what actually goes in a Facebook page
          bio, rather than a different URL for every product. */}
      <Card className="mt-6">
        <p className="text-sm font-semibold text-gray-900 mb-1">
          {isBn ? 'আপনার দোকানের লিংক' : 'Your shop link'}
        </p>
        <p className="text-xs text-gray-500 mb-3">
          {isBn
            ? 'একটি নাম বেছে নিন — সব প্রোডাক্ট এক লিংকে দেখা যাবে। ফেসবুক পেজের বায়োতে দিন।'
            : 'Pick a handle and every product you publish lives at one link. Put it in your Facebook page bio.'}
        </p>
        <div className="flex flex-wrap items-end gap-2">
          <div className="flex-1 min-w-[220px]">
            <div className="flex items-center gap-1">
              <span className="text-sm text-gray-400 shrink-0">/shop/</span>
              <Input
                value={slugDraft}
                onChange={(e) => setSlugDraft(e.target.value)}
                placeholder="rahim-store"
                className="h-9"
              />
            </div>
          </div>
          <Button size="sm" variant="outline" onClick={saveSlug} loading={savingSlug}>
            {isBn ? 'সেভ' : 'Save'}
          </Button>
          {storeSlug && (
            <>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => navigator.clipboard.writeText(absoluteUrl(shopPath(storeSlug)))}
              >
                {isBn ? 'লিংক কপি' : 'Copy link'}
              </Button>
              <a
                href={shopPath(storeSlug)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-[#7C3AED]"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                {isBn ? 'দেখুন' : 'Open'}
              </a>
            </>
          )}
        </div>
      </Card>

      <Card className="mt-4 bg-[#F5F3FF] border-[#DDD6FE]">
        <div className="flex gap-3">
          <Badge variant="primary">{isBn ? 'কীভাবে কাজ করে' : 'How it works'}</Badge>
        </div>
        <ol className="mt-3 space-y-1.5 text-sm text-gray-700 list-decimal list-inside">
          <li>
            {isBn
              ? 'প্রোডাক্ট তৈরি করে পাবলিশ করুন — একটি পাবলিক লিংক পাবেন।'
              : 'Create a product and publish it — you get a public link.'}
          </li>
          <li>
            {isBn
              ? 'লিংকটি ফেসবুক বা হোয়াটসঅ্যাপে শেয়ার করুন।'
              : 'Share that link on Facebook or WhatsApp.'}
          </li>
          <li>
            {isBn
              ? 'ক্রেতা বিকাশ/নগদে পেমেন্ট করে TrxID দেবে, আমরা যাচাই করব।'
              : 'The buyer pays by bKash/Nagad and enters the TrxID, and we verify it.'}
          </li>
          <li>
            {isBn
              ? 'টাকা আপনার ওয়ালেটে যোগ হবে, ক্রেতা সাথে সাথেই অ্যাক্সেস পাবে।'
              : 'Your wallet is credited and the buyer gets access immediately.'}
          </li>
        </ol>
      </Card>
    </div>
  )
}
