'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { AlertTriangle, Clock, Loader2, Send, Sparkles, Wallet } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input, Textarea } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

// Metered, wallet-based chat against real provider models (OpenAI/Anthropic/
// Google), proxied server-side via /api/ai-subscriptions/*. Intentionally
// built from scratch, structurally inspired by (but sharing no code or
// runtime path with) the free BhaiFreakin AI feature — this never touches
// window.puter.

interface AIModel {
  id: string
  provider: string
  displayName: string
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  ts: number
}

interface TopupRequest {
  id: string
  requested_amount_bdt: number
  note: string | null
  status: string
  created_at: string
}

function formatBDT(value: number) {
  return `৳${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function AISubscriptionsShell() {
  const [balance, setBalance] = useState<number | null>(null)
  const [lowBalanceThreshold, setLowBalanceThreshold] = useState<number>(50)
  const [walletError, setWalletError] = useState(false)

  const [models, setModels] = useState<AIModel[]>([])
  const [modelId, setModelId] = useState<string>('')
  const [modelsError, setModelsError] = useState(false)

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [insufficientBalance, setInsufficientBalance] = useState(false)
  const [chatError, setChatError] = useState<string | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const topupSectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cancelled = false

    fetch('/api/ai-subscriptions/wallet')
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('failed'))))
      .then((json: { balance: number; lowBalanceThreshold: number }) => {
        if (cancelled) return
        setBalance(json.balance)
        setLowBalanceThreshold(json.lowBalanceThreshold)
      })
      .catch(() => {
        if (!cancelled) setWalletError(true)
      })

    fetch('/api/ai-subscriptions/models')
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('failed'))))
      .then((json: { models: AIModel[] }) => {
        if (cancelled) return
        const list = json.models ?? []
        setModels(list)
        if (list.length > 0) setModelId(list[0].id)
      })
      .catch(() => {
        if (!cancelled) setModelsError(true)
      })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, sending])

  const isLowBalance = balance !== null && balance <= lowBalanceThreshold

  async function handleSend() {
    const content = input.trim()
    if (!content || sending || !modelId) return

    setInsufficientBalance(false)
    setChatError(null)

    const nextMessages: Message[] = [...messages, { id: Date.now().toString(), role: 'user', content, ts: Date.now() }]
    setMessages(nextMessages)
    setInput('')
    setSending(true)

    try {
      const res = await fetch('/api/ai-subscriptions/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modelId,
          messages: nextMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      })

      const json = await res.json().catch(() => ({}))

      if (res.status === 402) {
        setInsufficientBalance(true)
        return
      }

      if (!res.ok) {
        throw new Error(json?.message ?? 'Something went wrong. Please try again.')
      }

      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: 'assistant', content: json.reply, ts: Date.now() },
      ])
      if (typeof json.balanceAfter === 'number') setBalance(json.balanceAfter)
    } catch (err) {
      setChatError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setSending(false)
    }
  }

  function scrollToTopup() {
    topupSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const groupedModels = useMemo(() => {
    const groups: Record<string, AIModel[]> = {}
    for (const m of models) {
      groups[m.provider] = groups[m.provider] ?? []
      groups[m.provider].push(m)
    }
    return groups
  }, [models])

  return (
    <div className="mx-auto max-w-[1100px] space-y-5 p-4 md:p-6">
      <div className="rounded-2xl bg-[#07101F] p-5 text-white md:p-7">
        <Badge variant="accent" dot>AI Subscriptions</Badge>
        <h1 className="mt-4 text-2xl font-black md:text-4xl">AI Subscriptions</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-white/65">
          Chat with real top-tier models (OpenAI, Anthropic, Google) billed at real token cost from your wallet balance.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="border-gray-200">
          <div className="flex items-center gap-2">
            <Wallet className="h-6 w-6 text-[#7C3AED]" />
            <p className="text-sm font-bold text-gray-600">Wallet Balance</p>
          </div>
          <p className="mt-3 text-2xl font-black text-gray-950">
            {walletError ? '—' : balance === null ? <Loader2 className="h-5 w-5 animate-spin text-gray-300" /> : formatBDT(balance)}
          </p>
          {walletError && <p className="mt-1 text-xs text-red-500">Could not load your wallet balance.</p>}
        </Card>
        <Card className="border-gray-200">
          <p className="text-sm font-bold text-gray-600">Model</p>
          {modelsError ? (
            <p className="mt-3 text-sm text-red-500">Could not load available models.</p>
          ) : models.length === 0 ? (
            <div className="mt-3 flex items-center gap-2 text-sm text-gray-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading models...
            </div>
          ) : (
            <select
              value={modelId}
              onChange={(e) => setModelId(e.target.value)}
              className="mt-3 w-full h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED]"
            >
              {Object.entries(groupedModels).map(([provider, list]) => (
                <optgroup key={provider} label={provider}>
                  {list.map((m) => (
                    <option key={m.id} value={m.id}>{m.displayName}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          )}
        </Card>
      </div>

      {isLowBalance && (
        <div className="flex flex-col items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-800 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            <span>Your balance is low — top up to keep chatting.</span>
          </div>
          <Button variant="outline" size="sm" onClick={scrollToTopup}>Top up now</Button>
        </div>
      )}

      <Card padding="none" className="overflow-hidden border-gray-200">
        <CardHeader className="border-b border-gray-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[#7C3AED]" />
            <CardTitle>Chat</CardTitle>
          </div>
        </CardHeader>

        <div className="flex flex-col">
          <div className="max-h-[480px] min-h-[240px] space-y-4 overflow-y-auto px-5 py-4">
            {messages.length === 0 && !sending && (
              <p className="text-center text-sm text-gray-400">
                Pick a model above and start chatting. Each reply is billed to your wallet at real token cost.
              </p>
            )}

            {messages.map((msg) => (
              <div key={msg.id} className={cn('flex gap-3', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                {msg.role === 'assistant' && (
                  <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-[#7C3AED]">
                    <Sparkles className="h-3.5 w-3.5 text-white" />
                  </div>
                )}
                <div
                  className={cn(
                    'max-w-[78%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed',
                    msg.role === 'user'
                      ? 'rounded-tr-sm bg-[#7C3AED] text-white'
                      : 'rounded-tl-sm border border-gray-200 bg-white text-gray-800 shadow-sm'
                  )}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {sending && (
              <div className="flex justify-start gap-3">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-[#7C3AED]">
                  <Sparkles className="h-3.5 w-3.5 text-white" />
                </div>
                <div className="rounded-2xl rounded-tl-sm border border-gray-200 bg-white px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-1.5">
                    {[0, 1, 2].map((i) => (
                      <div key={i} className="h-2 w-2 animate-bounce rounded-full bg-[#7C3AED]" style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {insufficientBalance && (
              <div className="flex items-center justify-between gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-800">
                <span>Insufficient balance. Please top up before chatting.</span>
                <Button variant="outline" size="sm" onClick={scrollToTopup}>Top up</Button>
              </div>
            )}

            {chatError && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
                {chatError}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-gray-100 px-5 py-4">
            <div className="flex items-end gap-2 rounded-2xl border border-gray-200 bg-gray-50 px-3 py-2 transition-all focus-within:border-[#7C3AED] focus-within:ring-2 focus-within:ring-[#7C3AED]/10">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSend()
                  }
                }}
                placeholder={modelId ? 'Ask a question...' : 'Loading models...'}
                disabled={!modelId || sending}
                rows={1}
                className="min-h-[36px] max-h-32 flex-1 resize-none bg-transparent py-1.5 text-sm leading-relaxed text-gray-800 placeholder:text-gray-400 focus:outline-none disabled:opacity-50"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || sending || !modelId}
                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-[#7C3AED] transition-colors hover:bg-[#6D28D9] disabled:opacity-40"
                aria-label="Send message"
              >
                {sending ? <Loader2 className="h-4 w-4 animate-spin text-white" /> : <Send className="h-4 w-4 text-white" />}
              </button>
            </div>
            <p className="mt-2 text-center text-[10px] text-gray-400">
              Shift+Enter for a new line · Enter to send
            </p>
          </div>
        </div>
      </Card>

      <div ref={topupSectionRef}>
        <TopupRequestCard />
      </div>
    </div>
  )
}

function TopupRequestCard() {
  const [request, setRequest] = useState<TopupRequest | null>(null)
  const [loading, setLoading] = useState(true)
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch('/api/ai-subscriptions/topup-request')
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('failed'))))
      .then((json: { request: TopupRequest | null }) => {
        if (!cancelled) setRequest(json.request)
      })
      .catch(() => {
        if (!cancelled) setError('Could not load your top-up request status.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  async function submit() {
    const amountBdt = Number(amount)
    if (!amountBdt || amountBdt <= 0) {
      setError('Enter a valid amount.')
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/ai-subscriptions/topup-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amountBdt, note }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(json?.message ?? 'Could not submit top-up request.')
      }
      setRequest(json.request)
      setAmount('')
      setNote('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not submit top-up request.')
    } finally {
      setSubmitting(false)
    }
  }

  const isPending = request?.status === 'pending'

  return (
    <Card className="border-gray-200">
      <CardHeader className="mb-3">
        <div className="flex items-center gap-2">
          <Wallet className="h-5 w-5 text-[#7C3AED]" />
          <CardTitle>Request a Top-up</CardTitle>
        </div>
      </CardHeader>
      <p className="text-sm leading-6 text-gray-600">
        Submit an amount and our team will confirm and credit your wallet balance.
      </p>

      <div className="mt-4">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading request status...
          </div>
        ) : isPending && request ? (
          <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-800">
            <Clock className="h-4 w-4 flex-shrink-0" />
            <span>
              Request pending since {formatDateTime(request.created_at)} — your team will confirm and credit your
              balance shortly.
            </span>
          </div>
        ) : (
          <div className="space-y-3">
            <Input
              label="Amount (৳)"
              type="number"
              min={1}
              placeholder="e.g. 1000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <Textarea
              label="Note (optional)"
              placeholder="Anything the team should know..."
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
                {error}
              </div>
            )}
            <Button onClick={submit} loading={submitting} disabled={submitting}>
              Request Top-up
            </Button>
          </div>
        )}
      </div>
    </Card>
  )
}
