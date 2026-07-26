'use client'

import Link from 'next/link'
import {
  ArrowRight,
  CheckCircle2,
  CreditCard,
  Inbox,
  Landmark,
  LineChart,
  MessageSquare,
  ShieldCheck,
  Users,
} from 'lucide-react'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useLocale } from '@/lib/i18n/context'
import { formatNumber } from '@/lib/i18n'
import { cn } from '@/lib/utils'

interface DashboardHomeProps {
  totalContacts: number | null
  totalConversations: number | null
  pipelineRevenue: number | null
  walletBalance: number | null
  udharOutstanding: number | null
}

function money(amount: number) {
  return new Intl.NumberFormat('en-BD', {
    style: 'currency',
    currency: 'BDT',
    maximumFractionDigits: 0,
  }).format(amount).replace('BDT', '৳')
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

export function DashboardHome({
  totalContacts,
  totalConversations,
  pipelineRevenue,
  walletBalance,
  udharOutstanding,
}: DashboardHomeProps) {
  const locale = useLocale()
  const isBn = locale === 'bn'

  const actions = [
    { label: isBn ? 'ওয়ালেট দেখুন' : 'Open Wallet', href: '/payments', icon: CreditCard, tone: 'gold' },
    { label: isBn ? 'উধার খাতা দেখুন' : 'Open Udhar Khata', href: '/udhar-khata', icon: Landmark, tone: 'green' },
    { label: isBn ? 'ইনবক্স খুলুন' : 'Open Inbox', href: '/conversations', icon: MessageSquare, tone: 'violet' },
    { label: isBn ? 'সার্ভিস দেখুন' : 'View Services', href: '/services', icon: ShieldCheck, tone: 'blue' },
  ]

  // Derived from the user's own real data only. The previous list was a fixed
  // set of strings ("Contact 5 pending leads") shown identically to every user
  // every day under a heading that implied it was computed for them.
  const nextBestActions: string[] = []
  if (udharOutstanding !== null && udharOutstanding > 0) {
    nextBestActions.push(
      isBn
        ? `উধার খাতায় ${money(udharOutstanding)} বকেয়া — আদায় করুন`
        : `${money(udharOutstanding)} outstanding in Udhar Khata — collect it`
    )
  }
  if (totalConversations !== null && totalConversations > 0) {
    nextBestActions.push(isBn ? 'ইনবক্সের নতুন মেসেজগুলোর উত্তর দিন' : 'Reply to new messages in your inbox')
  }
  if (walletBalance !== null && walletBalance <= 50) {
    nextBestActions.push(isBn ? 'ওয়ালেট ব্যালেন্স কম — টপ আপ করুন' : 'Wallet balance is low — top up')
  }

  const stats = [
    {
      label: isBn ? 'নতুন লিড' : 'New Leads',
      value: totalContacts === null ? '—' : formatNumber(totalContacts, locale),
      helper: totalContacts === null
        ? (isBn ? 'GHL-এ পৌঁছানো যায়নি' : "Couldn't reach GHL")
        : (isBn ? 'GHL কন্টাক্ট মোট' : 'GHL contact total'),
      icon: Users,
      tone: 'green',
    },
    {
      label: isBn ? 'কনভার্সেশন' : 'Conversations',
      value: totalConversations === null ? '—' : formatNumber(totalConversations, locale),
      helper: totalConversations === null
        ? (isBn ? 'GHL-এ পৌঁছানো যায়নি' : "Couldn't reach GHL")
        : (isBn ? 'ইনবক্সে মোট থ্রেড' : 'Total inbox threads'),
      icon: Inbox,
      tone: 'violet',
    },
    {
      label: isBn ? 'ওপেন পাইপলাইন' : 'Open Pipeline',
      value: pipelineRevenue === null ? '—' : money(pipelineRevenue),
      helper: pipelineRevenue === null
        ? (isBn ? 'GHL-এ পৌঁছানো যায়নি' : "Couldn't reach GHL")
        : (isBn ? 'সব খোলা সুযোগের মোট মূল্য' : 'Total value of all open opportunities'),
      icon: LineChart,
      tone: 'blue',
    },
    {
      label: isBn ? 'ওয়ালেট ব্যালেন্স' : 'Wallet Balance',
      value: walletBalance === null ? '—' : money(walletBalance),
      helper: walletBalance === null
        ? (isBn ? 'লগইন করুন' : 'Sign in to view')
        : (isBn ? 'তাৎক্ষণিক ব্যালেন্স' : 'Live balance'),
      icon: CreditCard,
      tone: 'gold',
    },
    {
      label: isBn ? 'উধার বকেয়া' : 'Udhar Outstanding',
      value: udharOutstanding === null ? '—' : money(udharOutstanding),
      helper: udharOutstanding === null
        ? (isBn ? 'লগইন করুন' : 'Sign in to view')
        : (isBn ? 'উধার খাতা থেকে' : 'From Udhar Khata'),
      icon: Landmark,
      tone: 'green',
    },
  ]

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-[1440px] mx-auto">
      <section className="overflow-hidden rounded-2xl bg-[#07101F] text-white shadow-[0_18px_60px_rgba(7,16,31,0.18)]">
        <div className="grid gap-6 p-5 md:grid-cols-[1fr_auto] md:p-7">
          <div>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <Badge variant="accent" dot>{isBn ? 'ফাউন্ডিং পাইলট' : 'Founding pilot'}</Badge>
            </div>
            <h1 className="text-2xl md:text-4xl font-black tracking-tight">
              {isBn ? 'কন্ট্রোল রুম' : 'Control Room'}
            </h1>
            <p className="mt-3 max-w-2xl text-sm md:text-base leading-7 text-white/70">
              {isBn
                ? 'লিড, স্টাফ, ফলো-আপ, বিক্রয়, রিপোর্ট — একটি সংযুক্ত বিজনেস সিস্টেম।'
                : 'Lead, staff, follow-up, sales, reports — one connected business system.'}
            </p>
            <p className="mt-2 max-w-2xl text-sm text-white/50">
              {isBn
                ? 'আপনার ব্যবসা স্মৃতি, ম্যানুয়াল ফলো-আপ, বা একজন মানুষের উপর নির্ভর করা উচিত নয়। UnReal BS বিক্ষিপ্ত কাজকে একটি সংযুক্ত অপারেটিং সিস্টেমে পরিণত করে।'
                : 'Your business should not depend on memory, manual follow-up, or one person. UnReal BS turns scattered work into a connected operating system.'}
            </p>
          </div>
          <div className="rounded-2xl border border-[#00C875]/20 bg-[#00C875]/10 p-5 md:w-72">
            <p className="text-sm font-black text-[#00C875]">{isBn ? 'পরবর্তী সেরা পদক্ষেপ' : 'Next Best Action'}</p>
            <p className="mt-2 text-sm text-white/70">
              {isBn ? 'আজকের সর্বোচ্চ প্রভাবশালী কাজ দিয়ে শুরু করুন।' : 'Start with the highest-impact moves today.'}
            </p>
            <Link href="/udhar-khata" className="mt-5 inline-flex items-center gap-2 text-sm font-black text-[#D8B86A]">
              {isBn ? 'উধার খাতা দেখুন' : 'Check Udhar Khata'}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3 md:gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.label} className="border-gray-200/80 shadow-[0_10px_40px_rgba(15,23,42,0.04)]">
              <div className="flex items-start justify-between gap-3">
                <div className={cn('w-11 h-11 rounded-2xl flex items-center justify-center', toneClasses(stat.tone))}>
                  <Icon className="w-5 h-5" />
                </div>
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
            <CardTitle>{isBn ? 'পরবর্তী সেরা পদক্ষেপ' : 'Next Best Action'}</CardTitle>
            <Badge variant="primary">{isBn ? 'আজ' : 'Today'}</Badge>
          </CardHeader>
          {nextBestActions.length === 0 ? (
            <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 px-4 py-6">
              <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-[#059669]" />
              <span className="text-sm text-gray-600">
                {isBn ? 'এই মুহূর্তে জরুরি কিছু নেই।' : 'Nothing needs your attention right now.'}
              </span>
            </div>
          ) : (
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
          )}
        </Card>

        <Card padding="lg" className="border-gray-200">
          <CardHeader>
            <CardTitle>{isBn ? 'ডিরেক্ট অ্যাকশন' : 'Direct Actions'}</CardTitle>
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

      {/* The "Business Performance Trend" chart was removed: it rendered a
          hardcoded 7-day leads/revenue series identical for every account,
          under a heading that presented it as the user's own business trend.
          It returns when there is a real per-user time series to plot. */}
      <div className="grid grid-cols-1 gap-4">
        <Card padding="lg" className="border-gray-200">
          <CardHeader>
            <CardTitle>{isBn ? 'ফাউন্ডিং পাইলট স্ট্যাটাস' : 'Founding Pilot Status'}</CardTitle>
            <Badge variant="accent" dot>{isBn ? 'প্রস্তুত' : 'Ready'}</Badge>
          </CardHeader>
          <div className="space-y-3 text-sm">
            {(isBn
              ? [
                  'পাবলিক ল্যান্ডিং যোগ্যতার চাহিদা সংগ্রহ করে।',
                  'GHL রেকর্ডের মূল সিস্টেম হিসেবে থাকে।',
                  'ওয়ালেট ও উধার খাতা লাইভ ডেটা দেখায়।',
                  'সার্ভিস মার্কেটপ্লেস ম্যানুয়াল অনবোর্ডিংয়ের জন্য প্রস্তুত।',
                ]
              : [
                  'Public landing captures eligibility demand.',
                  'GHL remains the system of record.',
                  'Wallet and Udhar Khata show live data.',
                  'Service marketplace is ready for manual onboarding.',
                ]
            ).map((item) => (
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
