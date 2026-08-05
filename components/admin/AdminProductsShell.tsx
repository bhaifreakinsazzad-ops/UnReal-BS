'use client'

import { useEffect, useState } from 'react'
import { ExternalLink, Loader2, RotateCcw, Search, ShieldOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

interface Product {
  id: string
  sellerName: string | null
  sellerEmail: string | null
  kind: string
  slug: string
  title: string
  subtitle: string | null
  priceBdt: number
  status: string
  reviewNote: string | null
  salesCount: number
  publishedAt: string | null
}

const STATUS: Record<string, { label: string; tone: string }> = {
  published: { label: 'Live', tone: 'bg-green-50 text-green-700' },
  unpublished: { label: 'Hidden by seller', tone: 'bg-gray-100 text-gray-600' },
  pending_review: { label: 'In review', tone: 'bg-amber-50 text-amber-700' },
  rejected: { label: 'Taken down', tone: 'bg-red-50 text-red-700' },
  draft: { label: 'Draft', tone: 'bg-gray-100 text-gray-500' },
}

export function AdminProductsShell() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [reasons, setReasons] = useState<Record<string, string>>({})

  function load() {
    return fetch('/api/admin/products')
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('failed'))))
      .then((json: { products: Product[] }) => setProducts(json.products ?? []))
  }

  useEffect(() => {
    load()
      .catch(() => setError('Could not load products.'))
      .finally(() => setLoading(false))
  }, [])

  async function moderate(productId: string, action: 'take_down' | 'restore') {
    setBusy(productId)
    setError(null)
    setNotice(null)
    try {
      const res = await fetch('/api/admin/products', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, action, note: reasons[productId]?.trim() || undefined }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json?.message ?? 'Could not update this product.')
      setNotice(
        action === 'take_down'
          ? 'Taken down. Existing buyers keep their access.'
          : 'Returned to the seller as a draft.'
      )
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update this product.')
    } finally {
      setBusy(null)
    }
  }

  const q = query.trim().toLowerCase()
  const filtered = q
    ? products.filter((p) =>
        [p.title, p.sellerEmail, p.sellerName, p.slug]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(q))
      )
    : products

  return (
    <div className="mx-auto max-w-[900px] space-y-5 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Published Products</h1>
        <p className="text-sm text-gray-500 mt-1 max-w-2xl">
          Everything sellers have put on sale. Products publish without approval, so this is where
          you take something down if it breaks a rule. Buyers who already paid keep their access.
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {notice && (
        <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800">
          {notice}
        </div>
      )}

      <Input
        placeholder="Search title, slug or seller"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        leftIcon={<Search className="w-4 h-4" />}
      />

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-12 text-sm text-gray-500">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading…
        </div>
      ) : filtered.length === 0 ? (
        <Card className="text-center py-10">
          <p className="text-sm text-gray-500">Nothing published yet.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((p) => {
            const s = STATUS[p.status] ?? STATUS.draft
            return (
              <Card key={p.id} className="space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-gray-900">{p.title}</p>
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full ${s.tone}`}
                      >
                        {s.label}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {p.kind} ·{' '}
                      {p.priceBdt === 0 ? 'Free' : `৳${p.priceBdt.toLocaleString('en-US')}`} ·{' '}
                      {p.salesCount} sold
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {p.sellerName ?? p.sellerEmail ?? '—'}
                    </p>
                    {p.reviewNote && (
                      <p className="text-xs text-red-600 mt-1">Reason: {p.reviewNote}</p>
                    )}
                  </div>
                  {p.status === 'published' && (
                    <a
                      href={`/p/${p.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-[#7C3AED] shrink-0"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      View
                    </a>
                  )}
                </div>

                {p.status === 'rejected' ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    loading={busy === p.id}
                    onClick={() => moderate(p.id, 'restore')}
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Return to seller as a draft
                  </Button>
                ) : (
                  <div className="space-y-2">
                    <Input
                      placeholder="Reason for taking this down — the seller sees this"
                      value={reasons[p.id] ?? ''}
                      onChange={(e) => setReasons((r) => ({ ...r, [p.id]: e.target.value }))}
                    />
                    <Button
                      variant="danger"
                      size="sm"
                      loading={busy === p.id}
                      onClick={() => moderate(p.id, 'take_down')}
                    >
                      <ShieldOff className="w-3.5 h-3.5" />
                      Take down
                    </Button>
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
