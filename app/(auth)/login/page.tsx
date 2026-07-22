'use client'

import { Suspense, useState } from 'react'
import Image from 'next/image'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginForm />
    </Suspense>
  )
}

function LoginFallback() {
  return (
    <div className="min-h-screen bg-[#0D0D1A] flex items-center justify-center p-4">
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
      setError('ইমেইল বা পাসওয়ার্ড সঠিক নয়')
      return
    }

    router.push(callbackUrl)
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-[#0D0D1A] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Image
            src="/logo.png"
            alt="UnReal BS"
            width={64}
            height={64}
            className="mx-auto mb-4 rounded-2xl shadow-[0_0_40px_rgba(124,58,237,0.4)]"
            priority
          />
          <h1 className="text-2xl font-bold text-white">UnReal BS</h1>
          <p className="text-gray-400 text-sm mt-1">Business System</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-[#13132B] border border-white/10 rounded-2xl p-6 space-y-5">
          <div>
            <h2 className="text-white font-bold text-lg mb-1">লগইন করুন</h2>
            <p className="text-gray-400 text-sm">আপনার অ্যাকাউন্টে প্রবেশ করুন</p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
                ইমেইল
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="আপনার ইমেইল"
                required
                className="w-full px-3 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
                পাসওয়ার্ড
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="আপনার পাসওয়ার্ড"
                required
                className="w-full px-3 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] text-white text-sm font-bold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            লগইন করুন
          </button>

          <p className="text-center text-xs text-gray-500">
            পাসওয়ার্ড ভুলে গেছেন?{' '}
            <button type="button" className="text-[#A78BFA] hover:underline">
              রিসেট করুন
            </button>
          </p>
        </form>

        <p className="text-center text-xs text-gray-600 mt-6">
          © 2025 UnReal BS — Powered by BhaiFreakin
        </p>
      </div>
    </div>
  )
}
