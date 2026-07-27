'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Loader2, Sparkles } from 'lucide-react'

// Public self-registration. A new account gets its own wallet and its own
// per-user ledgers immediately; the CRM screens show an honest
// "workspace being set up" state until an operator provisions a GHL location,
// rather than falling back to a shared one (see lib/tenant.ts).
export default function SignupPage() {
  const router = useRouter()
  const [businessName, setBusinessName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password.length < 10) {
      setError('Your password must be at least 10 characters.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, businessName }),
      })
      const json = await res.json().catch(() => ({}))

      if (!res.ok) {
        setError(json?.message ?? 'Could not create your account.')
        setLoading(false)
        return
      }

      // Sign straight in so the user lands inside the product, not back at a form.
      const signInRes = await signIn('credentials', { email, password, redirect: false })
      setLoading(false)

      if (signInRes?.error) {
        router.push('/login')
        return
      }
      router.push('/')
      router.refresh()
    } catch {
      setError('Could not reach the server. Please check your connection and try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#201744_0%,#070712_42%,#05050B_100%)] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-7">
          <div className="mx-auto mb-5 flex h-24 w-24 items-center justify-center rounded-[1.75rem] border border-[#D8B86A]/25 bg-black/30 shadow-[0_0_60px_rgba(216,184,106,0.22)] backdrop-blur">
            <Image
              src="/logo.png"
              alt="UnReal BS Business Systems"
              width={92}
              height={92}
              className="h-20 w-20 object-contain"
              priority
            />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">UnReal BS</h1>
          <p className="text-[#D8B86A] text-sm mt-1 font-medium tracking-wide">Business Systems</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-[#101024]/90 border border-white/10 rounded-3xl p-6 space-y-5 shadow-2xl backdrop-blur">
          <div>
            <div className="flex items-center gap-2 text-[#D8B86A] mb-2">
              <Sparkles className="h-4 w-4" />
              <span className="text-xs font-bold uppercase tracking-[0.18em]">Create your account</span>
            </div>
            <h2 className="text-white font-bold text-xl mb-1">শুরু করুন — Get started free</h2>
            <p className="text-gray-400 text-sm">
              Udhar Khata, Wallet and AI are live on your account the moment you sign up.
            </p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label htmlFor="businessName" className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
                Business name / ব্যবসার নাম
              </label>
              <input
                id="businessName"
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="করিম ট্রেডার্স"
                required
                maxLength={200}
                autoComplete="organization"
                className="w-full px-3 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-[#D8B86A] focus:ring-2 focus:ring-[#D8B86A]/20"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@business.com"
                required
                autoComplete="email"
                className="w-full px-3 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-[#D8B86A] focus:ring-2 focus:ring-[#D8B86A]/20"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 10 characters"
                required
                minLength={10}
                autoComplete="new-password"
                className="w-full px-3 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-[#D8B86A] focus:ring-2 focus:ring-[#D8B86A]/20"
              />
              <p className="mt-1.5 text-[11px] text-gray-500">
                This password protects a wallet that holds real money. Use at least 10 characters.
              </p>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-[#D8B86A] to-[#A87925] text-[#080812] text-sm font-black rounded-xl hover:brightness-110 transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Create account
          </button>

          <div className="space-y-1.5 pt-1">
            {['Udhar Khata — track who owes you', 'Wallet & deposits via bKash / Nagad / Rocket', 'Metered AI, pay only for what you use'].map((f) => (
              <div key={f} className="flex items-center gap-2 text-[11px] text-gray-400">
                <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0 text-[#00C875]" />
                <span>{f}</span>
              </div>
            ))}
          </div>

          <p className="text-center text-xs text-gray-500 pt-1">
            Already have an account?{' '}
            <Link href="/login" className="text-[#D8B86A] hover:underline font-semibold">
              Sign in
            </Link>
          </p>

          <p className="text-center text-[10px] leading-relaxed text-gray-600">
            By creating an account you agree to our{' '}
            <Link href="/terms" className="underline hover:text-gray-400">Terms</Link> and{' '}
            <Link href="/privacy" className="underline hover:text-gray-400">Privacy Policy</Link>.
          </p>
        </form>

        <p className="text-center text-xs text-gray-600 mt-6">
          Copyright 2026 UnReal BS - Powered by NotRealEngine, LLC
        </p>
      </div>
    </div>
  )
}
