'use client'

import { Suspense, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2, ShieldCheck } from 'lucide-react'
import { brand } from '@/lib/brand'

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginForm />
    </Suspense>
  )
}

function LoginFallback() {
  return (
    <div className="min-h-screen bg-[#070712] flex items-center justify-center p-4">
      <Loader2 className="w-6 h-6 animate-spin text-white/40" />
    </div>
  )
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') ?? '/'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const res = await signIn('credentials', {
      email,
      password,
      redirect: false,
    })

    setLoading(false)

    if (res?.error) {
      setError('The email or password is incorrect.')
      return
    }

    router.push(callbackUrl)
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#201744_0%,#070712_42%,#05050B_100%)] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-7">
          <div className="mx-auto mb-5 flex h-32 w-32 items-center justify-center rounded-[2rem] border border-[#D8B86A]/25 bg-black/30 shadow-[0_0_60px_rgba(216,184,106,0.22)] backdrop-blur">
            <Image
              src="/logo.png"
              alt={`${brand.name} SaaS IT Agency`}
              width={124}
              height={124}
              className="h-28 w-28 object-contain"
              priority
            />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">{brand.name}</h1>
          <p className="text-[#D8B86A] text-sm mt-1 font-medium tracking-wide">SaaS IT Agency</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-[#101024]/90 border border-white/10 rounded-3xl p-6 space-y-5 shadow-2xl backdrop-blur">
          <div>
            <div className="flex items-center gap-2 text-[#D8B86A] mb-2">
              <ShieldCheck className="h-4 w-4" />
              <span className="text-xs font-bold uppercase tracking-[0.18em]">Secure Operator Login</span>
            </div>
            <h2 className="text-white font-bold text-xl mb-1">Sign in to your workspace</h2>
            <p className="text-gray-400 text-sm">
              Welcome back. Enter your details to reach your agency OS, wallet, inbox, and client tools.
            </p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
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
                placeholder="Enter your password"
                required
                autoComplete="current-password"
                className="w-full px-3 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-[#D8B86A] focus:ring-2 focus:ring-[#D8B86A]/20"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-[#D8B86A] to-[#A87925] text-[#080812] text-sm font-black rounded-xl hover:brightness-110 transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Sign In
          </button>

          <p className="text-center text-xs text-gray-500">
            New here?{' '}
            <Link href="/signup" className="text-[#D8B86A] hover:underline font-semibold">
              Create a free account
            </Link>
          </p>
        </form>

        <p className="text-center text-xs text-gray-600 mt-6">
          Developed by BhaiSazzaD.onlibe and NotRealEngine, LLC. Powered by Go High Level.
        </p>
      </div>
    </div>
  )
}
