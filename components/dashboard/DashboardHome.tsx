'use client'

import Link from 'next/link'
import {
  ArrowRight,
  CheckCircle2,
  CreditCard,
  Inbox,
  LineChart,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DashboardChart } from '@/components/dashboard/DashboardChart'
import { useLocale } from '@/lib/i18n/context'
import { formatNumber } from '@/lib/i18n'
import { cn } from '@/lib/utils'

interface DashboardHomeProps {
  totalContacts: number
  totalConversations: number
  pipelineRevenue: number
}

const actions = [
  { label: 'View Opportunities', href: '/opportunities', icon: Sparkles, tone: 'green' },
  { label: 'Open Credit Center', href: '/credit-center', icon: CreditCard, tone: 'gold' },
  { label: 'Open Inbox', href: '/conversations', icon: MessageSquare, tone: 'violet' },
  { label: 'View Services', href: '/services', icon: ShieldCheck, tone: 'blue' },
]

const nextBestActions = [
  'Review 3 new opportunities',
  'Contact 5 pending leads',
  'Send 2 follow-ups',
  'Check weekly credit settlement',
]

function money(amount: number) {
  return new Intl.NumberFormat('en-BD', {
    style: 'currency',
    currency: 'BDT',
    maximumFractionDigits: 0,
  }).format(amount || 248750).replace('BDT', '৳')
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

  const stats = [
    { label: 'New Leads', value: formatNumber(totalContacts, locale), helper: 'GHL contact total', icon: Users, tone: 'green' },
    { label: 'Follow-ups Due', value: formatNumber(Math.max(5, Math.round(totalConversations * 0.32)), locale), helper: 'Inbox action estimate', icon: Inbox, tone: 'violet' },
    { label: 'Accepted Opportunities', value: '0', helper: 'Demo starts clean', icon: Sparkles, tone: 'gold' },
    { label: 'This Month Revenue', value: money(pipelineRevenue), helper: pipelineRevenue ? 'From pipeline value' : 'Demo fallback', icon: LineChart, tone: 'blue' },
    { label: 'Available Credit', value: '৳5,000', helper: 'Starter pilot limit', icon: CreditCard, tone: 'green' },
    { label: 'Outstanding Settlement', value: '৳0', helper: 'Accepted opportunity settlement', icon: ShieldCheck, tone: 'gold' },
  ]

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-[1440px] mx-auto">
      <section className="overflow-hidden rounded-2xl bg-[#07101F] text-white shadow-[0_18px_60px_rgba(7,16,31,0.18)]">
        <div className="grid gap-6 p-5 md:grid-cols-[1fr_auto] md:p-7">
          <div>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <Badge variant="accent" dot>Founding pilot</Badge>
              <Badge variant="outline" className="border-white/15 bg-white/10 text-white">Demo fallback shown when GHL is unavailable</Badge>
            </div>
            <h1 className="text-2xl md:text-4xl font-black tracking-tight">Control Room</h1>
            <p className="mt-3 max-w-2xl text-sm md:text-base leading-7 text-white/70">
              Lead, staff, follow-up, sales, reports - one connected business system.
            </p>
            <p className="mt-2 max-w-2xl text-sm text-white/50">
              Your business should not depend on memory, manual follow-up, or one person.
              UNREAL BS turns scattered work into a connected operating system.
            </p>
          </div>
          <div className="rounded-2xl border border-[#00C875]/20 bg-[#00C875]/10 p-5 md:w-72">
            <p className="text-sm font-black text-[#00C875]">Next Best Action</p>
            <p className="mt-2 text-sm text-white/70">Start with the highest revenue protection moves today.</p>
            <Link href="/opportunities" className="mt-5 inline-flex items-center gap-2 text-sm font-black text-[#D8B86A]">
              Review opportunities
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-3 md:gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.label} className="border-gray-200/80 shadow-[0_10px_40px_rgba(15,23,42,0.04)] xl:col-span-2">
              <div className="flex items-start justify-between gap-3">
                <div className={cn('w-11 h-11 rounded-2xl flex items-center justify-center', toneClasses(stat.tone))}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="rounded-full bg-gray-50 px-2 py-1 text-[11px] font-bold text-gray-500">MVP</span>
              </div>
              <p className="mt-4 text-2xl md:text-3xl font-black text-gray-950 leading-none">{stat.value}</p>
              <p className="mt-2 text-sm font-bold text-gray-700">{stat.label}</p>
              <p className="mt-1 text-xs text-gray-400">{stat.helper}</p>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card padding="lg" className="border-gray-200 lg:col-span-2">
          <CardHeader>
            <CardTitle>Next Best Action</CardTitle>
            <Badge variant="primary">Today</Badge>
          </CardHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            {nextBestActions.map((action, index) => (
              <div key={action} className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white text-xs font-black text-[#7C3AED] shadow-sm">
                  {index + 1}
                </span>
                <span className="text-sm font-bold text-gray-800">{action}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card padding="lg" className="border-gray-200">
          <CardHeader>
            <CardTitle>Direct Actions</CardTitle>
          </CardHeader>
          <div className="space-y-3">
            {actions.map((action) => {
              const Icon = action.icon
              return (
                <Link
                  key={action.href}
                  href={action.href}
                  className="group flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 transition hover:border-[#7C3AED]/30 hover:bg-white"
                >
                  <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', toneClasses(action.tone))}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="flex-1 text-sm font-bold text-gray-900">{action.label}</span>
                  <ArrowRight className="h-4 w-4 text-gray-300 transition group-hover:text-[#7C3AED]" />
                </Link>
              )
            })}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
        <Card padding="lg" className="border-gray-200 xl:col-span-3">
          <CardHeader>
            <CardTitle>Business Performance Trend</CardTitle>
            <Badge variant="gray">Leads and revenue</Badge>
          </CardHeader>
          <DashboardChart />
        </Card>

        <Card padding="lg" className="border-gray-200 xl:col-span-2">
          <CardHeader>
            <CardTitle>Founding Pilot Status</CardTitle>
            <Badge variant="accent" dot>Ready</Badge>
          </CardHeader>
          <div className="space-y-3 text-sm">
            {[
              'Public landing captures eligibility demand.',
              'GHL remains the system of record.',
              'Opportunity Credit Center starts demo-clean.',
              'Service marketplace is ready for manual onboarding.',
            ].map((item) => (
              <div key={item} className="flex gap-3 rounded-xl bg-gray-50 p-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#059669]" />
                <span className="text-gray-600">{item}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
