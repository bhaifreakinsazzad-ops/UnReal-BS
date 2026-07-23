'use client'

import Link from 'next/link'
import {
  ArrowUpRight,
  Bot,
  CheckCircle2,
  MessageSquare,
  Network,
  Search,
  Sparkles,
  Users,
  Wallet,
  Workflow,
  Zap,
} from 'lucide-react'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DashboardChart } from '@/components/dashboard/DashboardChart'
import { QuickActions } from '@/components/dashboard/QuickActions'
import { useLocale } from '@/lib/i18n/context'
import { formatNumber } from '@/lib/i18n'
import { cn } from '@/lib/utils'

interface DashboardHomeProps {
  totalContacts: number
  totalConversations: number
  pipelineRevenue: number
}

const copy = {
  en: {
    title: 'Dashboard',
    subtitle: 'Live command center for contacts, conversations, automations, and AI agents.',
    live: 'Live',
    fallback: 'Local fallback data is shown if GHL is unavailable.',
    leads: 'Leads Today',
    revenue: 'Revenue Pipeline',
    conversations: 'Active Conversations',
    workflows: 'Workflows Running',
    aiCenter: 'AI Command Center',
    routing: 'Model routing',
    liveRouting: 'Live',
    ask: 'Ask BhaiFreakin',
    askSub: 'Your AI operations copilot',
    input: 'Ask anything...',
    prompts: 'Quick Prompts',
    prompt1: "Summarize today's conversations",
    prompt2: 'Show workflow issues',
    prompt3: 'Top lead sources this week',
    prompt4: 'Revenue forecast this month',
    stream: 'Model Routing Stream',
    intents: 'Intents',
    models: 'Models',
    outputs: 'Actions / Outputs',
    health: 'Workflow Health',
    viewAll: 'View all',
    totalRunning: 'Total Running',
    healthy: 'Healthy',
    warning: 'Warning',
    failed: 'Failed',
    recentRuns: 'Recent Workflow Runs',
    recentActivity: 'Recent Activity',
    activeConversations: 'Active Conversations',
    quickActions: 'Quick Actions',
    commandPalette: 'Open Command Palette',
  },
  bn: {
    title: 'ড্যাশবোর্ড',
    subtitle: 'কন্টাক্ট, কনভার্সেশন, অটোমেশন এবং AI এজেন্টের লাইভ কমান্ড সেন্টার।',
    live: 'লাইভ',
    fallback: 'GHL না থাকলে লোকাল ফলব্যাক ডেটা দেখানো হয়।',
    leads: 'আজকের লিড',
    revenue: 'রেভিনিউ পাইপলাইন',
    conversations: 'সক্রিয় কনভার্সেশন',
    workflows: 'চলমান ওয়ার্কফ্লো',
    aiCenter: 'AI কমান্ড সেন্টার',
    routing: 'মডেল রাউটিং',
    liveRouting: 'লাইভ',
    ask: 'BhaiFreakin জিজ্ঞেস করুন',
    askSub: 'আপনার AI অপারেশনস সহকারী',
    input: 'যেকোনো কিছু জিজ্ঞেস করুন...',
    prompts: 'দ্রুত প্রম্পট',
    prompt1: 'আজকের কনভার্সেশন সারাংশ',
    prompt2: 'ওয়ার্কফ্লো সমস্যা দেখান',
    prompt3: 'এই সপ্তাহের টপ লিড সোর্স',
    prompt4: 'এই মাসের রেভিনিউ ফোরকাস্ট',
    stream: 'মডেল রাউটিং স্ট্রিম',
    intents: 'ইনটেন্ট',
    models: 'মডেল',
    outputs: 'অ্যাকশন / আউটপুট',
    health: 'ওয়ার্কফ্লো হেলথ',
    viewAll: 'সব দেখুন',
    totalRunning: 'মোট চলমান',
    healthy: 'হেলদি',
    warning: 'ওয়ার্নিং',
    failed: 'ফেইলড',
    recentRuns: 'সাম্প্রতিক ওয়ার্কফ্লো রান',
    recentActivity: 'সাম্প্রতিক কার্যক্রম',
    activeConversations: 'সক্রিয় কনভার্সেশন',
    quickActions: 'দ্রুত কাজ',
    commandPalette: 'কমান্ড প্যালেট খুলুন',
  },
}

