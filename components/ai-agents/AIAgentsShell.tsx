'use client'

import { useState } from 'react'
import {
  Phone,
  MessageSquare,
  FileText,
  ExternalLink,
  Play,
  Pause,
  ChevronRight,
  Zap,
  CheckCircle2,
  Clock,
  BarChart3,
  Cpu,
  Mic,
  BookOpen,
  Star,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  locationId: string
}

type AgentStatus = 'active' | 'inactive'
type Tab = 'overview' | 'voice' | 'chat' | 'content'

interface AgentStat {
  label: string
  value: string
  delta?: string
}

interface AgentCapability {
  text: string
  highlight?: boolean
}

interface Agent {
  id: 'voice' | 'chat' | 'content'
  icon: React.ReactNode
  titleBn: string
  titleEn: string
  descBn: string
  accentColor: string
  accentBg: string
  stats: AgentStat[]
  capabilities: AgentCapability[]
  ghlPath: string
  tab: Tab
}

const HERO_STATS = [
  { icon: Phone, labelBn: 'কল হ্যান্ডেল', value: '1,248', delta: '+12%' },
  { icon: CheckCircle2, labelBn: 'অ্যাপয়েন্টমেন্ট', value: '386', delta: '+8%' },
  { icon: MessageSquare, labelBn: 'মেসেজ প্রক্রিয়া', value: '9,741', delta: '+24%' },
  { icon: FileText, labelBn: 'কনটেন্ট তৈরি', value: '523', delta: '+31%' },
]

const AGENTS: Agent[] = [
  {
    id: 'voice',
    icon: <Phone className="w-6 h-6" />,
    titleBn: 'ভয়েস AI এজেন্ট',
    titleEn: 'Voice AI',
    descBn: '২৪/৭ স্বয়ংক্রিয়ভাবে কল রিসিভ করে, প্রশ্নের উত্তর দেয় ও অ্যাপয়েন্টমেন্ট বুক করে।',
    accentColor: '#7C3AED',
    accentBg: '#F5F3FF',
    ghlPath: 'voice-ai',
    tab: 'voice',
    stats: [
      { label: 'কল হ্যান্ডেল', value: '1,248' },
      { label: 'বুকিং', value: '386' },
      { label: 'সাফল্য হার', value: '94%' },
    ],
    capabilities: [
      { text: 'স্বয়ংক্রিয় কল রিসিভ ও সাড়া দেওয়া', highlight: true },
      { text: 'বাংলায় কথা বলার সক্ষমতা' },
      { text: 'অ্যাপয়েন্টমেন্ট বুকিং ও রিশিডিউল' },
      { text: 'FAQ স্বয়ংক্রিয় উত্তর' },
      { text: 'কল রেকর্ডিং ও ট্রান্সক্রিপশন' },
      { text: 'লিড কোয়ালিফিকেশন' },
      { text: 'কাস্টম ভয়েস ব্যক্তিত্ব সেটআপ' },
      { text: '২৪/৭ নন-স্টপ কাজ করে', highlight: true },
    ],
  },
  {
    id: 'chat',
    icon: <MessageSquare className="w-6 h-6" />,
    titleBn: 'কনভার্সেশন AI এজেন্ট',
    titleEn: 'Conversation AI',
    descBn: 'WhatsApp, Facebook Messenger ও SMS-এ লিড কোয়ালিফাই করে এবং কাস্টমার সাপোর্ট দেয়।',
    accentColor: '#00C875',
    accentBg: '#F0FDF9',
    ghlPath: 'conversation-ai',
    tab: 'chat',
    stats: [
      { label: 'মেসেজ', value: '9,741' },
      { label: 'লিড কনভার্ট', value: '312' },
      { label: 'রেসপন্স টাইম', value: '<1s' },
    ],
    capabilities: [
      { text: 'WhatsApp ও Facebook Messenger ইন্টিগ্রেশন', highlight: true },
      { text: 'SMS অটো-রেসপন্স' },
      { text: 'লিড কোয়ালিফিকেশন ফ্লো' },
      { text: 'কাস্টমার সাপোর্ট অটোমেশন' },
      { text: 'বহুভাষী সাপোর্ট (বাংলা + ইংরেজি)' },
      { text: 'CRM-এ অটো ডেটা সেভ' },
      { text: 'কাস্টম চ্যাটবট পার্সোনালিটি' },
      { text: 'ইন্টেলিজেন্ট হ্যান্ডঅফ টু হিউম্যান', highlight: true },
    ],
  },
  {
    id: 'content',
    icon: <FileText className="w-6 h-6" />,
    titleBn: 'কনটেন্ট AI এজেন্ট',
    titleEn: 'Content AI',
    descBn: 'ব্লগ পোস্ট, সোশ্যাল মিডিয়া ক্যাপশন, ইমেইল ক্যাম্পেইন ও SMS টেমপ্লেট তৈরি করে।',
    accentColor: '#F59E0B',
    accentBg: '#FFFBEB',
    ghlPath: 'content-ai',
    tab: 'content',
    stats: [
      { label: 'কনটেন্ট তৈরি', value: '523' },
      { label: 'টেমপ্লেট', value: '48' },
      { label: 'টাইম সেভড', value: '120h' },
    ],
    capabilities: [
      { text: 'বাংলা ও ইংরেজি ব্লগ পোস্ট লেখা', highlight: true },
      { text: 'ফেসবুক ও ইনস্টাগ্রাম ক্যাপশন' },
      { text: 'ইমেইল ক্যাম্পেইন কপি' },
      { text: 'SMS মার্কেটিং টেমপ্লেট' },
      { text: 'প্রোডাক্ট ডেসক্রিপশন জেনারেশন' },
      { text: 'SEO অপটিমাইজড কনটেন্ট' },
      { text: 'ব্র্যান্ড ভয়েস কাস্টমাইজেশন' },
      { text: 'ব্যাচ কনটেন্ট জেনারেশন', highlight: true },
    ],
  },
]

