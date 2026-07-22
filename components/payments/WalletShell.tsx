'use client'

import { useState } from 'react'
import { ArrowUpRight, ArrowDownLeft, Wallet, Copy, Check, Clock, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'

type Method = 'bkash' | 'nagad' | 'rocket' | 'usdt' | 'bank' | 'stripe'
type Currency = 'BDT' | 'USDT' | 'USD'
type TxStatus = 'completed' | 'pending' | 'failed'
type TxType = 'send' | 'receive'

interface Transaction {
  id: string
  type: TxType
  method: Method
  amount: number
  currency: Currency
  recipient?: string
  note?: string
  status: TxStatus
  date: string
}

const METHOD_META: Record<Method, { label: string; emoji: string; color: string; currency: Currency; placeholder: string }> = {
  bkash:  { label: 'bKash',          emoji: '🟣', color: 'bg-pink-50 border-pink-200',     currency: 'BDT',  placeholder: '01XXXXXXXXX' },
  nagad:  { label: 'Nagad',           emoji: '🟠', color: 'bg-orange-50 border-orange-200', currency: 'BDT',  placeholder: '01XXXXXXXXX' },
  rocket: { label: 'Rocket (DBBL)',   emoji: '🚀', color: 'bg-purple-50 border-purple-200', currency: 'BDT',  placeholder: '01XXXXXXXXX' },
  usdt:   { label: 'USDT (TRC20)',    emoji: '💎', color: 'bg-teal-50 border-teal-200',     currency: 'USDT', placeholder: 'T...wallet address' },
  bank:   { label: 'ব্যাংক ট্রান্সফার', emoji: '🏦', color: 'bg-blue-50 border-blue-200',   currency: 'BDT',  placeholder: 'অ্যাকাউন্ট নম্বর' },
  stripe: { label: 'Stripe / কার্ড',  emoji: '💳', color: 'bg-indigo-50 border-indigo-200', currency: 'USD',  placeholder: 'Email or card' },
}

const RECEIVE_INFO: Record<Method, { label: string; value: string; extra?: string }> = {
  bkash:  { label: 'bKash নম্বর (Personal)', value: '01700-000000', extra: 'অথবা Merchant নম্বর: 01700-111111' },
  nagad:  { label: 'Nagad নম্বর', value: '01700-000000' },
  rocket: { label: 'Rocket নম্বর (DBBL)', value: '01700-000000' },
  usdt:   { label: 'USDT TRC20 ঠিকানা', value: 'TYxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', extra: 'নেটওয়ার্ক: TRON (TRC20) শুধুমাত্র' },
  bank:   { label: 'ব্যাংক অ্যাকাউন্ট', value: '12345678901234', extra: 'Dutch-Bangla Bank · Branch: Dhanmondi' },
  stripe: { label: 'Stripe Payment Link', value: 'https://pay.stripe.com/xxxxx', extra: 'সব ধরনের আন্তর্জাতিক কার্ড গ্রহণযোগ্য' },
}

const DEMO_TXN: Transaction[] = [
  { id: '1', type: 'receive', method: 'bkash',  amount: 5000,  currency: 'BDT',  recipient: 'রাশেদুল ইসলাম', status: 'completed', date: '2026-07-21T10:30:00', note: 'পণ্য বিক্রয়' },
  { id: '2', type: 'send',    method: 'nagad',  amount: 1200,  currency: 'BDT',  recipient: '01711-XXXXXX',   status: 'completed', date: '2026-07-21T09:00:00', note: 'সাপ্লায়ার পেমেন্ট' },
  { id: '3', type: 'receive', method: 'usdt',   amount: 50,    currency: 'USDT', recipient: 'TYxxx...', status: 'completed', date: '2026-07-20T16:00:00', note: 'ফ্রিল্যান্স পেমেন্ট' },
  { id: '4', type: 'send',    method: 'stripe', amount: 29.99, currency: 'USD',  recipient: 'customer@email.com', status: 'completed', date: '2026-07-20T11:00:00' },
  { id: '5', type: 'receive', method: 'bkash',  amount: 8500,  currency: 'BDT',  recipient: 'করিম সাহেব',    status: 'pending',   date: '2026-07-22T08:00:00', note: 'পেমেন্ট নিশ্চিতকরণ বাকি' },
]

type Tab = 'send' | 'receive' | 'history'

function formatDate(str: string) {
  return new Date(str).toLocaleDateString('bn-BD', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export function WalletShell() {
  const [tab, setTab] = useState<Tab>('history')
  const [method, setMethod] = useState<Method>('bkash')
  const [amount, setAmount] = useState('')
  const [recipient, setRecipient] = useState('')
  const [note, setNote] = useState('')
  const [sending, setSending] = useState(false)
  const [sendDone, setSendDone] = useState(false)
  const [txFilter, setTxFilter] = useState<'all' | 'send' | 'receive'>('all')
  const [copied, setCopied] = useState(false)
  const [transactions, setTransactions] = useState<Transaction[]>(DEMO_TXN)

  const balances = {
    BDT:  transactions.filter(t => t.currency === 'BDT' && t.status === 'completed').reduce((s, t) => s + (t.type === 'receive' ? t.amount : -t.amount), 0),
    USDT: transactions.filter(t => t.currency === 'USDT' && t.status === 'completed').reduce((s, t) => s + (t.type === 'receive' ? t.amount : -t.amount), 0),
    USD:  transactions.filter(t => t.currency === 'USD' && t.status === 'completed').reduce((s, t) => s + (t.type === 'receive' ? t.amount : -t.amount), 0),
  }

  function copyReceive() {
    navigator.clipboard.writeText(RECEIVE_INFO[method].value)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  async function handleSend() {
    if (!amount || !recipient) return
    setSending(true)
    await new Promise(r => setTimeout(r, 2200))
    const tx: Transaction = {
      id: Date.now().toString(),
      type: 'send',
      method,
      amount: parseFloat(amount),
      currency: METHOD_META[method].currency,
      recipient,
      note: note || undefined,
      status: 'pending',
      date: new Date().toISOString(),
    }
    setTransactions(prev => [tx, ...prev])
    setSending(false)
    setSendDone(true)
    setAmount('')
    setRecipient('')
    setNote('')
    setTimeout(() => {
      setSendDone(false)
      setTab('history')
    }, 2500)
  }

  const filteredTx = transactions.filter(t => txFilter === 'all' || t.type === txFilter)

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#0D0D1A] to-[#13132B] px-5 pt-5 pb-8">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <Wallet className="w-5 h-5 text-white" />
            <h1 className="text-white font-bold text-lg">ওয়ালেট</h1>
          </div>
          <button onClick={() => setTransactions(DEMO_TXN)} className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Balance cards */}
        <div className="flex gap-3 overflow-x-auto pb-2">
          {([
            { label: 'বাংলাদেশী টাকা', currency: 'BDT', symbol: '৳', amount: balances.BDT, color: 'from-[#7C3AED] to-[#5B21B6]' },
            { label: 'টেদার (USDT)',   currency: 'USDT', symbol: '◎', amount: balances.USDT, color: 'from-teal-600 to-teal-800' },
            { label: 'মার্কিন ডলার',  currency: 'USD',  symbol: '$', amount: balances.USD, color: 'from-blue-600 to-blue-800' },
          ] as const).map(b => (
            <div key={b.currency} className={cn('flex-shrink-0 bg-gradient-to-br rounded-2xl p-4 min-w-40', b.color)}>
              <p className="text-white/70 text-xs mb-1">{b.label}</p>
              <p className="text-white font-black text-2xl leading-tight">
                {b.symbol} {b.amount.toLocaleString('bn-BD', { maximumFractionDigits: 2 })}
              </p>
              <p className="text-white/50 text-xs mt-1">{b.currency}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Quick actions */}
      <div className="flex gap-3 px-4 -mt-5">
        {([
          { tab: 'send'    as Tab, icon: ArrowUpRight,   label: 'পাঠান',      color: 'bg-white border-gray-200 text-gray-700 hover:border-[#7C3AED]/30' },
          { tab: 'receive' as Tab, icon: ArrowDownLeft,  label: 'গ্রহণ',       color: 'bg-white border-gray-200 text-gray-700 hover:border-[#7C3AED]/30' },
          { tab: 'history' as Tab, icon: Clock,          label: 'ইতিহাস',      color: 'bg-white border-gray-200 text-gray-700 hover:border-[#7C3AED]/30' },
        ]).map(({ tab: t, icon: Icon, label, color }) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl border text-xs font-medium transition-colors shadow-sm',
              tab === t ? 'bg-[#7C3AED] border-[#7C3AED] text-white' : color
            )}
          >
            <Icon className="w-5 h-5" />
            {label}
          </button>
        ))}
      </div>

      <div className="p-4 space-y-4">
        {/* Send */}
        {tab === 'send' && (
          <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
            <h2 className="font-bold text-gray-900">টাকা পাঠান</h2>

            {sendDone ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                  <Check className="w-8 h-8 text-green-600" />
                </div>
                <p className="font-bold text-gray-900 mb-1">পাঠানো হয়েছে!</p>
                <p className="text-sm text-gray-500">ট্রানজেকশন পেন্ডিং অবস্থায় আছে। কনফার্ম হলে আপডেট হবে।</p>
              </div>
            ) : (
              <>
                {/* Method selector */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">পেমেন্ট পদ্ধতি</p>
                  <div className="grid grid-cols-3 gap-2">
                    {(Object.keys(METHOD_META) as Method[]).map(m => (
                      <button
                        key={m}
                        onClick={() => setMethod(m)}
                        className={cn(
                          'flex flex-col items-center gap-1 p-3 rounded-xl border text-xs font-medium transition-colors',
                          method === m
                            ? 'border-[#7C3AED] bg-[#EDE9FE] text-[#7C3AED]'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300'
                        )}
                      >
                        <span className="text-xl">{METHOD_META[m].emoji}</span>
                        <span className="text-[10px] leading-tight text-center">{METHOD_META[m].label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Selected method info banner */}
                <div className={cn('rounded-xl border p-3 flex items-center gap-2.5', METHOD_META[method].color)}>
                  <span className="text-2xl">{METHOD_META[method].emoji}</span>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{METHOD_META[method].label}</p>
                    <p className="text-xs text-gray-500">মুদ্রা: {METHOD_META[method].currency}</p>
                  </div>
                </div>

                {/* Form */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                      পরিমাণ ({METHOD_META[method].currency})
                    </label>
                    <input
                      type="number"
                      value={amount}
                      onChange={e => setAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-xl font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                      প্রাপক ({METHOD_META[method].placeholder})
                    </label>
                    <input
                      type="text"
                      value={recipient}
                      onChange={e => setRecipient(e.target.value)}
                      placeholder={METHOD_META[method].placeholder}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                      নোট (ঐচ্ছিক)
                    </label>
                    <input
                      type="text"
                      value={note}
                      onChange={e => setNote(e.target.value)}
                      placeholder="পেমেন্টের উদ্দেশ্য..."
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED]"
                    />
                  </div>
                </div>

                <button
                  onClick={handleSend}
                  disabled={!amount || !recipient || sending}
                  className="w-full py-3.5 bg-[#7C3AED] text-white font-bold rounded-xl hover:bg-[#6D28D9] disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                >
                  {sending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      প্রক্রিয়াকরণ হচ্ছে...
                    </>
                  ) : (
                    <>
                      <ArrowUpRight className="w-4 h-4" />
                      পাঠান — {amount || '0'} {METHOD_META[method].currency}
                    </>
                  )}
                </button>

                <p className="text-xs text-gray-400 text-center">
                  ⚠️ ট্রানজেকশন পাঠানোর আগে প্রাপকের নম্বর/ঠিকানা যাচাই করুন
                </p>
              </>
            )}
          </div>
        )}

        {/* Receive */}
        {tab === 'receive' && (
          <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
            <h2 className="font-bold text-gray-900">পেমেন্ট গ্রহণ করুন</h2>

            {/* Method tabs */}
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(METHOD_META) as Method[]).map(m => (
                <button
                  key={m}
                  onClick={() => setMethod(m)}
                  className={cn(
                    'flex flex-col items-center gap-1 p-2.5 rounded-xl border text-xs font-medium transition-colors',
                    method === m
                      ? 'border-[#7C3AED] bg-[#EDE9FE] text-[#7C3AED]'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  )}
                >
                  <span className="text-xl">{METHOD_META[m].emoji}</span>
                  <span className="text-[10px] text-center leading-tight">{METHOD_META[m].label}</span>
                </button>
              ))}
            </div>

            {/* Info display */}
            <div className={cn('rounded-2xl border p-5 space-y-4', METHOD_META[method].color)}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">{METHOD_META[method].emoji}</span>
                <p className="font-bold text-gray-900">{METHOD_META[method].label}</p>
              </div>

              <div>
                <p className="text-xs text-gray-500 mb-1">{RECEIVE_INFO[method].label}</p>
                <div className="flex items-center gap-2 bg-white rounded-xl border border-white/80 px-4 py-3">
                  <p className={cn(
                    'flex-1 font-mono text-gray-900 break-all',
                    method === 'usdt' ? 'text-xs' : 'text-sm font-bold'
                  )}>
                    {RECEIVE_INFO[method].value}
                  </p>
                  <button
                    onClick={copyReceive}
                    className="flex-shrink-0 p-1.5 rounded-lg bg-[#7C3AED]/10 text-[#7C3AED] hover:bg-[#7C3AED]/20 transition-colors"
                  >
                    {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                {RECEIVE_INFO[method].extra && (
                  <p className="text-xs text-gray-500 mt-2">{RECEIVE_INFO[method].extra}</p>
                )}
              </div>

              {method === 'usdt' && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                  <p className="text-xs text-amber-700 font-medium">⚠️ শুধুমাত্র TRC20 (TRON) নেটওয়ার্কে পাঠান। অন্য নেটওয়ার্কে পাঠালে টাকা হারিয়ে যাবে।</p>
                </div>
              )}
            </div>

            <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-500 space-y-1">
              <p className="font-medium text-gray-700">পেমেন্ট পাওয়ার পর:</p>
              <p>১. ট্রানজেকশন নিশ্চিত করুন</p>
              <p>২. &ldquo;পাঠান&rdquo; ট্যাবে গিয়ে ইনকামিং ট্রানজেকশন লগ করুন</p>
              <p>৩. ব্যালেন্স স্বয়ংক্রিয়ভাবে আপডেট হবে</p>
            </div>
          </div>
        )}

        {/* History */}
        {tab === 'history' && (
          <div className="space-y-3">
            {/* Filter */}
            <div className="flex gap-2">
              {([['all', 'সব'], ['receive', 'আসা'], ['send', 'যাওয়া']] as const).map(([v, l]) => (
                <button
                  key={v}
                  onClick={() => setTxFilter(v)}
                  className={cn(
                    'px-3 py-1.5 text-xs font-medium rounded-full transition-colors',
                    txFilter === v ? 'bg-[#7C3AED] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
                  )}
                >
                  {l}
                </button>
              ))}
            </div>

            {filteredTx.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-gray-200">
                <Clock className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">কোনো ট্রানজেকশন নেই</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-50 overflow-hidden">
                {filteredTx.map(tx => (
                  <div key={tx.id} className="flex items-center gap-3 p-4">
                    <div className={cn(
                      'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
                      tx.type === 'receive' ? 'bg-green-50' : 'bg-red-50'
                    )}>
                      {tx.type === 'receive'
                        ? <ArrowDownLeft className="w-4 h-4 text-green-600" />
                        : <ArrowUpRight className="w-4 h-4 text-red-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm">{METHOD_META[tx.method].emoji}</span>
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {tx.recipient ?? METHOD_META[tx.method].label}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <span>{formatDate(tx.date)}</span>
                        {tx.note && <span>· {tx.note}</span>}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={cn(
                        'text-sm font-bold',
                        tx.type === 'receive' ? 'text-green-600' : 'text-gray-900'
                      )}>
                        {tx.type === 'receive' ? '+' : '-'}{tx.amount.toLocaleString()} {tx.currency}
                      </p>
                      <span className={cn(
                        'text-[10px] font-medium px-1.5 py-0.5 rounded-full',
                        tx.status === 'completed' ? 'bg-green-100 text-green-700'
                          : tx.status === 'pending' ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-600'
                      )}>
                        {tx.status === 'completed' ? 'সম্পন্ন' : tx.status === 'pending' ? 'পেন্ডিং' : 'ব্যর্থ'}
                      </span>
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