const modelRows = [
  { intent: 'Answer Question', share: '42%', model: 'GPT-4o', modelShare: '46%', output: 'Answers Delivered', count: '658', tone: 'violet' },
  { intent: 'Draft Content', share: '28%', model: 'Claude 3.5', modelShare: '28%', output: 'Content Generated', count: '412', tone: 'green' },
  { intent: 'Analyze Data', share: '18%', model: 'Gemini 1.5 Pro', modelShare: '16%', output: 'Insights Generated', count: '289', tone: 'gold' },
  { intent: 'Qualification', share: '12%', model: 'Llama 3.1', modelShare: '10%', output: 'Leads Qualified', count: '176', tone: 'blue' },
]

const workflows = [
  { name: 'Lead Nurture Automation', status: 'running', time: '2m ago' },
  { name: 'New Lead Onboarding', status: 'running', time: '5m ago' },
  { name: 'Post-Purchase Follow Up', status: 'warning', time: '18m ago' },
  { name: 'Re-engagement Campaign', status: 'failed', time: '43m ago' },
  { name: 'Invoice Reminder Automation', status: 'running', time: '1h ago' },
]

const activities = [
  { title: 'New lead captured', detail: 'John Doe from Facebook Ads', time: '2m ago', icon: Users, tone: 'violet' },
  { title: 'Payment received', detail: '$2,450 from Acme Corporation', time: '15m ago', icon: Wallet, tone: 'gold' },
  { title: 'Conversation updated', detail: 'Sarah Ahmed via WhatsApp', time: '23m ago', icon: MessageSquare, tone: 'violet' },
  { title: 'Workflow completed', detail: 'Post-Purchase Follow Up', time: '1h ago', icon: Zap, tone: 'gold' },
  { title: 'AI agent executed', detail: 'Content Writer Agent generated blog draft', time: '2h ago', icon: Bot, tone: 'violet' },
]

const conversations = [
  { name: 'Sarah Ahmed', detail: 'Thanks! When can we schedule a demo?', badge: '2', time: '2m ago' },
  { name: 'Michael Brown', detail: 'I need help with the onboarding process.', badge: '1', time: '8m ago' },
  { name: 'Nusrat Jahan', detail: 'Do you offer custom plans?', badge: '3', time: '15m ago' },
  { name: 'David Lee', detail: 'Please send me the invoice.', badge: '1', time: '22m ago' },
  { name: 'Hasan Mahmud', detail: 'Great service! Looking forward to continue.', badge: null, time: '1h ago' },
]

