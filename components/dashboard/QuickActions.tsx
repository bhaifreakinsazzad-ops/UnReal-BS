'use client'

import { Plus, Send, Zap, Sparkles, Globe, Workflow } from 'lucide-react'
import Link from 'next/link'
import { useLocale } from '@/lib/i18n/context'

const actions = [
  {
    labelBn: 'নতুন কন্টাক্ট যোগ',
    labelEn: 'Add Contact',
    helperBn: 'CRM-এ নতুন লিড',
    helperEn: 'Create a new CRM lead',
    icon: Plus,
    color: 'bg-[#F2ECFF] text-[#7C3AED]',
    href: '/contacts?action=new',
  },
  {
    labelBn: 'মেসেজ পাঠান',
    labelEn: 'Send Campaign',
    helperBn: 'কাস্টমারদের মেসেজ',
    helperEn: 'Reach your customers',
    icon: Send,
    color: 'bg-[#EAF2FF] text-[#2563EB]',
    href: '/conversations?action=new',
  },
  {
    labelBn: 'ওয়ার্কফ্লো তৈরি',
    labelEn: 'Create Workflow',
    helperBn: 'প্রসেস অটোমেট করুন',
    helperEn: 'Automate a process',
    icon: Workflow,
    color: 'bg-[#FFF5D8] text-[#A87925]',
    href: '/workflows?action=new',
  },
  {
    labelBn: 'এজেন্ট চালু',
    labelEn: 'Launch Agent',
    helperBn: 'AI এজেন্ট রান করুন',
    helperEn: 'Run an AI agent',
    icon: Zap,
    color: 'bg-[#E8FFF4] text-[#059669]',
    href: '/agentic-hq?open=bhaifreakin',
  },
  {
    labelBn: 'সাইট বানান',
    labelEn: 'Build Site',
    helperBn: 'সাইট বা ফানেল',
    helperEn: 'Create or edit a site',
    icon: Globe,
    color: 'bg-gray-100 text-gray-700',
    href: '/sites',
  },
  {
    labelBn: 'BhaiFreakin জিজ্ঞেস করুন',
    labelEn: 'Ask BhaiFreakin',
    helperBn: 'AI সহায়তা নিন',
    helperEn: 'Get AI assistance',
    icon: Sparkles,
    color: 'bg-[#F2ECFF] text-[#7C3AED]',
    href: '/ask-ai',
  },
]

export function QuickActions() {
  const locale = useLocale()

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {actions.map((action) => {
        const Icon = action.icon
        return (
          <Link
            key={action.href}
            href={action.href}
            className="group flex items-center gap-3 p-3 rounded-2xl bg-gray-50 hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-200 transition-all"
          >
            <div className={`w-11 h-11 rounded-2xl ${action.color} flex items-center justify-center flex-shrink-0`}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="block text-sm font-bold text-gray-900 leading-tight">
                {locale === 'bn' ? action.labelBn : action.labelEn}
              </span>
              <span className="block text-xs text-gray-500 truncate mt-0.5">
                {locale === 'bn' ? action.helperBn : action.helperEn}
              </span>
            </div>
            <span className="text-gray-300 group-hover:text-[#7C3AED] transition-colors">›</span>
          </Link>
        )
      })}
    </div>
  )
}
