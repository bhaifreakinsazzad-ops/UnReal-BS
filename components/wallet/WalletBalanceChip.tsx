'use client'

import { useEffect, useState } from 'react'
import { Loader2, Wallet } from 'lucide-react'
import { Card } from '@/components/ui/card'

export function formatBDT(value: number) {
  return `৳${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

interface WalletBalance {
  balance: number
  lowBalanceThreshold: number
}

// Shared wallet balance card — reads the one shared balance
// (/api/wallet) that both AI subscriptions and virtual card purchases
// spend from. onLoad reports the balance up so parent components can
// react (e.g. show a low-balance banner) without duplicating the fetch.
export function WalletBalanceChip({ onLoad }: { onLoad?: (balance: WalletBalance) => void }) {
  const [balance, setBalance] = useState<number | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch('/api/wallet')
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('failed'))))
      .then((json: WalletBalance) => {
        if (cancelled) return
        setBalance(json.balance)
        onLoad?.(json)
      })
      .catch(() => {
        if (!cancelled) setError(true)
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <Card className="border-gray-200">
      <div className="flex items-center gap-2">
        <Wallet className="h-6 w-6 text-[#7C3AED]" />
        <p className="text-sm font-bold text-gray-600">Wallet Balance</p>
      </div>
      <p className="mt-3 text-2xl font-black text-gray-950">
        {error ? '—' : balance === null ? <Loader2 className="h-5 w-5 animate-spin text-gray-300" /> : formatBDT(balance)}
      </p>
      {error && <p className="mt-1 text-xs text-red-500">Could not load your wallet balance.</p>}
    </Card>
  )
}
