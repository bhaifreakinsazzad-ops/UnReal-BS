'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { AlertTriangle, Loader2, Send, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { WalletBalanceChip } from '@/components/wallet/WalletBalanceChip'
import { DepositRequestCard } from '@/components/wallet/DepositRequestCard'

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

export function AISubscriptionsShell() {
  const [balance, setBalance] = useState<number | null>(null)
  const [lowBalanceThreshold, setLowBalanceThreshold] = useState<number>(50)

  const [models, setModels] = useState<AIModel[]>([])
  const [modelId, setModelId] = useState<string>('')
  const [modelsError, setModelsError] = useState(false)

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [insufficientBalance, setInsufficientBalance] = useState(false)
  const [chatError, setChatError] = useState<string | null>(null)

  const [searchAvailable, setSearchAvailable] = useState(false)
  const [useSearch, setUseSearch] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const topupSectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cancelled = false

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

    fetch('/api/ai-subscriptions/capabilities')
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('failed'))))
      .then((json: { searchAvailable: boolean }) => {
        if (!cancelled) setSearchAvailable(Boolean(json.searchAvailable))
      })
      .catch(() => {
        // Silent — the toggle just stays hidden if capabilities can't load.
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
          useSearch,
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
        <WalletBalanceChip
          onLoad={(w) => {
            setBalance(w.balance)
            setLowBalanceThreshold(w.lowBalanceThreshold)
          }}
        />
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
            {searchAvailable && (
              <label className="mb-2 flex w-fit cursor-pointer items-center gap-2 text-xs font-medium text-gray-600">
                <input
                  type="checkbox"
                  checked={useSearch}
                  onChange={(e) => setUseSearch(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-gray-300 text-[#7C3AED] focus:ring-[#7C3AED]/30"
                />
                🔍 Search the web for this
              </label>
            )}
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
        <DepositRequestCard />
      </div>
    </div>
  )
}

