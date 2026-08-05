'use client'

import { useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'

interface Props {
  error: Error & { digest?: string }
  reset: () => void
}

export default function DashboardError({ error, reset }: Props) {
  useEffect(() => {
    console.error('Dashboard render failed', { digest: error.digest ?? 'unavailable' })
    // lib/log-error.ts is server-only, so the client error boundary reports
    // through a small API route instead of calling it directly.
    fetch('/api/log-error', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source: 'dashboard-error-boundary',
        message: error.message || 'Unknown dashboard error',
        digest: error.digest,
      }),
    }).catch(() => {})
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
      <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center mx-auto mb-4">
        <AlertTriangle className="w-8 h-8 text-red-500" />
      </div>
      <h2 className="text-lg font-bold text-gray-900 mb-2">কিছু একটা ভুল হয়েছে</h2>
      <p className="text-sm text-gray-500 mb-6 max-w-xs">
        পেজটি লোড করতে সমস্যা হয়েছে। আবার চেষ্টা করুন অথবা পেজ রিফ্রেশ করুন।
      </p>
      <button
        onClick={reset}
        className="px-4 py-2.5 bg-[#7C3AED] text-white text-sm font-medium rounded-lg hover:bg-[#6D28D9] transition-colors"
      >
        আবার চেষ্টা করুন
      </button>
    </div>
  )
}
