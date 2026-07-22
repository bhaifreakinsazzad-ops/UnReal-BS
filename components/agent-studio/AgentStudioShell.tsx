'use client'

import { useState } from 'react'
import { BrainCircuit, Plus, Settings, MessageSquare, ToggleLeft, ToggleRight, ExternalLink, Zap, ShieldCheck, BookOpen, ChevronRight, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { GHLBot, GHLConversationAIConfig } from '@/lib/ghl/agent-studio'

const channelIcons: Record<string, string> = {
  SMS: '💬',
  WhatsApp: '📱',
  Facebook: '📘',
  Instagram: '📸',
  Webchat: '💻',
  Email: '📧',
}

const statusStyle = {
  active: 'bg-green-100 text-green-700',
  inactive: 'bg-gray-100 text-gray-500',
}

interface Props {
  bots: GHLBot[]
  config: GHLConversationAIConfig | null
  locationId: string
}

type Panel = 'config' | 'bot'

export function AgentStudioShell({ bots: initialBots, config, locationId }: Props) {
  const [bots, setBots] = useState<GHLBot[]>(initialBots)
  const [activePanel, setActivePanel] = useState<{ type: Panel; id?: string } | null>(null)
  const [globalActive, setGlobalActive] = useState(config?.isActive ?? false)
  const [saving, setSaving] = useState(false)

  const activeBot = activePanel?.type === 'bot'
    ? bots.find(b => b.id === activePanel.id) ?? null
    : null

  async function toggleBot(id: string) {
    setBots(prev => prev.map(b => b.id === id
      ? { ...b, status: b.status === 'active' ? 'inactive' : 'active' }
      : b
    ))
    try {
      await fetch(`/api/ghl/conversations/providers/bots/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-location-id': locationId },
        body: JSON.stringify({ status: bots.find(b => b.id === id)?.status === 'active' ? 'inactive' : 'active' }),
      })
    } catch {}
  }

  async function toggleGlobal() {
    const next = !globalActive
    setGlobalActive(next)
    setSaving(true)
    try {
      await fetch(`/api/ghl/locations/${locationId}/conversation-ai/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-location-id': locationId },
        body: JSON.stringify({ isActive: next }),
      })
    } catch {}
    setSaving(false)
  }

  const activeBotCount = bots.filter(b => b.status === 'active').length

  return (
    <div className="flex h-full overflow-hidden">
      {/* Main content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">এজেন্ট স্টুডিও</h1>
            <p className="text-sm text-gray-500 mt-0.5">AI কনভার্সেশন বট পরিচালনা করুন</p>
          </div>
          <a
            href={`https://app.gohighlevel.com/location/${locationId}/conversation-ai`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 bg-[#7C3AED] text-white text-sm font-medium rounded-lg hover:bg-[#6D28D9] transition-colors"
          >
            <Plus className="w-4 h-4" />
            নতুন এজেন্ট
          </a>
        </div>

        {/* Global toggle card */}
        <div className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] rounded-xl p-4 text-white flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
              <BrainCircuit className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-semibold">Conversation AI</p>
              <p className="text-sm text-white/70">
                {globalActive
                  ? `${activeBotCount}টি বট সক্রিয় — কথোপকথনে স্বয়ংক্রিয়ভাবে সাড়া দিচ্ছে`
                  : 'বন্ধ আছে — সব বট নিষ্ক্রিয়'}
              </p>
            </div>
          </div>
          <button
            onClick={toggleGlobal}
            disabled={saving}
            className="flex-shrink-0 focus:outline-none disabled:opacity-60"
            aria-label={globalActive ? 'বন্ধ করুন' : 'চালু করুন'}
          >
            {globalActive
              ? <ToggleRight className="w-10 h-10 text-[#00C875]" />
              : <ToggleLeft className="w-10 h-10 text-white/40" />}
          </button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'মোট এজেন্ট', value: bots.length, icon: BrainCircuit, color: 'text-violet-600 bg-violet-50' },
            { label: 'সক্রিয়', value: activeBotCount, icon: Zap, color: 'text-green-600 bg-green-50' },
            { label: 'চ্যানেল', value: [...new Set(bots.map(b => b.channel).filter(Boolean))].length || 0, icon: MessageSquare, color: 'text-blue-600 bg-blue-50' },
          ].map(stat => (
            <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
              <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0', stat.color)}>
                <stat.icon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs text-gray-500">{stat.label}</p>
                <p className="text-xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Bots list */}
        {bots.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <div className="w-16 h-16 rounded-2xl bg-[#EDE9FE] flex items-center justify-center mx-auto mb-4">
              <BrainCircuit className="w-8 h-8 text-[#7C3AED]" />
            </div>
            <h3 className="font-semibold text-gray-800 mb-1">কোনো এজেন্ট নেই</h3>
            <p className="text-sm text-gray-400 mb-5 max-w-xs mx-auto">
              GHL Conversation AI-তে প্রথম AI এজেন্ট তৈরি করুন — স্বয়ংক্রিয়ভাবে কাস্টমারের সাথে কথা বলবে।
            </p>
            <a
              href={`https://app.gohighlevel.com/location/${locationId}/conversation-ai`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#7C3AED] text-white text-sm font-medium rounded-lg hover:bg-[#6D28D9] transition-colors"
            >
              <Plus className="w-4 h-4" />
              GHL-এ এজেন্ট তৈরি করুন
            </a>
          </div>
        ) : (
          <div className="space-y-3">
            {bots.map(bot => (
              <div
                key={bot.id}
                className={cn(
                  'bg-white rounded-xl border p-4 transition-colors cursor-pointer',
                  activePanel?.id === bot.id
                    ? 'border-[#7C3AED] shadow-sm'
                    : 'border-gray-200 hover:border-[#7C3AED]/30'
                )}
                onClick={() => setActivePanel({ type: 'bot', id: bot.id })}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#5B21B6] flex items-center justify-center flex-shrink-0">
                    <BrainCircuit className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900">{bot.name}</h3>
                      <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', statusStyle[bot.status])}>
                        {bot.status === 'active' ? '● সক্রিয়' : '⏸ নিষ্ক্রিয়'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-400 flex-wrap">
                      {bot.channel && (
                        <span className="flex items-center gap-1">
                          {channelIcons[bot.channel] ?? '💬'} {bot.channel}
                        </span>
                      )}
                      {bot.description && (
                        <span className="truncate max-w-xs">{bot.description}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={e => { e.stopPropagation(); toggleBot(bot.id) }}
                      className="focus:outline-none"
                      aria-label="টগল"
                    >
                      {bot.status === 'active'
                        ? <ToggleRight className="w-8 h-8 text-[#00C875]" />
                        : <ToggleLeft className="w-8 h-8 text-gray-300" />}
                    </button>
                    <ChevronRight className="w-4 h-4 text-gray-300" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Quick guide */}
        <div className="bg-[#F5F3FF] rounded-xl border border-[#7C3AED]/10 p-4 space-y-3">
          <p className="text-sm font-semibold text-[#7C3AED]">GHL Agent Studio সম্পর্কে</p>
          <div className="space-y-2">
            {[
              { icon: BrainCircuit, text: 'AI বট তৈরি করুন যা আপনার কাস্টমারকে ২৪/৭ সাড়া দেবে' },
              { icon: MessageSquare, text: 'WhatsApp, SMS, Facebook, Webchat — সব চ্যানেলে কাজ করে' },
              { icon: ShieldCheck, text: 'কাস্টম প্রম্পট দিয়ে বটের ব্যক্তিত্ব নির্ধারণ করুন' },
              { icon: BookOpen, text: 'FAQ ও ডকুমেন্ট দিয়ে বটকে ট্রেইন করুন' },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-2.5 text-sm text-gray-600">
                <item.icon className="w-4 h-4 text-[#7C3AED] mt-0.5 flex-shrink-0" />
                <span>{item.text}</span>
              </div>
            ))}
          </div>
          <a
            href={`https://app.gohighlevel.com/location/${locationId}/conversation-ai`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-[#7C3AED] font-medium hover:underline"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            GHL Agent Studio খুলুন
          </a>
        </div>
      </div>

      {/* Detail panel */}
      {activePanel && (
        <div className="w-80 border-l border-gray-200 bg-white flex-shrink-0 flex flex-col overflow-y-auto">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">
              {activeBot ? activeBot.name : 'কনফিগারেশন'}
            </h3>
            <button
              onClick={() => setActivePanel(null)}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {activeBot && (
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-xl">
                <div>
                  <p className="text-sm font-medium text-gray-800">স্ট্যাটাস</p>
                  <p className="text-xs text-gray-400">এই বটটি চালু বা বন্ধ করুন</p>
                </div>
                <button onClick={() => toggleBot(activeBot.id)} className="focus:outline-none">
                  {activeBot.status === 'active'
                    ? <ToggleRight className="w-9 h-9 text-[#00C875]" />
                    : <ToggleLeft className="w-9 h-9 text-gray-300" />}
                </button>
              </div>

              {activeBot.channel && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">চ্যানেল</p>
                  <div className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 rounded-lg text-sm text-gray-700">
                    <span className="text-lg">{channelIcons[activeBot.channel] ?? '💬'}</span>
                    {activeBot.channel}
                  </div>
                </div>
              )}

              {activeBot.description && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">বর্ণনা</p>
                  <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">{activeBot.description}</p>
                </div>
              )}

              <div className="space-y-2 pt-2">
                <a
                  href={`https://app.gohighlevel.com/location/${locationId}/conversation-ai`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-2.5 bg-[#7C3AED] text-white text-sm font-medium rounded-lg hover:bg-[#6D28D9] transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  GHL-এ কনফিগার করুন ↗
                </a>
                <a
                  href={`https://app.gohighlevel.com/location/${locationId}/conversation-ai`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-2.5 bg-gray-100 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <MessageSquare className="w-4 h-4" />
                  টেস্ট চ্যাট ↗
                </a>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
