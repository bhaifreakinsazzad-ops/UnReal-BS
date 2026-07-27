'use client'

import { useState } from 'react'
import { Bot, CreditCard, Crown, HandCoins, Lock, Plug, Sparkles, Store } from 'lucide-react'
import { useLocale } from '@/lib/i18n/context'

interface ComingSoonFeature {
  emoji: string
  titleEn: string
  titleBn: string
  descEn: string
  descBn: string
}

interface ComingSoonShellProps {
  feature: 'opportunities' | 'credit_center' | 'meetally' | 'clan' | 'skills' | 'agentic_hq'
  eyebrowEn: string
  eyebrowBn: string
  headlineEn: string
  headlineBn: string
  subheadlineEn: string
  subheadlineBn: string
  features: ComingSoonFeature[]
  children?: React.ReactNode
}

// Icon picked internally from the feature key rather than passed as a prop —
// a Lucide component reference isn't serializable across the Server->Client
// boundary, and these pages need to stay Server Components for `metadata`.
const FEATURE_ICON = {
  opportunities: HandCoins,
  credit_center: CreditCard,
  meetally: Store,
  clan: Crown,
  skills: Plug,
  agentic_hq: Bot,
} as const

// Generalized from the original components/payments/PaymentsComingSoon.tsx
// (now orphaned since /payments got a real wallet). Same visual language,
// reused for any feature that's genuinely coming soon rather than shown
// with fake/demo data pretending to be live. The waitlist form actually
// persists to unreal_bs_coming_soon_interest via /api/coming-soon/notify —
// the original's "if (email) setSubmitted(true)" never saved anything.
// Optional `children` renders below the waitlist card (e.g. MeetAlly's
// curated Upwork/Fiverr links, which are real and don't need to wait).
// Bilingual pairs (xxxEn/xxxBn) are passed by the caller (a Server Component,
// so it can't read the client-only locale) — this shell picks the right one
// via useLocale() since it's the client boundary.
export function ComingSoonShell({
  feature,
  eyebrowEn,
  eyebrowBn,
  headlineEn,
  headlineBn,
  subheadlineEn,
  subheadlineBn,
  features,
  children,
}: ComingSoonShellProps) {
  const locale = useLocale()
  const isBn = locale === 'bn'
  const Icon = FEATURE_ICON[feature]
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/coming-soon/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feature, email }),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error(json?.message ?? (isBn ? 'আপনার আগ্রহ সংরক্ষণ করা যায়নি।' : 'Could not save your interest.'))
      }
      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : isBn ? 'আপনার আগ্রহ সংরক্ষণ করা যায়নি।' : 'Could not save your interest.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-full bg-gradient-to-br from-[#0D0D1A] via-[#13132B] to-[#1a0a35] flex flex-col items-center justify-center p-6">
      <div className="text-center max-w-lg mx-auto mb-10">
        <div className="relative w-24 h-24 mx-auto mb-6">
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-[#7C3AED] to-[#00C875] opacity-20 blur-xl animate-pulse" />
          <div className="relative w-24 h-24 rounded-3xl bg-gradient-to-br from-[#7C3AED] to-[#6D28D9] flex items-center justify-center">
            <Icon className="w-12 h-12 text-white" />
          </div>
          <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-[#00C875] flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
        </div>

        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#7C3AED]/20 border border-[#7C3AED]/30 rounded-full mb-4">
          <span className="w-2 h-2 rounded-full bg-[#00C875] animate-pulse" />
          <span className="text-xs font-semibold text-[#00C875] tracking-wide">{isBn ? eyebrowBn : eyebrowEn}</span>
        </div>

        <h1 className="text-3xl md:text-4xl font-bold text-white mb-4 leading-tight">{isBn ? headlineBn : headlineEn}</h1>
        <p className="text-gray-400 text-sm md:text-base leading-relaxed">{isBn ? subheadlineBn : subheadlineEn}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-2xl mb-10">
        {features.map((f) => (
          <div
            key={f.titleEn}
            className="relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5 text-center"
          >
            <div className="text-3xl mb-3">{f.emoji}</div>
            <h3 className="text-white font-semibold text-sm mb-2">{isBn ? f.titleBn : f.titleEn}</h3>
            <p className="text-gray-400 text-xs leading-relaxed mb-3">{isBn ? f.descBn : f.descEn}</p>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#7C3AED]/20 border border-[#7C3AED]/30 rounded-full text-[#A78BFA] text-[11px] font-medium">
              <Lock className="w-3 h-3" />
              {isBn ? 'শীঘ্রই আসছে' : 'Coming Soon'}
            </span>
          </div>
        ))}
      </div>

      <div className="w-full max-w-md bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
        {submitted ? (
          <div>
            <div className="text-4xl mb-3">🎉</div>
            <h3 className="text-white font-bold mb-2">{isBn ? 'আপনি তালিকায় আছেন!' : "You're on the list!"}</h3>
            <p className="text-gray-400 text-sm">{isBn ? 'লঞ্চ হওয়ার সাথে সাথেই আমরা আপনাকে ইমেইল করব।' : "We'll email you the moment this launches."}</p>
          </div>
        ) : (
          <>
            <h3 className="text-white font-bold mb-1">{isBn ? 'সবার আগে জানতে চান?' : 'Want to know first?'}</h3>
            <p className="text-gray-400 text-sm mb-4">{isBn ? 'আপনার ইমেইল দিন, লঞ্চ হলে আমরা জানাব।' : "Leave your email and we'll notify you at launch."}</p>
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@business.com"
                required
                disabled={submitting}
                className="flex-1 px-3 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white text-sm placeholder:text-gray-500 focus:outline-none focus:border-[#7C3AED] disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2.5 bg-gradient-to-r from-[#7C3AED] to-[#00C875] text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {submitting ? '...' : isBn ? 'জানান' : 'Notify me'}
              </button>
            </form>
            {error && <p className="mt-3 text-xs text-red-400">{error}</p>}
          </>
        )}
      </div>

      {children}
    </div>
  )
}