const TAB_LABELS: { key: Tab; label: string }[] = [
  { key: 'overview', label: 'ওভারভিউ' },
  { key: 'voice', label: 'ভয়েস AI' },
  { key: 'chat', label: 'চ্যাট AI' },
  { key: 'content', label: 'কনটেন্ট AI' },
]

function AgentCard({
  agent,
  status,
  onToggle,
  onConfigure,
  onTabSwitch,
}: {
  agent: Agent
  status: AgentStatus
  onToggle: () => void
  onConfigure: () => void
  onTabSwitch: (tab: Tab) => void
}) {
  const isActive = status === 'active'

  return (
    <div className={cn(
      'bg-white rounded-2xl border transition-all duration-200',
      isActive ? 'border-gray-200 shadow-sm' : 'border-dashed border-gray-200 opacity-75'
    )}>
      {/* Card header */}
      <div className="p-5 pb-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: agent.accentBg, color: agent.accentColor }}
            >
              {agent.icon}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-sm">{agent.titleBn}</h3>
              <span className="text-xs text-gray-400">{agent.titleEn}</span>
            </div>
          </div>
          {/* Toggle */}
          <button
            onClick={onToggle}
            className={cn(
              'relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0',
              isActive ? 'bg-[#7C3AED]' : 'bg-gray-200'
            )}
          >
            <span
              className={cn(
                'inline-block h-4 w-4 rounded-full bg-white shadow transition-transform',
                isActive ? 'translate-x-6' : 'translate-x-1'
              )}
            />
          </button>
        </div>

        <p className="text-sm text-gray-500 leading-relaxed mb-4">{agent.descBn}</p>

        {/* Mini stats */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {agent.stats.map((stat) => (
            <div key={stat.label} className="bg-gray-50 rounded-xl p-2.5 text-center">
              <p className="text-base font-bold text-gray-900">{stat.value}</p>
              <p className="text-xs text-gray-400 mt-0.5 leading-tight">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Capabilities */}
      <div className="px-5 pb-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">সক্ষমতা</p>
        <ul className="space-y-1.5">
          {agent.capabilities.slice(0, 5).map((cap) => (
            <li key={cap.text} className="flex items-start gap-2">
              <CheckCircle2
                className="w-3.5 h-3.5 mt-0.5 flex-shrink-0"
                style={{ color: cap.highlight ? agent.accentColor : '#9CA3AF' }}
              />
              <span className={cn(
                'text-xs leading-relaxed',
                cap.highlight ? 'text-gray-800 font-medium' : 'text-gray-500'
              )}>
                {cap.text}
              </span>
            </li>
          ))}
          {agent.capabilities.length > 5 && (
            <li>
              <button
                onClick={() => onTabSwitch(agent.tab)}
                className="text-xs text-[#7C3AED] hover:underline flex items-center gap-0.5"
              >
                +{agent.capabilities.length - 5} আরও দেখুন <ChevronRight className="w-3 h-3" />
              </button>
            </li>
          )}
        </ul>
      </div>

      {/* Footer actions */}
      <div className="px-5 pb-5 flex items-center gap-2">
        <button
          onClick={onConfigure}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-[#7C3AED] text-[#7C3AED] text-xs font-medium hover:bg-[#7C3AED]/5 transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          GHL-এ কনফিগার
        </button>
        <button
          onClick={() => onTabSwitch(agent.tab)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium transition-colors"
          style={{ backgroundColor: agent.accentBg, color: agent.accentColor }}
        >
          বিস্তারিত দেখুন
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

function AgentDetailPanel({
  agent,
  status,
  onToggle,
  locationId,
}: {
  agent: Agent
  status: AgentStatus
  onToggle: () => void
  locationId: string
}) {
  const isActive = status === 'active'
  const ghlUrl = `https://app.gohighlevel.com/location/${locationId}/${agent.ghlPath}`

  return (
    <div className="space-y-5">
      {/* Hero banner */}
      <div
        className="rounded-2xl p-6 text-white relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${agent.accentColor} 0%, ${agent.id === 'voice' ? '#5B21B6' : agent.id === 'chat' ? '#059669' : '#D97706'} 100%)` }}
      >
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-10 -translate-y-10 translate-x-10"
          style={{ background: 'white' }} />
        <div className="relative">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                {agent.icon}
              </div>
              <div>
                <h2 className="text-xl font-bold">{agent.titleBn}</h2>
                <p className="text-white/70 text-sm">{agent.titleEn}</p>
              </div>
            </div>
            <button
              onClick={onToggle}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors',
                isActive ? 'bg-white/20 hover:bg-white/30' : 'bg-white text-gray-800 hover:bg-white/90'
              )}
            >
              {isActive ? <><Pause className="w-4 h-4" /> বন্ধ করুন</> : <><Play className="w-4 h-4" /> চালু করুন</>}
            </button>
          </div>
          <p className="text-white/85 text-sm leading-relaxed">{agent.descBn}</p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {agent.stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-xs text-gray-400 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* All capabilities */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Zap className="w-4 h-4" style={{ color: agent.accentColor }} />
          সম্পূর্ণ সক্ষমতা তালিকা
        </h3>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {agent.capabilities.map((cap) => (
            <li key={cap.text} className="flex items-start gap-2.5">
              <CheckCircle2
                className="w-4 h-4 mt-0.5 flex-shrink-0"
                style={{ color: cap.highlight ? agent.accentColor : '#9CA3AF' }}
              />
              <span className={cn(
                'text-sm leading-relaxed',
                cap.highlight ? 'text-gray-800 font-medium' : 'text-gray-600'
              )}>
                {cap.text}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Configure CTA */}
      <a
        href={ghlUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-semibold text-white transition-opacity hover:opacity-90"
        style={{ background: `linear-gradient(135deg, ${agent.accentColor} 0%, ${agent.id === 'voice' ? '#5B21B6' : agent.id === 'chat' ? '#059669' : '#D97706'} 100%)` }}
      >
        <ExternalLink className="w-4 h-4" />
        GHL-এ {agent.titleBn} কনফিগার করুন
      </a>
    </div>
  )
}

export function AIAgentsShell({ locationId }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [statuses, setStatuses] = useState<Record<string, AgentStatus>>({
    voice: 'active',
    chat: 'active',
    content: 'inactive',
  })

  function toggleAgent(id: string) {
    setStatuses((prev) => ({
      ...prev,
      [id]: prev[id] === 'active' ? 'inactive' : 'active',
    }))
  }

  function openGHL(path: string) {
    window.open(`https://app.gohighlevel.com/location/${locationId}/${path}`, '_blank')
  }

  const activeAgent = AGENTS.find((a) => a.tab === activeTab)

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-[#7C3AED]/10 flex items-center justify-center">
              <Cpu className="w-4 h-4 text-[#7C3AED]" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">AI এজেন্ট</h1>
            <span className="px-2 py-0.5 bg-[#7C3AED] text-white text-xs font-bold rounded-full">NEW</span>
          </div>
          <p className="text-sm text-gray-500">আপনার ব্যবসার জন্য ৩টি বুদ্ধিমান AI এজেন্ট একসাথে</p>
        </div>
        <a
          href={`https://app.gohighlevel.com/location/${locationId}/ai-tools`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-2 border border-[#7C3AED] text-[#7C3AED] text-sm font-medium rounded-lg hover:bg-[#7C3AED]/5 transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          GHL AI Tools
        </a>
      </div>

      {/* Hero stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {HERO_STATS.map(({ icon: Icon, labelBn, value, delta }) => (
          <div key={labelBn} className="bg-white rounded-2xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-xl bg-[#7C3AED]/10 flex items-center justify-center">
                <Icon className="w-4 h-4 text-[#7C3AED]" />
              </div>
              <span className="text-xs text-[#00C875] font-medium">{delta}</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{labelBn}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl overflow-x-auto">
        {TAB_LABELS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={cn(
              'flex-1 min-w-fit px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap',
              activeTab === key
                ? 'bg-white text-[#7C3AED] shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'overview' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {AGENTS.map((agent) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              status={statuses[agent.id] as AgentStatus}
              onToggle={() => toggleAgent(agent.id)}
              onConfigure={() => openGHL(agent.ghlPath)}
              onTabSwitch={setActiveTab}
            />
          ))}
        </div>
      ) : activeAgent ? (
        <div className="max-w-2xl mx-auto">
          <AgentDetailPanel
            agent={activeAgent}
            status={statuses[activeAgent.id] as AgentStatus}
            onToggle={() => toggleAgent(activeAgent.id)}
            locationId={locationId}
          />
        </div>
      ) : null}

      {/* Knowledge base & templates quick access */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <a
            href={`https://app.gohighlevel.com/location/${locationId}/knowledge-base`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-200 hover:border-[#7C3AED]/30 transition-colors group"
          >
            <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900 text-sm">নলেজ বেস</p>
              <p className="text-xs text-gray-400 mt-0.5">AI এজেন্টের জ্ঞান আপডেট করুন</p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#7C3AED] transition-colors" />
          </a>
          <a
            href={`https://app.gohighlevel.com/location/${locationId}/agent-templates`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-200 hover:border-[#7C3AED]/30 transition-colors group"
          >
            <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
              <Star className="w-5 h-5 text-amber-500" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900 text-sm">এজেন্ট টেমপ্লেট</p>
              <p className="text-xs text-gray-400 mt-0.5">রেডিমেড টেমপ্লেট দিয়ে শুরু করুন</p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#7C3AED] transition-colors" />
          </a>
          <a
            href={`https://app.gohighlevel.com/location/${locationId}/agent-logs`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-200 hover:border-[#7C3AED]/30 transition-colors group"
          >
            <div className="w-11 h-11 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
              <BarChart3 className="w-5 h-5 text-gray-600" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900 text-sm">এজেন্ট লগস</p>
              <p className="text-xs text-gray-400 mt-0.5">সমস্ত AI কার্যক্রমের ইতিহাস</p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#7C3AED] transition-colors" />
          </a>
          <a
            href={`https://app.gohighlevel.com/location/${locationId}/voice-ai`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-200 hover:border-[#7C3AED]/30 transition-colors group"
          >
            <div className="w-11 h-11 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0">
              <Mic className="w-5 h-5 text-purple-600" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900 text-sm">ভয়েস সেটআপ গাইড</p>
              <p className="text-xs text-gray-400 mt-0.5">প্রথমবার ভয়েস AI চালু করুন</p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#7C3AED] transition-colors" />
          </a>
        </div>
      )}

      {/* Activity log (overview only) */}
      {activeTab === 'overview' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400" />
              সাম্প্রতিক কার্যক্রম
            </h3>
            <span className="text-xs text-gray-400">আজকের লগ</span>
          </div>
          <ul className="space-y-3">
            {[
              { time: '১৪:৩২', agent: 'ভয়েস AI', action: 'নতুন কল হ্যান্ডেল — "অ্যাপয়েন্টমেন্ট বুকিং সম্পন্ন"', color: '#7C3AED' },
              { time: '১৪:২৮', agent: 'চ্যাট AI', action: 'WhatsApp লিড কোয়ালিফাই — Rahim Trading Co.', color: '#00C875' },
              { time: '১৪:১৫', agent: 'কনটেন্ট AI', action: 'ঈদ অফার পোস্ট তৈরি — ৫টি ভেরিয়েন্ট', color: '#F59E0B' },
              { time: '১৪:০২', agent: 'ভয়েস AI', action: 'মিসড কল ট্র্যাক — SMS ফলো-আপ পাঠানো হয়েছে', color: '#7C3AED' },
              { time: '১৩:৫৫', agent: 'চ্যাট AI', action: 'ফেসবুক মেসেজ রিপ্লাই — ৩টি লিড নেওয়া হয়েছে', color: '#00C875' },
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="text-xs text-gray-400 w-12 flex-shrink-0 pt-0.5 font-mono">{item.time}</span>
                <div className="flex items-center gap-1.5 flex-shrink-0 pt-0.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-xs font-medium whitespace-nowrap" style={{ color: item.color }}>{item.agent}</span>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">{item.action}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
