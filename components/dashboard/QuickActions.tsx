'use client'

import { Plus, Send, Zap, Sparkles } from 'lucide-react'
import Link from 'next/link'

const actions = [
  {
    labelBn: 'নতুন কন্টাক্ট যোগ',
    labelEn: 'Add Contact',
    icon: Plus,
    color: 'bg-[#EDE9FE] text-[#7C3AED]',
    href: '/contacts?action=new',
  },
  {
    labelBn: 'মেসেজ পাঠান',
    labelEn: 'Send Message',
    icon: Send,
    color: 'bg-[#DBEAFE] text-[#2563EB]',
    href: '/conversations?action=new',
  },
  {
    labelBn: 'ওয়ার্কফ্লো চালু',
    labelEn: 'Start Workflow',
    icon: Zap,
    color: 'bg-[#FEF3C7] text-[#D97706]',
    href: '/workflows?action=new',
  },
  {
    labelBn: 'BhaiFreakin জিজ্ঞেস করুন',
    labelEn: 'Ask BhaiFreakin',
    icon: Sparkles,
    color: 'bg-[#D1FAE5] text-[#059669]',
    href: '/agentic-hq?open=bhaifreakin',
  },
]

export function QuickActions() {
  return (
    <div className="grid grid-cols-2 gap-3">
      {actions.map((action) => {
        const Icon = action.icon
        return (
          <Link
            key={action.href}
            href={action.href}
            className="flex flex-col items-center gap-2.5 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors text-center"
          >
            <div className={`w-11 h-11 rounded-xl ${action.color} flex items-center justify-center`}>
              <Icon className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium text-gray-700 leading-tight">{action.labelBn}</span>
          </Link>
        )
      })}
    </div>
  )
}
