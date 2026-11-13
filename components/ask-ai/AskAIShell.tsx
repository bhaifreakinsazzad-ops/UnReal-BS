'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Sparkles, Loader2, RotateCcw, Copy, Check, Volume2, Square } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLocale } from '@/lib/i18n/context'
import { usePuterAI } from '@/hooks/usePuterAI'
import { brand } from '@/lib/brand'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  ts?: number
}

const QUICK_PROMPTS = {
  en: [
    { emoji: '📈', text: 'Give me practical ways to increase sales this week' },
    { emoji: '💬', text: 'Write a customer service script for a new lead' },
    { emoji: '📱', text: 'Create a WhatsApp marketing message' },
    { emoji: '🎯', text: 'Who should be my target customer?' },
    { emoji: '📋', text: 'Outline a simple business plan' },
    { emoji: '💰', text: 'Suggest a better pricing strategy' },
  ],
  bn: [
    { emoji: '📈', text: 'আমার ব্যবসার বিক্রয় বাড়ানোর উপায় বলুন' },
    { emoji: '💬', text: 'কাস্টমার সার্ভিস স্ক্রিপ্ট লিখে দিন' },
    { emoji: '📱', text: 'WhatsApp মার্কেটিং মেসেজ তৈরি করুন' },
    { emoji: '🎯', text: 'আমার টার্গেট কাস্টমার কারা হতে পারে?' },
    { emoji: '📋', text: 'একটি বিজনেস প্ল্যান আউটলাইন দিন' },
    { emoji: '💰', text: 'প্রাইসিং স্ট্র্যাটেজি কী হওয়া উচিত?' },
  ],
}

const SYSTEM_PROMPT = {
  en: `You are ${brand.aiAssistantName}, an AI business advisor for operators using ${brand.name}.
Answer in clear English by default. If the user writes in Bangla, answer in Bangla.
Keep advice practical, concise, and directly usable for SaaS agency delivery, marketing, sales, automation, customer service, pricing, and business operations.`,
  bn: `তুমি ${brand.aiAssistantName}, ${brand.name} ব্যবহারকারী অপারেটরদের AI বিজনেস অ্যাডভাইজার।
বাংলায় পরিষ্কার, সংক্ষিপ্ত এবং বাস্তবসম্মত উত্তর দাও। SaaS agency delivery, মার্কেটিং, সেলস, অটোমেশন, কাস্টমার সার্ভিস ও অপারেশনে ব্যবহারযোগ্য পরামর্শ দাও।`,
}

const welcome = {
  en: `I am ${brand.aiAssistantName}.\n\nAsk anything about agency delivery, marketing, sales, customer service, pricing, workflows, or business operations. I will keep the answer practical and execution-ready.`,
  bn: `আমি ${brand.aiAssistantName}।\n\nAgency delivery, মার্কেটিং, সেলস, কাস্টমার সার্ভিস, প্রাইসিং, ওয়ার্কফ্লো বা অপারেশন নিয়ে যেকোনো প্রশ্ন করুন। আমি ব্যবহারযোগ্য উত্তর দেব।`,
}

function formatTime(ts: number, locale: 'bn' | 'en') {
  return new Date(ts).toLocaleTimeString(locale === 'bn' ? 'bn-BD' : 'en-US', { hour: '2-digit', minute: '2-digit' })
}

