'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, Check, Loader2, Package } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface Bundle {
  code: string
  nameEn: string
  nameBn: string
  priceBdt: number
  creditBdt: number
  storedCostCapBdt: number
  derivedCostCapBdt: number | null
  isActive: boolean
}

function bdt(v: number, dp = 0) {
  return `৳${v.toLocaleString('en-US', { minimumFractionDigits: dp, maximumFractionDigits: dp })}`
}

export function AdminBundlesShell() {
  const [bundles, setBundles] = useState<Bundle[]>([])
  const [uniformMarkup, setUniformMarkup] = useState<number | null>(null)
  const [markupsInUse, setMarkupsInUse] = useState<number[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [drafts, setDrafts] = useState<Record<string, { price: string; credit: string }>>({})
  const [saving, setSaving] = useState<string | null>(null)
  const [saved, setSaved] = useState<Record<string, boolean>>({})

  function hydrate(list: Bundle[]) {
    setBundles(list)
    setDrafts(Object.fromEntries(list.map((b) => [b.code, { price: String(b.priceBdt), credit: String(b.creditBdt) }])))
  }

  useEffect(() => {
    fetch('/api/admin/bundles')
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('failed'))))
      .then((json: { bundles: Bundle[]; uniformMarkup: number | null; markupsInUse: number[] }) => {
        hydrate(json.bundles ?? [])
        setUniformMarkup(json.uniformMarkup)
        setMarkupsInUse(json.markupsInUse ?? [])
      })
      .catch(() => setError('Could not load packages.'))
      .finally(() => setLoading(false))
  }, [])

  async function save(b: Bundle) {
    const d = drafts[b.code]
    const price = Number(d.price)
    const credit = Number(d.credit)
    if (Number.isNaN(price) || Number.isNaN(credit)) {
      setError('Please enter valid numbers.')
      return
    }

    setSaving(b.code)
    setError(null)
    try {
      const res = await fetch('/api/admin/bundles', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: b.code, priceBdt: price, creditBdt: credit }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json?.message ?? 'Could not update this package.')

      setBundles((prev) =>
        prev.map((x) =>
          x.code === b.code
            ? { ...x, priceBdt: price, creditBdt: credit, storedCostCapBdt: json.costCapBdt, derivedCostCapBdt: json.costCapBdt }
            : x
        )
      )
      setSaved((s) => ({ ...s, [b.code]: true }))
      setTimeout(() => setSaved((s) => ({ ...s, [b.code]: false })), 2500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update this package.')
    } finally {
      setSaving(null)
    }
  }

  async function toggle(b: Bundle) {
    setSaving(b.code)
    try {
      const res = await fetch('/api/admin/bundles', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: b.code, isActive: !b.isActive }),
      })
      if (!res.ok) throw new Error('failed')
      setBundles((prev) => prev.map((x) => (x.code === b.code ? { ...x, isActive: !x.isActive } : x)))
    } catch {
      setError('Could not change availability.')
    } finally {
      setSaving(null)
    }
  }

  return (
    <div className="mx-auto max-w-[1100px] space-y-5 p-4 md:p-6">
      <div className="rounded-2xl bg-[#07101F] p-5 text-white md:p-7">
        <Badge variant="accent" dot>Admin</Badge>
        <h1 className="mt-4 text-2xl font-black md:text-4xl">AI Packages</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-white/65">
          What customers buy. They pay the price and receive the credit — the difference
          is the bulk-discount bonus. Because every active model shares one markup, the
          most a package can ever cost you in provider fees is credit ÷ markup,
          whichever models the customer uses.
        </p>
      </div>

      {uniformMarkup === null ? (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
          <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <span>
            <strong>Cost ceilings are not guaranteed right now.</strong> Active models use
            different markups ({markupsInUse.join('×, ')}×), so a customer who concentrates
            spend on the thinnest-margin model can exceed the ceiling. Set every active
            model to the same markup on the AI Rate Card.
          </span>
        </div>
      ) : (
        <div className="flex items-start gap-2 rounded-xl border border-green-200 bg-green-50 px-3 py-2.5 text-sm text-green-800">
          <Check className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <span>
            All active models use a uniform <strong>{uniformMarkup}×</strong> markup, so every
            ceiling below is exact.
          </span>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-600">
          <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <Card padding="none" className="overflow-hidden border-gray-200">
        <CardHeader className="border-b border-gray-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-[#7C3AED]" />
            <CardTitle>Packages</CardTitle>
          </div>
          <Badge variant="gray">{bundles.filter((b) => b.isActive).length} active</Badge>
        </CardHeader>

        <div className="p-5 space-y-3">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading...
            </div>
          ) : bundles.length === 0 ? (
            <p className="text-sm text-gray-500">No packages configured.</p>
          ) : (
            bundles.map((b) => {
              const d = drafts[b.code] ?? { price: '0', credit: '0' }
              const price = Number(d.price) || 0
              const credit = Number(d.credit) || 0
              const cap = uniformMarkup ? credit / uniformMarkup : null
              const profit = cap !== null ? price - cap : null
              const dirty = price !== b.priceBdt || credit !== b.creditBdt

              return (
                <div
                  key={b.code}
                  className={`rounded-xl border p-4 ${b.isActive ? 'border-gray-200' : 'border-gray-200 bg-gray-50 opacity-70'}`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                    <div>
                      <p className="text-sm font-bold text-gray-900">
                        {b.nameEn} / {b.nameBn}{' '}
                        {!b.isActive && <span className="text-xs font-medium text-gray-400">(not for sale)</span>}
                      </p>
                      <p className="text-xs font-mono text-gray-500">{b.code}</p>
                    </div>
                    <button
                      onClick={() => toggle(b)}
                      disabled={saving === b.code}
                      className="text-xs font-semibold text-[#7C3AED] hover:underline disabled:opacity-50"
                    >
                      {b.isActive ? 'Stop selling' : 'Start selling'}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                    <Input
                      label="Customer pays (৳)"
                      type="number"
                      value={d.price}
                      onChange={(e) => setDrafts((s) => ({ ...s, [b.code]: { ...d, price: e.target.value } }))}
                    />
                    <Input
                      label="Wallet credit (৳)"
                      type="number"
                      value={d.credit}
                      onChange={(e) => setDrafts((s) => ({ ...s, [b.code]: { ...d, credit: e.target.value } }))}
                    />
                    <Button onClick={() => save(b)} loading={saving === b.code} disabled={saving !== null || !dirty}>
                      {saved[b.code] ? <Check className="h-4 w-4" /> : dirty ? 'Save' : 'Saved'}
                    </Button>
                  </div>

                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2 rounded-lg bg-gray-50 px-3 py-2.5 text-xs">
                    <span className="text-gray-600">
                      Max provider cost:{' '}
                      <strong className="text-gray-900">{cap !== null ? bdt(cap) : '—'}</strong>
                    </span>
                    <span className="text-gray-600">
                      Worst-case profit:{' '}
                      <strong className={profit !== null && profit > 0 ? 'text-[#059669]' : 'text-red-600'}>
                        {profit !== null ? bdt(profit) : '—'}
                      </strong>
                    </span>
                    <span className="text-gray-600">
                      Bonus to customer: <strong className="text-[#7C3AED]">{bdt(credit - price)}</strong>
                    </span>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </Card>

      <p className="text-center text-xs text-gray-400">
        Worst-case profit assumes the customer spends every taka of credit. Most will not,
        so realised margin is normally higher.
      </p>
    </div>
  )
}
