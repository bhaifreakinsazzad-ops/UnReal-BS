'use client'

import { useState } from 'react'
import { Wallet, Lock, Sparkles } from 'lucide-react'

const features = [
  {
    icon: '🏦',
    titleBn: 'বাংলাদেশ থেকে পেমেন্ট রিসিভ',
    descBn: 'bKash, Nagad, Rocket ও ব্যাংক ট্রান্সফারের মাধ্যমে পেমেন্ট গ্রহণ করুন।',
    status: 'শীঘ্রই',
  },
  {
    icon: '🌍',
    titleBn: 'ইন্টারন্যাশনাল ট্রান্সফার',
    descBn: 'Stripe, Wise ও PayPal-এর মাধ্যমে আন্তর্জাতিক ক্লায়েন্টদের কাছ থেকে পেমেন্ট নিন।',
    status: 'শীঘ্রই',
  },
  {
    icon: '💰',
    titleBn: 'UnReal ওয়ালেট',
    descBn: 'একটি সুরক্ষিত ওয়ালেটে আপনার আয় সংগ্রহ করুন এবং যেকোনো সময় উত্তোলন করুন।',
    status: 'শীঘ্রই',
  },
]

export function PaymentsComingSoon() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (email) setSubmitted(true)
  }

  return (
    <div className="min-h-full bg-gradient-to-br from-[#0D0D1A] via-[#13132B] to-[#1a0a35] flex flex-col items-center justify-center p-6">
      {/* Hero */}
      <div className="text-center max-w-lg mx-auto mb-10">
        <div className="relative w-24 h-24 mx-auto mb-6">
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-[#7C3AED] to-[#00C875] opacity-20 blur-xl animate-pulse" />
          <div className="relative w-24 h-24 rounded-3xl bg-gradient-to-br from-[#7C3AED] to-[#6D28D9] flex items-center justify-center">
            <Wallet className="w-12 h-12 text-white" />
          </div>
          <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-[#00C875] flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
        </div>

        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#7C3AED]/20 border border-[#7C3AED]/30 rounded-full mb-4">
          <span className="w-2 h-2 rounded-full bg-[#00C875] animate-pulse" />
          <span className="text-xs font-semibold text-[#00C875] tracking-wide">তৈরি হচ্ছে</span>
        </div>

        <h1 className="text-3xl md:text-4xl font-bold text-white mb-4 leading-tight">
          আন্তর্জাতিক পেমেন্ট<br />
          <span className="bg-gradient-to-r from-[#7C3AED] to-[#00C875] bg-clip-text text-transparent">আসছে! 🔥</span>
        </h1>
        <p className="text-gray-400 text-sm md:text-base leading-relaxed">
          বাংলাদেশ থেকে পেমেন্ট প্রক্রিয়াকরণের বাধাগুলো আমরা সরিয়ে দিচ্ছি। একটি সুরক্ষিত ও সহজ ওয়ালেটের মাধ্যমে দেশী-বিদেশী পেমেন্ট করুন।
        </p>
      </div>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-2xl mb-10">
        {features.map((f) => (
          <div
            key={f.titleBn}
            className="relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5 text-center"
          >
            <div className="text-3xl mb-3">{f.icon}</div>
            <h3 className="text-white font-semibold text-sm mb-2">{f.titleBn}</h3>
            <p className="text-gray-400 text-xs leading-relaxed mb-3">{f.descBn}</p>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#7C3AED]/20 border border-[#7C3AED]/30 rounded-full text-[#A78BFA] text-[11px] font-medium">
              <Lock className="w-3 h-3" />
              {f.status}
            </span>
          </div>
        ))}
      </div>

      {/* Waitlist Form */}
      <div className="w-full max-w-md bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
        {submitted ? (
          <div>
            <div className="text-4xl mb-3">🎉</div>
            <h3 className="text-white font-bold mb-2">ধন্যবাদ!</h3>
            <p className="text-gray-400 text-sm">পেমেন্ট ফিচার চালু হলেই আপনাকে জানানো হবে।</p>
          </div>
        ) : (
          <>
            <h3 className="text-white font-bold mb-1">আগে জানতে চান?</h3>
            <p className="text-gray-400 text-sm mb-4">নোটিফিকেশন পেতে আপনার ইমেইল দিন</p>
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="আপনার ইমেইল"
                required
                className="flex-1 px-3 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white text-sm placeholder:text-gray-500 focus:outline-none focus:border-[#7C3AED]"
              />
              <button
                type="submit"
                className="px-4 py-2.5 bg-gradient-to-r from-[#7C3AED] to-[#00C875] text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity"
              >
                জানান
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
