'use client'

import { useState, useRef, useEffect } from 'react'
import { Plus, Play, Pause, Settings, Sparkles, Download, Lock, X, Send, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { usePuterAI } from '@/hooks/usePuterAI'

const tabs = [
  { value: 'my', label: 'আমার এজেন্ট' },
  { value: 'readymade', label: 'রেডিমেড' },
  { value: 'marketplace', label: 'মার্কেটপ্লেস', comingSoon: true },
]

const myAgents = [
  { id: '1', name: 'ফলো-আপ বট', desc: 'নতুন লিডদের ৩ দিন পর স্বয়ংক্রিয়ভাবে WhatsApp ফলো-আপ করে।', status: 'active', icon: '🤖', runs: '৪৭' },
  { id: '2', name: 'অ্যাপয়েন্টমেন্ট সেটার', desc: 'আগ্রহী লিডদের জন্য মিটিং বুক করে।', status: 'paused', icon: '📅', runs: '১২' },
]

const readymadeAgents = [
  { id: 'r1', name: 'লিড কোয়ালিফায়ার', desc: 'নতুন লিড আসলে প্রশ্ন করে যোগ্যতা যাচাই করে।', icon: '🎯', installs: '২৩৪' },
  { id: 'r2', name: 'রিভিউ কালেক্টর', desc: 'সফল সেবার পর গ্রাহকদের রিভিউ চায়।', icon: '⭐', installs: '১৫৬' },
  { id: 'r3', name: 'কার্ট রিকভারি', desc: 'পেমেন্ট অসম্পূর্ণ থাকলে রিমাইন্ডার পাঠায়।', icon: '🛒', installs: '৮৯' },
]

const SYSTEM_PROMPT = `আপনি BhaiFreakin, বাংলাদেশের শীর্ষ AI ব্যবসায়িক সহকারী।
আপনি UnReal BS প্ল্যাটফর্মে কাজ করছেন। সর্বদা বাংলায় উত্তর দিন।
ব্যবসার প্রতিটি দিকে সাহায্য করুন: মার্কেটিং, বিক্রয়, অটোমেশন, কাস্টমার সার্ভিস।
গভীর বিশ্লেষণ ও ব্যবহারিক পরামর্শ দিন।`

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
}

