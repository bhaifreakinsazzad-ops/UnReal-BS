'use client'

import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, Check, Loader2, Plus, Sparkles } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface Rate {
  id: string
  provider: string
  modelId: string
  displayName: string
  inputRateBdtPer1k: number
  outputRateBdtPer1k: number
  markupMultiplier: number
  isActive: boolean
}

type Draft = {
  inputRateBdtPer1k: string
  outputRateBdtPer1k: string
  markupMultiplier: string
}

// A "typical" short business question and reply, used to translate
// per-million-token rates into a number a shop owner would recognise.
const TYPICAL_INPUT_TOKENS = 600
const TYPICAL_OUTPUT_TOKENS = 350

function bdt(n: number, dp = 2) {
  return `৳${n.toLocaleString('en-US', { minimumFractionDigits: dp, maximumFractionDigits: dp })}`
}

export function AdminAIRatesShell() {
  const [rates, setRates] = useState<Rate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [drafts, setDrafts] = useState<Record<string, Draft>>({})
  const [saving, setSaving] = useState<string | null>(null)
  const [saved, setSaved] = useState<Record<string, boolean>>({})
  const [showAdd, setShowAdd] = useState(false)
  const [adding, setAdding] = useState(false)
  const [newRow, setNewRow] = useState({
    provider: '', modelId: '', displayName: '', inputRateBdtPer1k: '', outputRateBdtPer1k: '', markupMultiplier: '1.3',
  })

  function hydrate(list: Rate[]) {
    setRates(list)
    setDrafts(Object.fromEntries(list.map((r) => [r.id, {
      inputRateBdtPer1k: String(r.inputRateBdtPer1k),
      outputRateBdtPer1k: String(r.outputRateBdtPer1k),
      markupMultiplier: String(r.markupMultiplier),
    }])))
  }

  useEffect(() => {
    fetch('/api/admin/ai-rates')
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('failed'))))
      .then((json: { rates: Rate[] }) => hydrate(json.rates ?? []))
      .catch(() => setError('Could not load the rate card.'))
      .finally(() => setLoading(false))
  }, [])

  async function save(r: Rate) {
    const d = drafts[r.id]
    const payload = {
      id: r.id,
      inputRateBdtPer1k: Number(d.inputRateBdtPer1k),
      outputRateBdtPer1k: Number(d.outputRateBdtPer1k),
      markupMultiplier: Number(d.markupMultiplier),
    }
    if ([payload.inputRateBdtPer1k, payload.outputRateBdtPer1k, payload.markupMultiplier].some((v) => Number.isNaN(v))) {
      setError('Please enter valid numbers.')
      return
    }

    setSaving(r.id)
    setError(null)
    try {
      const res = await fetch('/api/admin/ai-rates', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json?.message ?? 'Could not update this rate.')

      setRates((prev) => prev.map((x) => (x.id === r.id ? { ...x, ...payload } : x)))
      setSaved((s) => ({ ...s, [r.id]: true }))
      setTimeout(() => setSaved((s) => ({ ...s, [r.id]: false })), 2500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update this rate.')
    } finally {
      setSaving(null)
    }
  }

  async function toggleActive(r: Rate) {
    setSaving(r.id)
    try {
      const res = await fetch('/api/admin/ai-rates', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: r.id, isActive: !r.isActive }),
      })
      if (!res.ok) throw new Error('failed')
      setRates((prev) => prev.map((x) => (x.id === r.id ? { ...x, isActive: !x.isActive } : x)))
    } catch {
      setError('Could not change availability.')
    } finally {
      setSaving(null)
    }
  }

  async function addModel() {
    setAdding(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/ai-rates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: newRow.provider.trim(),
          modelId: newRow.modelId.trim(),
          displayName: newRow.displayName.trim(),
          inputRateBdtPer1k: Number(newRow.inputRateBdtPer1k),
          outputRateBdtPer1k: Number(newRow.outputRateBdtPer1k),
          markupMultiplier: Number(newRow.markupMultiplier),
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json?.message ?? 'Could not add this model.')

      const listRes = await fetch('/api/admin/ai-rates')
      const listJson = (await listRes.json()) as { rates: Rate[] }
      hydrate(listJson.rates ?? [])
      setShowAdd(false)
      setNewRow({ provider: '', modelId: '', displayName: '', inputRateBdtPer1k: '', outputRateBdtPer1k: '', markupMultiplier: '1.3' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add this model.')
    } finally {
      setAdding(false)
    }
  }

  const activeCount = useMemo(() => rates.filter((r) => r.isActive).length, [rates])

  return (
    <div className="mx-auto max-w-[1100px] space-y-5 p-4 md:p-6">
      <div className="rounded-2xl bg-[#07101F] p-5 text-white md:p-7">
        <Badge variant="accent" dot>Admin</Badge>
        <h1 className="mt-4 text-2xl font-black md:text-4xl">AI Rate Card</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-white/65">
          What you charge customers for metered AI. Rates are in BDT per 1,000 tokens and
          are multiplied by the markup at charge time. Provider prices change without
          notice — review this whenever they do.
        </p>
      </div>

      <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-800">
        <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
        <span>
          These are <strong>sell</strong> prices, not provider cost. Enter your true cost per
          1k tokens in the rate fields and use the markup for margin, so the multiple you see
          below is the real one. The values seeded at launch were explicitly marked
          &quot;NOT VERIFIED CURRENT PRICING&quot; — confirm them against each provider&apos;s
          pricing page before relying on them.
        </span>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-600">
          <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <Card padding="none" className="overflow-hidden border-gray-200">
        <CardHeader className="border-b border-gray-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[#7C3AED]" />
            <CardTitle>Models</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="gray">{activeCount} active / {rates.length}</Badge>
            <Button variant="outline" size="sm" onClick={() => setShowAdd((v) => !v)}>
              <Plus className="mr-1 h-3.5 w-3.5" />
              Add model
            </Button>
          </div>
        </CardHeader>

        <div className="p-5 space-y-3">
          {showAdd && (
            <div className="rounded-xl border border-[#7C3AED]/30 bg-[#F5F3FF] p-4 space-y-3">
              <p className="text-sm font-bold text-gray-900">Add a model to the rate card</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Input label="Provider" placeholder="openai" value={newRow.provider} onChange={(e) => setNewRow({ ...newRow, provider: e.target.value })} />
                <Input label="Model id" placeholder="gpt-4o-mini" value={newRow.modelId} onChange={(e) => setNewRow({ ...newRow, modelId: e.target.value })} />
                <Input label="Display name" placeholder="GPT-4o mini" value={newRow.displayName} onChange={(e) => setNewRow({ ...newRow, displayName: e.target.value })} />
                <Input label="Input ৳/1k" type="number" step="0.000001" value={newRow.inputRateBdtPer1k} onChange={(e) => setNewRow({ ...newRow, inputRateBdtPer1k: e.target.value })} />
                <Input label="Output ৳/1k" type="number" step="0.000001" value={newRow.outputRateBdtPer1k} onChange={(e) => setNewRow({ ...newRow, outputRateBdtPer1k: e.target.value })} />
                <Input label="Markup ×" type="number" step="0.01" value={newRow.markupMultiplier} onChange={(e) => setNewRow({ ...newRow, markupMultiplier: e.target.value })} />
              </div>
              <div className="flex gap-2">
                <Button onClick={addModel} loading={adding} disabled={adding}>Add to rate card</Button>
                <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
              </div>
              <p className="text-[11px] text-gray-500">
                The model id must be exactly what the provider&apos;s API expects — the chat
                route looks it up by that string.
              </p>
            </div>
          )}

          {loading ? (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading...
            </div>
          ) : rates.length === 0 ? (
            <p className="text-sm text-gray-500">No models on the rate card yet.</p>
          ) : (
            rates.map((r) => {
              const d = drafts[r.id] ?? { inputRateBdtPer1k: '0', outputRateBdtPer1k: '0', markupMultiplier: '1' }
              const inRate = Number(d.inputRateBdtPer1k) || 0
              const outRate = Number(d.outputRateBdtPer1k) || 0
              const mult = Number(d.markupMultiplier) || 1

              // What the customer actually pays, per million, after markup.
              const inPerM = inRate * 1000 * mult
              const outPerM = outRate * 1000 * mult
              const typical =
                (TYPICAL_INPUT_TOKENS / 1000) * inRate * mult + (TYPICAL_OUTPUT_TOKENS / 1000) * outRate * mult

              const dirty =
                inRate !== r.inputRateBdtPer1k || outRate !== r.outputRateBdtPer1k || mult !== r.markupMultiplier

              return (
                <div
                  key={r.id}
                  className={`rounded-xl border p-4 ${r.isActive ? 'border-gray-200' : 'border-gray-200 bg-gray-50 opacity-70'}`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-gray-900">
                        {r.displayName}{' '}
                        {!r.isActive && <span className="text-xs font-medium text-gray-400">(hidden from customers)</span>}
                      </p>
                      <p className="text-xs text-gray-500 font-mono">{r.provider} · {r.modelId}</p>
                    </div>
                    <button
                      onClick={() => toggleActive(r)}
                      disabled={saving === r.id}
                      className="text-xs font-semibold text-[#7C3AED] hover:underline disabled:opacity-50"
                    >
                      {r.isActive ? 'Hide from customers' : 'Make available'}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                    <Input
                      label="Input ৳/1k"
                      type="number"
                      step="0.000001"
                      value={d.inputRateBdtPer1k}
                      onChange={(e) => setDrafts((s) => ({ ...s, [r.id]: { ...d, inputRateBdtPer1k: e.target.value } }))}
                    />
                    <Input
                      label="Output ৳/1k"
                      type="number"
                      step="0.000001"
                      value={d.outputRateBdtPer1k}
                      onChange={(e) => setDrafts((s) => ({ ...s, [r.id]: { ...d, outputRateBdtPer1k: e.target.value } }))}
                    />
                    <Input
                      label="Markup ×"
                      type="number"
                      step="0.01"
                      value={d.markupMultiplier}
                      onChange={(e) => setDrafts((s) => ({ ...s, [r.id]: { ...d, markupMultiplier: e.target.value } }))}
                    />
                    <Button onClick={() => save(r)} loading={saving === r.id} disabled={saving !== null || !dirty}>
                      {saved[r.id] ? <Check className="h-4 w-4" /> : dirty ? 'Save' : 'Saved'}
                    </Button>
                  </div>

                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2 rounded-lg bg-gray-50 px-3 py-2.5 text-xs">
                    <span className="text-gray-600">
                      Customer pays in: <strong className="text-gray-900">{bdt(inPerM, 2)}</strong> / 1M
                    </span>
                    <span className="text-gray-600">
                      Customer pays out: <strong className="text-gray-900">{bdt(outPerM, 2)}</strong> / 1M
                    </span>
                    <span className="text-gray-600">
                      Typical chat ≈ <strong className="text-[#7C3AED]">{bdt(typical, 3)}</strong>
                    </span>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </Card>

      <p className="text-xs text-gray-400 text-center">
        &quot;Typical chat&quot; assumes ~{TYPICAL_INPUT_TOKENS} input and ~{TYPICAL_OUTPUT_TOKENS} output
        tokens. Replies are capped at 1,024 output tokens per message.
      </p>
    </div>
  )
}
