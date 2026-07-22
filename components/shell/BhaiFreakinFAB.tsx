'use client'

import { useState, useRef, useEffect } from 'react'
import { X, Send, Sparkles, MessageCircle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { usePuterAI } from '@/hooks/usePuterAI'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}

const SYSTEM_PROMPT = `আপনি BhaiFreakin, বাংলাদেশী উদ্যোক্তাদের জন্য একজন AI ব্যবসায়িক সহকারী।
আপনি "Whole 9 Yards of Holdings" নামক ঢাকাস্থ ব্যবসার জন্য কাজ করছেন।
সর্বদা বাংলায় উত্তর দিন। সংক্ষিপ্ত ও কার্যকর উত্তর দিন।
ব্যবসায়িক প্রশ্নের উত্তর দিন, মার্কেটিং পরামর্শ দিন, বিক্রয় কৌশল শেখান।`

const WELCOME = 'আসসালামুয়ালাইকুম! আমি BhaiFreakin 🚀 আপনার ব্যবসাকে এগিয়ে নিতে আমি সবসময় আছি। আজকে কিভাবে সাহায্য করতে পারি?'

const QUICK_PROMPTS = ['আজকের লিড দেখান', 'ওয়ার্কফ্লো টিপস দিন', 'মার্কেটিং পরামর্শ', 'বিক্রয় কৌশল']

export function BhaiFreakinFAB() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    { id: '0', role: 'assistant', content: WELCOME },
  ])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { isReady, sendMessage } = usePuterAI()

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  async function handleSend(content: string) {
    if (!content.trim() || isTyping) return
    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', content }])
    setInput('')
    setIsTyping(true)

    try {
      const reply = await sendMessage(content, SYSTEM_PROMPT)
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', content: reply }])
    } catch {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'দুঃখিত, এই মুহূর্তে সংযোগ সমস্যা হচ্ছে। একটু পরে আবার চেষ্টা করুন।',
      }])
    } finally {
      setIsTyping(false)
    }
  }

  return (
    <>
      {open && (
        <div
          className="fixed bottom-20 right-4 md:bottom-6 md:right-6 w-[calc(100vw-32px)] max-w-sm bg-white rounded-2xl shadow-xl border border-gray-100 z-50 flex flex-col overflow-hidden"
          style={{ height: '480px' }}
        >
          <div className="gradient-primary px-4 py-3.5 flex items-center gap-3 flex-shrink-0">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center bhaifreaking-glow">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-sm leading-none">BhaiFreakin</p>
              <p className="text-purple-200 text-xs mt-0.5">
                {isReady ? 'AI বিজনেস অ্যাসিস্ট্যান্ট • অনলাইন' : 'লোড হচ্ছে...'}
              </p>
            </div>
            <button onClick={() => setOpen(false)} className="ml-auto text-white/70 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map(msg => (
              <div key={msg.id} className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                {msg.role === 'assistant' && (
                  <div className="w-6 h-6 rounded-full gradient-primary flex items-center justify-center mr-2 mt-1 flex-shrink-0">
                    <Sparkles className="w-3 h-3 text-white" />
                  </div>
                )}
                <div className={cn(
                  'max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap',
                  msg.role === 'user'
                    ? 'bg-[#7C3AED] text-white rounded-tr-sm'
                    : 'bg-gray-100 text-gray-800 rounded-tl-sm'
                )}>
                  {msg.content}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 rounded-full gradient-primary flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-3 h-3 text-white" />
                </div>
                <div className="bg-gray-100 px-4 py-3 rounded-2xl rounded-tl-sm">
                  <div className="flex gap-1">
                    {[0, 1, 2].map(i => (
                      <div key={i} className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {messages.length <= 1 && (
            <div className="px-4 pb-2 flex gap-2 overflow-x-auto flex-shrink-0">
              {QUICK_PROMPTS.map(p => (
                <button key={p} onClick={() => handleSend(p)}
                  className="flex-shrink-0 px-3 py-1.5 text-xs font-medium text-[#7C3AED] bg-[#EDE9FE] rounded-full hover:bg-[#DDD6FE] whitespace-nowrap">
                  {p}
                </button>
              ))}
            </div>
          )}

          <div className="px-4 pb-4 pt-2 flex-shrink-0 border-t border-gray-100">
            <form onSubmit={e => { e.preventDefault(); handleSend(input) }}
              className="flex items-center gap-2 bg-gray-50 rounded-xl border border-gray-200 px-3 py-2">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="কিছু জিজ্ঞেস করুন..."
                disabled={!isReady}
                className="flex-1 bg-transparent text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none disabled:opacity-50"
              />
              <button type="submit" disabled={!input.trim() || isTyping || !isReady}
                className="w-8 h-8 rounded-lg bg-[#7C3AED] text-white flex items-center justify-center disabled:opacity-40 hover:bg-[#6D28D9] flex-shrink-0">
                {isTyping ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              </button>
            </form>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen(!open)}
        className={cn(
          'fixed bottom-20 right-4 md:bottom-6 md:right-6 w-14 h-14 rounded-2xl gradient-primary shadow-lg z-50',
          'flex items-center justify-center transition-all duration-200',
          'hover:shadow-xl hover:scale-105 active:scale-95 bhaifreaking-glow',
          open && 'hidden'
        )}
        aria-label="Open BhaiFreakin AI"
      >
        <MessageCircle className="w-6 h-6 text-white" />
        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[#00C875] rounded-full border-2 border-white pulse-dot" />
      </button>
    </>
  )
}