function BhaiFreakinOverlay({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '0',
      role: 'assistant',
      content: 'আসসালামুয়ালাইকুম! আমি BhaiFreakin — আপনার ফ্ল্যাগশিপ AI বিজনেস এজেন্ট 🚀\n\nআমি আপনার ব্যবসার যেকোনো বিষয়ে সাহায্য করতে পারি। মার্কেটিং কৌশল, বিক্রয় বাড়ানো, অটোমেশন — যা চান জিজ্ঞেস করুন!',
    },
  ])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)
  const { isReady, sendMessage } = usePuterAI()

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
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
        content: 'দুঃখিত, সাময়িক সমস্যা হচ্ছে। একটু পরে আবার চেষ্টা করুন।',
      }])
    } finally {
      setIsTyping(false)
    }
  }

  const quickPrompts = [
    'আমার বিক্রয় বাড়াতে ৫টি কৌশল দিন',
    'WhatsApp মার্কেটিং কিভাবে করব?',
    'নতুন কাস্টমার পেতে কী করব?',
    'অটোমেশন ওয়ার্কফ্লো পরিকল্পনা করুন',
  ]

  return (
    <div className="fixed inset-0 z-50 bg-[#0D0D1A]/95 backdrop-blur-sm flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-4 px-6 py-4 border-b border-white/10 flex-shrink-0">
        <div className="relative">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#7C3AED] to-[#4C1D95] flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#00C875] border-2 border-[#0D0D1A] flex items-center justify-center">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
          </span>
        </div>
        <div>
          <h2 className="text-white font-bold text-lg leading-none">BhaiFreakin</h2>
          <p className="text-purple-300 text-xs mt-0.5">
            {isReady ? '● অনলাইন — AI সংযুক্ত' : '⏳ লোড হচ্ছে...'}
          </p>
        </div>
        <button
          onClick={onClose}
          className="ml-auto p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 max-w-3xl mx-auto w-full">
        {messages.map(msg => (
          <div key={msg.id} className={cn('flex gap-3', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#4C1D95] flex items-center justify-center flex-shrink-0 mt-1">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
            )}
            <div className={cn(
              'max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap',
              msg.role === 'user'
                ? 'bg-[#7C3AED] text-white rounded-tr-sm'
                : 'bg-white/10 text-gray-200 rounded-tl-sm border border-white/10'
            )}>
              {msg.content}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#4C1D95] flex items-center justify-center flex-shrink-0 mt-1">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div className="bg-white/10 border border-white/10 px-4 py-3 rounded-2xl rounded-tl-sm">
              <div className="flex gap-1">
                {[0, 1, 2].map(i => (
                  <div key={i} className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Quick prompts */}
      {messages.length <= 1 && (
        <div className="px-6 pb-3 flex gap-2 overflow-x-auto flex-shrink-0 max-w-3xl mx-auto w-full">
          {quickPrompts.map(p => (
            <button key={p} onClick={() => handleSend(p)}
              className="flex-shrink-0 px-4 py-2 text-sm font-medium text-[#A78BFA] bg-[#7C3AED]/20 border border-[#7C3AED]/30 rounded-xl hover:bg-[#7C3AED]/30 whitespace-nowrap">
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="px-6 py-4 border-t border-white/10 flex-shrink-0 max-w-3xl mx-auto w-full">
        <form onSubmit={e => { e.preventDefault(); handleSend(input) }}
          className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-3">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={isReady ? 'আপনার প্রশ্ন লিখুন...' : 'AI লোড হচ্ছে...'}
            disabled={!isReady}
            className="flex-1 bg-transparent text-sm text-white placeholder:text-gray-600 focus:outline-none disabled:opacity-50"
          />
          <button type="submit" disabled={!input.trim() || isTyping || !isReady}
            className="w-10 h-10 rounded-xl bg-[#7C3AED] text-white flex items-center justify-center hover:bg-[#6D28D9] disabled:opacity-40 flex-shrink-0">
            {isTyping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </form>
      </div>
    </div>
  )
}

export function AgenticHQ() {
  const [activeTab, setActiveTab] = useState('my')
  const [showBhaiFreakin, setShowBhaiFreakin] = useState(false)

  return (
    <>
      {showBhaiFreakin && <BhaiFreakinOverlay onClose={() => setShowBhaiFreakin(false)} />}

      <div className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">এজেন্টিক HQ</h1>
            <p className="text-sm text-gray-500 mt-0.5">আপনার AI এজেন্টগুলো পরিচালনা করুন</p>
          </div>
          <button className="flex items-center gap-1.5 px-3 py-2 bg-[#7C3AED] text-white text-sm font-medium rounded-lg hover:bg-[#6D28D9] transition-colors">
            <Plus className="w-4 h-4" />
            নতুন এজেন্ট
          </button>
        </div>

        {/* BhaiFreakin Flagship Card */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#7C3AED] via-[#6D28D9] to-[#4C1D95] p-5 md:p-6">
          <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-[#00C875]/10 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-white/5 blur-2xl" />
          <div className="relative flex items-center gap-4">
            <div className="relative flex-shrink-0">
              <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#00C875] border-2 border-[#7C3AED] flex items-center justify-center">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-white font-bold text-lg">BhaiFreakin</h2>
                <span className="px-2 py-0.5 bg-[#00C875]/20 border border-[#00C875]/40 rounded-full text-[#00C875] text-[11px] font-bold">
                  ফ্ল্যাগশিপ 🚀
                </span>
              </div>
              <p className="text-purple-200 text-sm leading-relaxed">
                আপনার ব্যক্তিগত ব্যবসায়িক সহকারী — বিপণন থেকে বিক্রয় পর্যন্ত সব কাজে সাহায্য করে।
              </p>
            </div>
            <button
              onClick={() => setShowBhaiFreakin(true)}
              className="flex-shrink-0 px-4 py-2.5 bg-white text-[#7C3AED] text-sm font-bold rounded-xl hover:bg-purple-50 transition-colors"
            >
              চালু করুন
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
          {tabs.map(tab => (
            <button
              key={tab.value}
              onClick={() => !tab.comingSoon && setActiveTab(tab.value)}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium rounded-lg transition-colors',
                activeTab === tab.value ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700',
                tab.comingSoon && 'opacity-60 cursor-not-allowed'
              )}
            >
              {tab.label}
              {tab.comingSoon && <Lock className="w-3 h-3" />}
            </button>
          ))}
        </div>

        {activeTab === 'my' && (
          <div className="space-y-3">
            {myAgents.map(agent => (
              <div key={agent.id} className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-200 hover:border-[#7C3AED]/30 transition-colors">
                <div className="w-11 h-11 rounded-xl bg-[#EDE9FE] flex items-center justify-center text-2xl flex-shrink-0">{agent.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-semibold text-gray-900">{agent.name}</p>
                    <span className={cn('px-2 py-0.5 text-[11px] font-medium rounded-full',
                      agent.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    )}>
                      {agent.status === 'active' ? '● চলছে' : '⏸ বিরতি'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 truncate">{agent.desc}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-gray-400">চালু হয়েছে</p>
                  <p className="text-sm font-bold text-gray-700">{agent.runs}বার</p>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button className="p-2 rounded-lg text-gray-400 hover:bg-gray-100">
                    {agent.status === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>
                  <button className="p-2 rounded-lg text-gray-400 hover:bg-gray-100"><Settings className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'readymade' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {readymadeAgents.map(agent => (
              <div key={agent.id} className="p-4 bg-white rounded-xl border border-gray-200 hover:border-[#7C3AED]/30 transition-colors">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-11 h-11 rounded-xl bg-[#EDE9FE] flex items-center justify-center text-2xl flex-shrink-0">{agent.icon}</div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{agent.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{agent.desc}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Download className="w-3 h-3" />{agent.installs} ইন্সটল
                  </span>
                  <button className="px-3 py-1.5 bg-[#7C3AED] text-white text-xs font-medium rounded-lg hover:bg-[#6D28D9] transition-colors">
                    ইন্সটল করুন
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'marketplace' && (
          <div className="text-center py-12 text-gray-400">
            <Lock className="w-10 h-10 mx-auto mb-3 text-gray-300" />
            <p className="font-medium">মার্কেটপ্লেস শীঘ্রই আসছে</p>
          </div>
        )}
      </div>
    </>
  )
}