function money(amount: number, locale: 'bn' | 'en') {
  if (amount <= 0) return locale === 'bn' ? '$০' : '$0'
  return new Intl.NumberFormat(locale === 'bn' ? 'bn-BD' : 'en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount)
}

function toneClasses(tone: string) {
  const map: Record<string, string> = {
    violet: 'bg-[#F2ECFF] text-[#6D28D9]',
    green: 'bg-[#E8FFF4] text-[#059669]',
    gold: 'bg-[#FFF5D8] text-[#A87925]',
    blue: 'bg-[#EAF2FF] text-[#2563EB]',
  }
  return map[tone] ?? map.violet
}

export function DashboardHome({ totalContacts, totalConversations, pipelineRevenue }: DashboardHomeProps) {
  const locale = useLocale()
  const t = copy[locale]

  const stats = [
    { label: t.leads, value: formatNumber(totalContacts, locale), change: '18%', icon: Users, color: 'violet' },
    { label: t.revenue, value: money(pipelineRevenue || 248750, locale), change: '24%', icon: Wallet, color: 'gold' },
    { label: t.conversations, value: formatNumber(totalConversations, locale), change: '9%', icon: MessageSquare, color: 'violet' },
    { label: t.workflows, value: '46', change: '12%', icon: Zap, color: 'gold' },
  ]

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-[1440px] mx-auto">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-[#10172A]">{t.title}</h1>
          <p className="text-sm text-gray-500 mt-1">{t.subtitle}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="accent" dot>{t.live}</Badge>
          <Badge variant="outline" className="text-[11px]">{t.fallback}</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.label} className="relative overflow-hidden border-gray-200/80 shadow-[0_10px_40px_rgba(15,23,42,0.04)]">
              <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[#D8B86A]/10 blur-2xl" />
              <div className="flex items-start justify-between mb-4">
                <div className={cn('w-11 h-11 rounded-2xl flex items-center justify-center', toneClasses(stat.color))}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-xs text-[#059669] font-bold flex items-center gap-0.5">
                  <ArrowUpRight className="w-3 h-3" />
                  {stat.change}
                </span>
              </div>
              <p className="text-2xl md:text-3xl font-black text-gray-950 leading-none mb-1">{stat.value}</p>
              <p className="text-xs text-gray-500 font-semibold">{stat.label}</p>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
        <Card padding="none" className="xl:col-span-3 overflow-hidden border-gray-200">
          <CardHeader className="px-5 py-4 border-b border-gray-100 mb-0">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#7C3AED]" />
              <CardTitle>{t.aiCenter}</CardTitle>
            </div>
            <button className="text-gray-400 hover:text-gray-700" aria-label="AI settings">
              <Network className="w-4 h-4" />
            </button>
          </CardHeader>

          <div className="grid grid-cols-1 lg:grid-cols-[250px_1fr] gap-5 p-4">
            <div className="rounded-2xl bg-[#07101F] p-4 text-white shadow-[0_18px_50px_rgba(7,16,31,0.25)]">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-2xl bg-[#7C3AED] flex items-center justify-center">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold leading-none">{t.ask}</p>
                  <p className="text-xs text-gray-400 mt-1">{t.askSub}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-gray-500">
                <Search className="w-4 h-4" />
                <span className="text-xs flex-1">{t.input}</span>
                <Link href="/ask-ai" className="w-8 h-8 rounded-lg bg-[#7C3AED] text-white flex items-center justify-center">
                  <ArrowUpRight className="w-4 h-4" />
                </Link>
              </div>
              <p className="text-xs font-semibold text-gray-400 mt-5 mb-2">{t.prompts}</p>
              {[t.prompt1, t.prompt2, t.prompt3, t.prompt4].map((prompt) => (
                <Link key={prompt} href="/ask-ai" className="flex items-center justify-between rounded-lg border border-white/10 px-3 py-2 text-xs text-gray-300 hover:bg-white/5">
                  {prompt}
                  <ArrowUpRight className="w-3 h-3" />
                </Link>
              ))}
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-bold text-gray-900">{t.stream}</p>
                  <p className="text-xs text-gray-400">{t.routing} <span className="text-[#059669]">● {t.liveRouting}</span></p>
                </div>
                <Badge variant="outline">Live</Badge>
              </div>
              <div className="grid grid-cols-3 gap-2 text-[11px] font-bold uppercase tracking-wide text-gray-400 mb-2">
                <span>{t.intents}</span>
                <span>{t.models}</span>
                <span>{t.outputs}</span>
              </div>
              <div className="space-y-2">
                {modelRows.map((row) => (
                  <div key={row.intent} className="grid grid-cols-3 gap-2 items-center">
                    <div className="rounded-xl border border-gray-200 px-3 py-2 text-xs">
                      <div className="flex justify-between gap-2"><span>{row.intent}</span><span className="text-[#7C3AED]">{row.share}</span></div>
                    </div>
                    <div className={cn('rounded-xl px-3 py-2 text-xs font-bold', toneClasses(row.tone))}>
                      <div className="flex justify-between gap-2"><span>{row.model}</span><span>{row.modelShare}</span></div>
                    </div>
                    <div className="rounded-xl border border-gray-200 px-3 py-2 text-xs">
                      <p>{row.output}</p>
                      <p className="text-gray-400">{row.count}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 border-t border-gray-100 pt-4 text-center">
                <div><p className="text-xs text-gray-400">Total Requests</p><p className="text-sm font-bold">1,535</p></div>
                <div><p className="text-xs text-gray-400">Success Rate</p><p className="text-sm font-bold text-[#059669]">98.7%</p></div>
                <div><p className="text-xs text-gray-400">Avg. Response</p><p className="text-sm font-bold text-[#059669]">2.4s</p></div>
              </div>
            </div>
          </div>
        </Card>

        <Card padding="none" className="xl:col-span-2 overflow-hidden border-gray-200">
          <CardHeader className="px-5 py-4 border-b border-gray-100 mb-0">
            <div className="flex items-center gap-2">
              <Workflow className="w-5 h-5 text-[#111827]" />
              <CardTitle>{t.health}</CardTitle>
            </div>
            <Link href="/workflows" className="text-xs font-bold text-[#7C3AED] hover:underline">{t.viewAll} →</Link>
          </CardHeader>
          <div className="p-4 space-y-4">
            <div className="flex items-center gap-5">
              <div className="relative h-32 w-32 rounded-full bg-[conic-gradient(#22C55E_0_70%,#F59E0B_70%_90%,#EF4444_90%_100%)] flex items-center justify-center">
                <div className="h-24 w-24 rounded-full bg-white flex flex-col items-center justify-center">
                  <span className="text-3xl font-black">46</span>
                  <span className="text-xs text-gray-500">{t.totalRunning}</span>
                </div>
              </div>
              <div className="flex-1 space-y-3 text-sm">
                {[['#22C55E', t.healthy, '32', '70%'], ['#F59E0B', t.warning, '9', '20%'], ['#EF4444', t.failed, '5', '10%']].map(([color, label, count, pct]) => (
                  <div key={label} className="grid grid-cols-[12px_1fr_auto_auto] gap-3 items-center">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
                    <span className="text-gray-600">{label}</span>
                    <span className="font-bold">{count}</span>
                    <span className="text-gray-400">{pct}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900 mb-2">{t.recentRuns}</p>
              <div className="space-y-2">
                {workflows.map((wf) => (
                  <div key={wf.name} className="flex items-center gap-2 rounded-xl border border-gray-100 px-3 py-2 text-xs">
                    <Workflow className="w-4 h-4 text-gray-500" />
                    <span className="flex-1 font-medium text-gray-800">{wf.name}</span>
                    <span className={cn('font-bold', wf.status === 'running' && 'text-[#059669]', wf.status === 'warning' && 'text-[#D97706]', wf.status === 'failed' && 'text-red-500')}>
                      ● {wf.status}
                    </span>
                    <span className="text-gray-400">{wf.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card padding="none" className="overflow-hidden border-gray-200">
          <CardHeader className="px-5 py-4 border-b border-gray-100 mb-0">
            <CardTitle>{t.recentActivity}</CardTitle>
            <Link href="/contacts" className="text-xs font-bold text-[#7C3AED]">{t.viewAll} →</Link>
          </CardHeader>
          <div className="divide-y divide-gray-50">
            {activities.map((activity) => {
              const Icon = activity.icon
              return (
                <div key={activity.title} className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50/70 transition-colors">
                  <div className={cn('w-10 h-10 rounded-2xl flex items-center justify-center', toneClasses(activity.tone))}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">{activity.title}</p>
                    <p className="text-xs text-gray-500 truncate">{activity.detail}</p>
                  </div>
                  <span className="text-xs text-gray-400">{activity.time}</span>
                </div>
              )
            })}
          </div>
        </Card>

        <Card padding="none" className="overflow-hidden border-gray-200">
          <CardHeader className="px-5 py-4 border-b border-gray-100 mb-0">
            <CardTitle>{t.activeConversations}</CardTitle>
            <Link href="/conversations" className="text-xs font-bold text-[#7C3AED]">{t.viewAll} →</Link>
          </CardHeader>
          <div className="px-5 py-3 flex items-center gap-2 border-b border-gray-50">
            {['All', 'Unread', 'My Conversations'].map((tab) => (
              <button key={tab} className={cn('px-3 py-1.5 rounded-lg text-xs font-bold', tab === 'All' ? 'bg-[#F2ECFF] text-[#6D28D9]' : 'text-gray-500 hover:bg-gray-50')}>
                {tab}
              </button>
            ))}
          </div>
          <div className="divide-y divide-gray-50">
            {conversations.map((conv) => (
              <Link key={conv.name} href="/conversations" className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50/70 transition-colors">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#D8B86A] to-[#7C3AED] flex items-center justify-center text-white text-xs font-black">
                  {conv.name.split(' ').map((part) => part[0]).join('').slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">{conv.name}</p>
                  <p className="text-xs text-gray-500 truncate">{conv.detail}</p>
                </div>
                {conv.badge ? <span className="w-5 h-5 rounded-full bg-[#7C3AED] text-white text-[10px] font-bold flex items-center justify-center">{conv.badge}</span> : <CheckCircle2 className="w-4 h-4 text-[#059669]" />}
                <span className="text-xs text-gray-400">{conv.time}</span>
              </Link>
            ))}
          </div>
        </Card>

        <Card padding="lg" className="border-gray-200">
          <CardHeader>
            <CardTitle>{t.quickActions}</CardTitle>
          </CardHeader>
          <QuickActions />
          <Link href="/ask-ai" className="mt-5 flex items-center justify-between rounded-2xl border border-[#7C3AED]/20 bg-[#F7F3FF] px-4 py-3 text-sm font-bold text-[#6D28D9] hover:bg-[#F2ECFF]">
            {t.commandPalette}
            <span className="rounded-lg bg-white px-2 py-1 text-xs shadow-sm">⌘ K</span>
          </Link>
        </Card>
      </div>

      <Card padding="lg" className="border-gray-200">
        <CardHeader>
          <CardTitle>{locale === 'bn' ? 'পারফরম্যান্স ট্রেন্ড' : 'Performance Trend'}</CardTitle>
          <Badge variant="gray">{locale === 'bn' ? 'লিড এবং রেভিনিউ' : 'Leads and revenue'}</Badge>
        </CardHeader>
        <DashboardChart />
      </Card>
    </div>
  )
}
