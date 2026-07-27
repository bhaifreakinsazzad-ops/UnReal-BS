'use client'

import Link from 'next/link'
import { ArrowRight, Landmark, PlugZap, Wallet } from 'lucide-react'
import { useLocale } from '@/lib/i18n/context'

// Shown on every GHL-backed screen when the signed-in account has no workspace
// provisioned yet. This is the honest alternative to the old behaviour, where
// every user silently fell back to one shared GHL sub-account and therefore saw
// somebody else's contacts and conversations.
//
// It deliberately points at the features that DO work for a brand-new account —
// Udhar Khata, Wallet, AI — because those live in our own tables and are scoped
// by user_id, so they are genuinely usable from the moment someone signs up.
export function WorkspaceNotConnected({ feature }: { feature?: string }) {
  const locale = useLocale()
  const isBn = locale === 'bn'

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-[#EDE9FE] border border-[#7C3AED]/20 flex items-center justify-center mb-5">
        <PlugZap className="w-8 h-8 text-[#7C3AED]" />
      </div>

      <h2 className="text-lg font-bold text-gray-900 mb-2">
        {isBn ? 'আপনার ওয়ার্কস্পেস এখনো তৈরি হচ্ছে' : 'Your workspace is being set up'}
      </h2>

      <p className="text-sm text-gray-500 max-w-md leading-relaxed">
        {isBn
          ? `${feature ?? 'এই ফিচারটি'} আপনার নিজস্ব CRM ওয়ার্কস্পেসের সাথে যুক্ত। আমাদের টিম এটি চালু করলে আপনি এখানে আপনার নিজের ডেটা দেখতে পাবেন — অন্য কারো ডেটা কখনোই নয়।`
          : `${feature ?? 'This feature'} connects to your own CRM workspace. Once our team activates it you'll see your own data here — never anyone else's.`}
      </p>

      <p className="text-xs text-gray-400 mt-3 max-w-md">
        {isBn
          ? 'ইতিমধ্যে নিচের ফিচারগুলো আপনার অ্যাকাউন্টে সম্পূর্ণ চালু আছে।'
          : 'Meanwhile, these features are fully live on your account right now.'}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6 w-full max-w-md">
        <Link
          href="/udhar-khata"
          className="group flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 transition hover:border-[#7C3AED]/30"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E8FFF4] text-[#059669]">
            <Landmark className="h-5 w-5" />
          </span>
          <span className="flex-1 text-left text-sm font-bold text-gray-900">
            {isBn ? 'উধার খাতা' : 'Udhar Khata'}
          </span>
          <ArrowRight className="h-4 w-4 text-gray-300 transition group-hover:text-[#7C3AED]" />
        </Link>

        <Link
          href="/payments"
          className="group flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 transition hover:border-[#7C3AED]/30"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFF5D8] text-[#A87925]">
            <Wallet className="h-5 w-5" />
          </span>
          <span className="flex-1 text-left text-sm font-bold text-gray-900">
            {isBn ? 'ওয়ালেট' : 'Wallet'}
          </span>
          <ArrowRight className="h-4 w-4 text-gray-300 transition group-hover:text-[#7C3AED]" />
        </Link>
      </div>
    </div>
  )
}
