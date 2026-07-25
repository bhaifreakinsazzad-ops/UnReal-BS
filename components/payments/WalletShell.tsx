'use client'

import { useEffect, useState } from 'react'
import { ArrowDownLeft, ArrowUpRight, Clock, Loader2, RefreshCw, Wallet } from 'lucide-react'
import { cn } from '@/lib/utils'
import { WalletBalanceChip, formatBDT } from '@/components/wallet/WalletBalanceChip'
import { DepositRequestCard } from '@/components/wallet/DepositRequestCard'

interface LedgerEntry {
  id: string
  kind: string
  direction: 'credit' | 'debit'
  amountBdt: number
  balanceAfterBdt: number
  note: string | null
  createdAt: string
}

const KIND_LABELS: Record<string, string> = {
  deposit: 'ডিপোজিট',
  card_purchase: 'ভার্চুয়াল কার্ড',
  card_refund: 'রিফান্ড',
  ai_usage: 'AI ব্যবহার',
}

type Tab = 'deposit' | 'history'

function formatDate(str: string) {
  return new Date(str).toLocaleDateString('bn-BD', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export function WalletShell() {
  const [tab, setTab] = useState<Tab>('history')
  const [reloadKey, setReloadKey] = useState(0)
  const [entries, setEntries] = useState<LedgerEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch('/api/wallet/ledger')
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('failed'))))
      .then((json: { entries: LedgerEntry[] }) => {
        if (!cancelled) setEntries(json.entries ?? [])
      })
      .catch(() => {
        if (!cancelled) setError(true)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [reloadKey])

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#0D0D1A] to-[#13132B] px-5 pt-5 pb-8">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <Wallet className="w-5 h-5 text-white" />
            <h1 className="text-white font-bold text-lg">ওয়ালেট</h1>
          </div>
          <button
            onClick={() => setReloadKey((k) => k + 1)}
            className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        <div className="[&_p]:text-white [&_svg]:text-white">
          <WalletBalanceChip />
        </div>
      </div>

      {/* Quick actions */}
      <div className="flex gap-3 px-4 -mt-5">
        {([
          { tab: 'deposit' as Tab, icon: ArrowDownLeft, label: 'ডিপোজিট' },
          { tab: 'history' as Tab, icon: Clock, label: 'ইতিহাস' },
        ]).map(({ tab: t, icon: Icon, label }) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl border text-xs font-medium transition-colors shadow-sm',
              tab === t
                ? 'bg-[#7C3AED] border-[#7C3AED] text-white'
                : 'bg-white border-gray-200 text-gray-700 hover:border-[#7C3AED]/30'
            )}
          >
            <Icon className="w-5 h-5" />
            {label}
          </button>
        ))}
      </div>

      <div className="p-4 space-y-4">
        {tab === 'deposit' && <DepositRequestCard />}

        {tab === 'history' && (
          <div className="space-y-3">
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-12 text-sm text-gray-400">
                <Loader2 className="h-4 w-4 animate-spin" />
                লোড হচ্ছে...
              </div>
            ) : error ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                লেনদেনের ইতিহাস লোড করা যায়নি।
              </div>
            ) : entries.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-gray-200">
                <Clock className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">কোনো লেনদেন নেই</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-50 overflow-hidden">
                {entries.map((e) => (
                  <div key={e.id} className="flex items-center gap-3 p-4">
                    <div
                      className={cn(
                        'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
                        e.direction === 'credit' ? 'bg-green-50' : 'bg-red-50'
                      )}
                    >
                      {e.direction === 'credit' ? (
                        <ArrowDownLeft className="w-4 h-4 text-green-600" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4 text-red-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {KIND_LABELS[e.kind] ?? e.kind}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <span>{formatDate(e.createdAt)}</span>
                        {e.note && <span>· {e.note}</span>}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={cn('text-sm font-bold', e.direction === 'credit' ? 'text-green-600' : 'text-gray-900')}>
                        {e.direction === 'credit' ? '+' : '-'}{formatBDT(e.amountBdt)}
                      </p>
                      <span className="text-[10px] text-gray-400">{formatBDT(e.balanceAfterBdt)} ব্যালেন্স</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