// Server-side free-tier fallback (app/api/ask-ai/chat/route.ts) — used
// whenever Puter isn't ready or a Puter call fails, so the assistant is
// never fully blocked waiting on a client-side sign-in.
async function sendViaFallback(systemPrompt: string, history: Message[], content: string): Promise<string> {
  const messages = [
    { role: 'system' as const, content: systemPrompt },
    ...history.slice(-6).map(m => ({ role: m.role, content: m.content })),
    { role: 'user' as const, content },
  ]
  const res = await fetch('/api/ask-ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages }),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json?.message ?? 'Fallback request failed')
  return json.reply as string
}

export function AskAIShell() {
  const locale = useLocale()
  const isBn = locale === 'bn'
  const [messages, setMessages] = useState<Message[]>([
    { id: '0', role: 'assistant', content: welcome[locale] },
  ])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const [speakingId, setSpeakingId] = useState<string | null>(null)
  const [synthesizingId, setSynthesizingId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const { isReady, sendMessage } = usePuterAI()

  useEffect(() => {
    return () => {
      audioRef.current?.pause()
    }
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  async function handleSend(text?: string) {
    const content = (text ?? input).trim()
    if (!content || isTyping) return

    const historySnapshot = messages
    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', content, ts: Date.now() }])
    setInput('')
    setIsTyping(true)

    try {
      let reply: string
      if (isReady) {
        try {
          const history = historySnapshot
            .slice(-6)
            .map(m => `${m.role === 'user' ? 'User' : brand.aiAssistantName}: ${m.content}`)
            .join('\n')
          const prompt = history ? `${history}\nUser: ${content}` : content
          reply = await sendMessage(prompt, SYSTEM_PROMPT[locale])
        } catch {
          // Puter is loaded but the call itself failed — fall back to the
          // free server route rather than surfacing an error.
          reply = await sendViaFallback(SYSTEM_PROMPT[locale], historySnapshot, content)
        }
      } else {
        // Puter isn't ready yet — never block the user waiting for it.
        reply = await sendViaFallback(SYSTEM_PROMPT[locale], historySnapshot, content)
      }
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', content: reply, ts: Date.now() }])
    } catch {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: isBn ? 'দুঃখিত, সাময়িক সমস্যা হয়েছে। আবার চেষ্টা করুন।' : 'Sorry, something went wrong. Please try again.',
        ts: Date.now(),
      }])
    } finally {
      setIsTyping(false)
    }
  }

  function copyMessage(id: string, content: string) {
    navigator.clipboard.writeText(content)
    setCopied(id)
    setTimeout(() => setCopied(null), 1500)
  }

  async function speakMessage(id: string, content: string) {
    // Clicking again while this message is playing/loading stops it.
    if (speakingId === id || synthesizingId === id) {
      audioRef.current?.pause()
      audioRef.current = null
      setSpeakingId(null)
      setSynthesizingId(null)
      return
    }

    // Switching to a different message stops whatever was playing.
    audioRef.current?.pause()
    audioRef.current = null
    setSpeakingId(null)

    if (!window.puter?.ai) return
    setSynthesizingId(id)
    try {
      const audio = await window.puter.ai.txt2speech(content)
      audioRef.current = audio
      setSynthesizingId(null)
      setSpeakingId(id)
      audio.onended = () => {
        setSpeakingId(null)
        audioRef.current = null
      }
      await audio.play()
    } catch {
      setSynthesizingId(null)
      setSpeakingId(null)
    }
  }

  function clearChat() {
    setMessages([{ id: '0', role: 'assistant', content: welcome[locale], ts: Date.now() }])
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-gray-50">
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl gradient-ai flex items-center justify-center bhaifreakin-glow">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="font-bold text-gray-900 text-sm">{brand.aiAssistantName}</p>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00C875] animate-pulse" />
              <span className="text-xs text-gray-400">{isReady ? (isBn ? 'প্রস্তুত' : 'Ready') : (isBn ? 'ফ্রি মোড' : 'Free mode')}</span>
            </div>
          </div>
        </div>
        <button onClick={clearChat} className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors" title={isBn ? 'চ্যাট পরিষ্কার করুন' : 'Clear chat'}>
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map(msg => (
          <div key={msg.id} className={cn('flex gap-3', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-xl gradient-ai flex items-center justify-center flex-shrink-0 mt-0.5">
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </div>
            )}
            <div className="max-w-[78%] group">
              <div className={cn('px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap', msg.role === 'user' ? 'bg-[#7C3AED] text-white rounded-tr-sm' : 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm shadow-sm')}>
                {msg.content}
              </div>
              <div className={cn('flex items-center gap-2 mt-1', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                {msg.ts != null && <span className="text-[10px] text-gray-400">{formatTime(msg.ts, locale)}</span>}
                {msg.role === 'assistant' && (
                  <>
                    <button onClick={() => copyMessage(msg.id, msg.content)} className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded text-gray-400 hover:text-gray-600" aria-label="Copy response">
                      {copied === msg.id ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                    </button>
                    <button
                      onClick={() => speakMessage(msg.id, msg.content)}
                      className={cn(
                        'transition-opacity p-0.5 rounded text-gray-400 hover:text-gray-600',
                        speakingId === msg.id || synthesizingId === msg.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                      )}
                      aria-label={speakingId === msg.id ? 'Stop reading aloud' : 'Read aloud'}
                    >
                      {synthesizingId === msg.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : speakingId === msg.id ? (
                        <Square className="w-3 h-3 text-[#7C3AED]" />
                      ) : (
                        <Volume2 className="w-3 h-3" />
                      )}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-xl gradient-ai flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="bg-white border border-gray-200 shadow-sm px-4 py-3 rounded-2xl rounded-tl-sm">
              <div className="flex gap-1.5 items-center">
                {[0, 1, 2].map(i => <div key={i} className="w-2 h-2 bg-[#7C3AED] rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}
                <span className="text-xs text-gray-400 ml-1">{isBn ? 'লিখছি...' : 'Writing...'}</span>
              </div>
            </div>
          </div>
        )}

        {messages.length === 1 && !isTyping && (
          <div className="pt-2">
            <p className="text-xs text-gray-400 text-center mb-3">{isBn ? 'দ্রুত শুরু করুন' : 'Quick start'}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {QUICK_PROMPTS[locale].map(p => (
                <button key={p.text} onClick={() => handleSend(p.text)} className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-xl text-left text-sm text-gray-700 hover:border-[#7C3AED]/40 hover:bg-[#EDE9FE]/20 transition-colors group">
                  <span className="text-lg flex-shrink-0">{p.emoji}</span>
                  <span className="leading-snug text-xs">{p.text}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="px-4 py-3 bg-white border-t border-gray-200 flex-shrink-0">
        <div className="flex items-end gap-2 bg-gray-50 border border-gray-200 rounded-2xl px-3 py-2 focus-within:border-[#7C3AED] focus-within:ring-2 focus-within:ring-[#7C3AED]/10 transition-all">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
            placeholder={isBn ? 'UnReal AI-কে জিজ্ঞেস করুন...' : `Ask ${brand.aiAssistantName}...`}
            rows={1}
            className="flex-1 bg-transparent text-sm text-gray-800 placeholder:text-gray-400 resize-none focus:outline-none min-h-[36px] max-h-32 py-1.5 leading-relaxed disabled:opacity-50"
          />
          <button onClick={() => handleSend()} disabled={!input.trim() || isTyping} className="w-9 h-9 rounded-xl bg-[#7C3AED] flex items-center justify-center hover:bg-[#6D28D9] disabled:opacity-40 transition-colors flex-shrink-0" aria-label="Send message">
            {isTyping ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Send className="w-4 h-4 text-white" />}
          </button>
        </div>
        <p className="text-[10px] text-gray-400 text-center mt-2">
          {isBn ? 'Shift+Enter নতুন লাইন · Enter পাঠান' : 'Shift+Enter for a new line · Enter to send'}
        </p>
      </div>
    </div>
  )
}
