'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  BookOpen,
  Plus,
  Search,
  Phone,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  X,
  Clock,
  Send,
  UserPlus,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

interface CreditContact {
  id: string
  name: string
  phone: string
  area: string
  createdAt: string
}

interface CreditEntry {
  id: string
  contactId: string
  amount: number
  description: string
  date: string
  dueDate: string
  paidAmount: number
  status: 'pending' | 'partial' | 'paid'
}

interface PaymentRecord {
  id: string
  entryId: string
  contactId: string
  amount: number
  date: string
  note: string
}

interface LedgerEntry extends CreditEntry {
  payments: PaymentRecord[]
  balance: number
  daysOverdue: number
}

type FilterTab = 'all' | 'overdue' | 'paid'

// ─── Seed data ────────────────────────────────────────────────────────────────

const SEED_CONTACTS: CreditContact[] = [
  { id: 'c1', name: 'মোঃ রাশেদুল ইসলাম', phone: '01712345678', area: 'মিরপুর, ঢাকা', createdAt: '2025-01-10' },
  { id: 'c2', name: 'করিম ট্রেডার্স', phone: '01887654321', area: 'গুলশান, ঢাকা', createdAt: '2025-02-05' },
  { id: 'c3', name: 'সুমাইয়া এন্টারপ্রাইজ', phone: '01911223344', area: 'চট্টগ্রাম', createdAt: '2025-03-12' },
  { id: 'c4', name: 'আবু বকর সিদ্দিক', phone: '01655443322', area: 'সিলেট', createdAt: '2025-04-01' },
  { id: 'c5', name: 'নাহিদ হোলসেল', phone: '01799887766', area: 'নারায়ণগঞ্জ', createdAt: '2025-05-20' },
]

const SEED_ENTRIES: CreditEntry[] = [
  { id: 'e1', contactId: 'c1', amount: 15000, description: 'পণ্য সরবরাহ — ব্যাচ ১২', date: '2026-05-01', dueDate: '2026-05-31', paidAmount: 5000, status: 'partial' },
  { id: 'e2', contactId: 'c1', amount: 8500, description: 'মাসিক অর্ডার — এপ্রিল', date: '2026-04-10', dueDate: '2026-05-10', paidAmount: 0, status: 'pending' },
  { id: 'e3', contactId: 'c2', amount: 32000, description: 'বাল্ক অর্ডার — রমজান স্টক', date: '2026-04-20', dueDate: '2026-05-20', paidAmount: 32000, status: 'paid' },
  { id: 'e4', contactId: 'c2', amount: 18500, description: 'বিশেষ অফার — পণ্য সেট', date: '2026-06-01', dueDate: '2026-06-30', paidAmount: 0, status: 'pending' },
  { id: 'e5', contactId: 'c3', amount: 25000, description: 'কোয়ার্টারলি সাপ্লাই', date: '2026-03-15', dueDate: '2026-04-15', paidAmount: 10000, status: 'partial' },
  { id: 'e6', contactId: 'c4', amount: 7200, description: 'ছোট অর্ডার', date: '2026-06-10', dueDate: '2026-07-10', paidAmount: 0, status: 'pending' },
  { id: 'e7', contactId: 'c5', amount: 45000, description: 'বড় পার্টি অর্ডার — ঈদ', date: '2026-05-15', dueDate: '2026-06-15', paidAmount: 20000, status: 'partial' },
]

const SEED_PAYMENTS: PaymentRecord[] = [
  { id: 'p1', entryId: 'e1', contactId: 'c1', amount: 5000, date: '2026-05-15', note: 'নগদ পেমেন্ট' },
  { id: 'p2', entryId: 'e3', contactId: 'c2', amount: 32000, date: '2026-05-18', note: 'bKash ট্রান্সফার' },
  { id: 'p3', entryId: 'e5', contactId: 'c3', amount: 10000, date: '2026-04-20', note: 'ব্যাংক ট্রান্সফার' },
  { id: 'p4', entryId: 'e7', contactId: 'c5', amount: 20000, date: '2026-06-01', note: 'নগদ পেমেন্ট' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function todayStr(): string {
  return new Date().toISOString().split('T')[0]
}

function dateAfterDays(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

function daysOverdue(dueDate: string): number {
  const due = new Date(dueDate)
  const now = new Date()
  const diff = Math.floor((now.getTime() - due.getTime()) / 86400000)
  return diff > 0 ? diff : 0
}

function fmtBDT(n: number): string {
  return '৳' + n.toLocaleString('bn-BD')
}

function fmtDate(str: string): string {
  return new Date(str).toLocaleDateString('bn-BD', { day: 'numeric', month: 'short', year: 'numeric' })
}

function agingLabel(days: number): { label: string; color: string; bg: string } {
  if (days === 0) return { label: 'মেয়াদ আছে', color: '#00C875', bg: '#F0FDF9' }
  if (days <= 30) return { label: `${days} দিন বাকি`, color: '#F59E0B', bg: '#FFFBEB' }
  if (days <= 60) return { label: `${days} দিন বাকি`, color: '#EF4444', bg: '#FEF2F2' }
  return { label: `${days} দিন! জরুরি`, color: '#DC2626', bg: '#FFF1F1' }
}

function uid(): string {
  return Math.random().toString(36).slice(2, 10)
}

// ─── Storage hook ─────────────────────────────────────────────────────────────

function useKhata() {
  const [contacts, setContacts] = useState<CreditContact[]>([])
  const [entries, setEntries] = useState<CreditEntry[]>([])
  const [payments, setPayments] = useState<PaymentRecord[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    // Deferred to after mount so the client's first render matches the server's (no localStorage on the server).
    try {
      const sc = localStorage.getItem('udhar_contacts')
      const se = localStorage.getItem('udhar_entries')
      const sp = localStorage.getItem('udhar_payments')
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setContacts(sc ? JSON.parse(sc) : SEED_CONTACTS)
      setEntries(se ? JSON.parse(se) : SEED_ENTRIES)
      setPayments(sp ? JSON.parse(sp) : SEED_PAYMENTS)
    } catch {
      setContacts(SEED_CONTACTS)
      setEntries(SEED_ENTRIES)
      setPayments(SEED_PAYMENTS)
    }
    setLoaded(true)
  }, [])

  const save = useCallback((c: CreditContact[], e: CreditEntry[], p: PaymentRecord[]) => {
    localStorage.setItem('udhar_contacts', JSON.stringify(c))
    localStorage.setItem('udhar_entries', JSON.stringify(e))
    localStorage.setItem('udhar_payments', JSON.stringify(p))
  }, [])

  const addContact = (c: Omit<CreditContact, 'id' | 'createdAt'>) => {
    const nc = [...contacts, { ...c, id: uid(), createdAt: todayStr() }]
    setContacts(nc); save(nc, entries, payments)
    return nc[nc.length - 1]
  }

  const addEntry = (e: Omit<CreditEntry, 'id' | 'paidAmount' | 'status'>) => {
    const ne = [...entries, { ...e, id: uid(), paidAmount: 0, status: 'pending' as const }]
    setEntries(ne); save(contacts, ne, payments)
  }

  const addPayment = (p: Omit<PaymentRecord, 'id'>) => {
    const np = [...payments, { ...p, id: uid() }]
    // update entry paid amount + status
    const ne = entries.map(e => {
      if (e.id !== p.entryId) return e
      const paid = np.filter(x => x.entryId === e.id).reduce((s, x) => s + x.amount, 0)
      const status: CreditEntry['status'] = paid >= e.amount ? 'paid' : paid > 0 ? 'partial' : 'pending'
      return { ...e, paidAmount: paid, status }
    })
    setPayments(np); setEntries(ne); save(contacts, ne, np)
  }

  // Derived per-contact totals
  const contactBalance = useCallback((contactId: string) => {
    const ces = entries.filter(e => e.contactId === contactId)
    const total = ces.reduce((s, e) => s + e.amount, 0)
    const paid = ces.reduce((s, e) => s + e.paidAmount, 0)
    return { total, paid, balance: total - paid }
  }, [entries])

  const ledgerForContact = useCallback((contactId: string): LedgerEntry[] => {
    return entries
      .filter(e => e.contactId === contactId)
      .map(e => ({
        ...e,
        payments: payments.filter(p => p.entryId === e.id),
        balance: e.amount - e.paidAmount,
        daysOverdue: e.status !== 'paid' ? daysOverdue(e.dueDate) : 0,
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [entries, payments])

  // Global stats
  const stats = useCallback(() => {
    const pending = entries.filter(e => e.status !== 'paid')
    const totalReceivable = pending.reduce((s, e) => s + (e.amount - e.paidAmount), 0)
    const overdue = pending.filter(e => daysOverdue(e.dueDate) > 0)
    const overdueAmount = overdue.reduce((s, e) => s + (e.amount - e.paidAmount), 0)
    const now = new Date()
    const thisMonth = payments.filter(p => {
      const d = new Date(p.date)
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    })
    const collectedThisMonth = thisMonth.reduce((s, p) => s + p.amount, 0)
    const activeDebtors = new Set(pending.map(e => e.contactId)).size
    return { totalReceivable, overdueAmount, collectedThisMonth, activeDebtors, overdueCount: overdue.length }
  }, [entries, payments])

  return { contacts, entries, payments, loaded, addContact, addEntry, addPayment, contactBalance, ledgerForContact, stats }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  )
}

function InputField({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1.5">{label}</label>
      <input
        {...props}
        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/10 transition-all placeholder:text-gray-300"
      />
    </div>
  )
}

function StatusBadge({ status }: { status: CreditEntry['status'] }) {
  const map = {
    pending: { label: 'বাকি', bg: '#FEF2F2', color: '#EF4444' },
    partial: { label: 'আংশিক', bg: '#FFFBEB', color: '#F59E0B' },
    paid: { label: 'পরিশোধ', bg: '#F0FDF9', color: '#00C875' },
  }
  const s = map[status]
  return (
    <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: s.bg, color: s.color }}>
      {s.label}
    </span>
  )
}

// ─── Add Contact Modal ─────────────────────────────────────────────────────────

function AddContactModal({ onClose, onAdd }: { onClose: () => void; onAdd: (c: Omit<CreditContact, 'id' | 'createdAt'>) => void }) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [area, setArea] = useState('')

  function submit() {
    if (!name.trim() || !phone.trim()) return
    onAdd({ name: name.trim(), phone: phone.trim(), area: area.trim() })
    onClose()
  }

  return (
    <Modal title="নতুন গ্রাহক যোগ করুন" onClose={onClose}>
      <InputField label="গ্রাহকের নাম *" placeholder="মোঃ রাহিম উদ্দিন" value={name} onChange={e => setName(e.target.value)} />
      <InputField label="মোবাইল নম্বর *" placeholder="017XXXXXXXX" value={phone} onChange={e => setPhone(e.target.value)} type="tel" />
      <InputField label="এলাকা / ঠিকানা" placeholder="মিরপুর, ঢাকা" value={area} onChange={e => setArea(e.target.value)} />
      <button
        onClick={submit}
        disabled={!name.trim() || !phone.trim()}
        className="w-full py-3 rounded-xl bg-[#7C3AED] text-white font-semibold text-sm hover:bg-[#6D28D9] transition-colors disabled:opacity-40"
      >
        গ্রাহক যোগ করুন
      </button>
    </Modal>
  )
}

// ─── Add Credit Entry Modal ────────────────────────────────────────────────────

function AddCreditModal({ contacts, defaultContactId, onClose, onAdd }: {
  contacts: CreditContact[]
  defaultContactId?: string
  onClose: () => void
  onAdd: (e: Omit<CreditEntry, 'id' | 'paidAmount' | 'status'>) => void
}) {
  const [contactId, setContactId] = useState(defaultContactId ?? '')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(todayStr())
  const [dueDate, setDueDate] = useState(dateAfterDays(30))

  function submit() {
    if (!contactId || !amount || !description.trim()) return
    onAdd({ contactId, amount: Number(amount), description: description.trim(), date, dueDate })
    onClose()
  }

  return (
    <Modal title="উধার বিক্রি যোগ করুন" onClose={onClose}>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1.5">গ্রাহক বেছে নিন *</label>
        <select
          value={contactId}
          onChange={e => setContactId(e.target.value)}
          className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-[#7C3AED] bg-white"
        >
          <option value="">-- গ্রাহক নির্বাচন করুন --</option>
          {contacts.map(c => <option key={c.id} value={c.id}>{c.name} — {c.phone}</option>)}
        </select>
      </div>
      <InputField label="পণ্য / সেবার বিবরণ *" placeholder="পণ্য সরবরাহ — ব্যাচ নং ১" value={description} onChange={e => setDescription(e.target.value)} />
      <InputField label="মোট টাকার পরিমাণ (৳) *" placeholder="5000" type="number" min="1" value={amount} onChange={e => setAmount(e.target.value)} />
      <div className="grid grid-cols-2 gap-3">
        <InputField label="বিক্রির তারিখ" type="date" value={date} onChange={e => setDate(e.target.value)} />
        <InputField label="শেষ তারিখ (ডেডলাইন)" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
      </div>
      <button
        onClick={submit}
        disabled={!contactId || !amount || !description.trim()}
        className="w-full py-3 rounded-xl bg-[#7C3AED] text-white font-semibold text-sm hover:bg-[#6D28D9] transition-colors disabled:opacity-40"
      >
        উধার রেকর্ড করুন
      </button>
    </Modal>
  )
}

// ─── Record Payment Modal ──────────────────────────────────────────────────────

function RecordPaymentModal({ entry, contact, onClose, onPay }: {
  entry: LedgerEntry
  contact: CreditContact
  onClose: () => void
  onPay: (p: Omit<PaymentRecord, 'id'>) => void
}) {
  const [amount, setAmount] = useState(String(entry.balance))
  const [note, setNote] = useState('')
  const [date, setDate] = useState(todayStr())

  function submit() {
    const n = Number(amount)
    if (!n || n <= 0 || n > entry.balance) return
    onPay({ entryId: entry.id, contactId: entry.contactId, amount: n, date, note: note.trim() })
    onClose()
  }

  return (
    <Modal title="পেমেন্ট রেকর্ড করুন" onClose={onClose}>
      <div className="bg-[#7C3AED]/5 rounded-xl p-3 space-y-1">
        <p className="text-xs text-gray-500">{contact.name} — {entry.description}</p>
        <p className="text-sm font-bold text-[#7C3AED]">বাকি আছে: {fmtBDT(entry.balance)}</p>
      </div>
      <InputField
        label={`পেমেন্টের পরিমাণ (সর্বোচ্চ ${fmtBDT(entry.balance)})`}
        type="number"
        min="1"
        max={entry.balance}
        value={amount}
        onChange={e => setAmount(e.target.value)}
      />
      <InputField label="পেমেন্টের মাধ্যম / নোট" placeholder="নগদ / bKash / ব্যাংক" value={note} onChange={e => setNote(e.target.value)} />
      <InputField label="পেমেন্টের তারিখ" type="date" value={date} onChange={e => setDate(e.target.value)} />
      <div className="flex gap-2">
        <button
          onClick={() => setAmount(String(entry.balance))}
          className="flex-1 py-2.5 rounded-xl border border-[#7C3AED] text-[#7C3AED] text-sm font-medium hover:bg-[#7C3AED]/5 transition-colors"
        >
          সম্পূর্ণ পরিশোধ
        </button>
        <button
          onClick={submit}
          disabled={!amount || Number(amount) <= 0 || Number(amount) > entry.balance}
          className="flex-1 py-2.5 rounded-xl bg-[#00C875] text-white text-sm font-semibold hover:bg-[#00B068] transition-colors disabled:opacity-40"
        >
          পেমেন্ট সেভ করুন
        </button>
      </div>
    </Modal>
  )
}

// ─── Contact Detail View ───────────────────────────────────────────────────────

function ContactLedger({
  contact,
  ledger,
  onBack,
  onAddCredit,
  onRecordPayment,
}: {
  contact: CreditContact
  ledger: LedgerEntry[]
  onBack: () => void
  onAddCredit: () => void
  onRecordPayment: (e: LedgerEntry) => void
}) {
  const totalBalance = ledger.reduce((s, e) => s + e.balance, 0)
  const totalCredit = ledger.reduce((s, e) => s + e.amount, 0)
  const totalPaid = ledger.reduce((s, e) => s + e.paidAmount, 0)
  const hasOverdue = ledger.some(e => e.status !== 'paid' && e.daysOverdue > 0)

  const waMsg = encodeURIComponent(
    `আসসালামুয়ালাইকুম ${contact.name},\n\nআপনার কাছে আমাদের মোট ${fmtBDT(totalBalance)} টাকা পাওনা আছে। অনুগ্রহ করে শীঘ্রই পরিশোধ করুন।\n\n— UnReal BS`
  )
  const waUrl = `https://wa.me/88${contact.phone.replace(/^0/, '')}?text=${waMsg}`

  return (
    <div className="space-y-5">
      {/* Back + header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors flex-shrink-0">
          <ArrowLeft className="w-4 h-4 text-gray-600" />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="font-bold text-gray-900 text-lg truncate">{contact.name}</h2>
          <p className="text-sm text-gray-400">{contact.area} · {contact.phone}</p>
        </div>
      </div>

      {/* Balance summary card */}
      <div className="rounded-2xl p-5 text-white" style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%)' }}>
        <p className="text-white/70 text-sm mb-1">মোট বাকি আছে</p>
        <p className="text-3xl font-bold mb-4">{fmtBDT(totalBalance)}</p>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-white/15 rounded-xl p-3">
            <p className="text-white/60 text-xs mb-0.5">মোট উধার</p>
            <p className="font-bold">{fmtBDT(totalCredit)}</p>
          </div>
          <div className="bg-white/15 rounded-xl p-3">
            <p className="text-white/60 text-xs mb-0.5">মোট পরিশোধ</p>
            <p className="font-bold text-[#00C875]">{fmtBDT(totalPaid)}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onAddCredit}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" /> নতুন উধার
          </button>
          <a
            href={`tel:${contact.phone}`}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-sm font-medium transition-colors"
          >
            <Phone className="w-4 h-4" /> কল করুন
          </a>
          {hasOverdue && (
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#00C875] hover:bg-[#00B068] text-sm font-medium transition-colors"
            >
              <Send className="w-4 h-4" /> রিমাইন্ডার
            </a>
          )}
        </div>
      </div>

      {/* Ledger entries */}
      <div className="space-y-3">
        <h3 className="font-semibold text-gray-900 text-sm">লেনদেনের ইতিহাস ({ledger.length}টি)</h3>
        {ledger.length === 0 ? (
          <div className="text-center py-10 text-gray-400 text-sm">এখনো কোনো লেনদেন নেই</div>
        ) : (
          ledger.map((entry) => {
            const aging = agingLabel(entry.daysOverdue)
            return (
              <div key={entry.id} className={cn(
                'bg-white rounded-2xl border p-4 space-y-3',
                entry.status !== 'paid' && entry.daysOverdue > 0 ? 'border-red-100' : 'border-gray-200'
              )}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm">{entry.description}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-xs text-gray-400">{fmtDate(entry.date)}</span>
                      {entry.status !== 'paid' && (
                        <span className="text-xs px-1.5 py-0.5 rounded-full font-medium" style={{ backgroundColor: aging.bg, color: aging.color }}>
                          {aging.label}
                        </span>
                      )}
                    </div>
                  </div>
                  <StatusBadge status={entry.status} />
                </div>

                {/* Amount bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>মোট: {fmtBDT(entry.amount)}</span>
                    <span>পেয়েছি: {fmtBDT(entry.paidAmount)} · বাকি: <span className="font-bold text-red-500">{fmtBDT(entry.balance)}</span></span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, (entry.paidAmount / entry.amount) * 100)}%`,
                        backgroundColor: entry.status === 'paid' ? '#00C875' : '#7C3AED',
                      }}
                    />
                  </div>
                </div>

                {/* Payment history */}
                {entry.payments.length > 0 && (
                  <div className="bg-gray-50 rounded-xl p-3 space-y-1.5">
                    <p className="text-xs text-gray-400 font-medium">পেমেন্ট ইতিহাস</p>
                    {entry.payments.map(p => (
                      <div key={p.id} className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">{fmtDate(p.date)} {p.note ? `· ${p.note}` : ''}</span>
                        <span className="font-semibold text-[#00C875]">+{fmtBDT(p.amount)}</span>
                      </div>
                    ))}
                  </div>
                )}

                {entry.status !== 'paid' && (
                  <button
                    onClick={() => onRecordPayment(entry)}
                    className="w-full py-2 rounded-xl bg-[#00C875]/10 text-[#00A85A] text-sm font-medium hover:bg-[#00C875]/20 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" /> পেমেন্ট রেকর্ড করুন
                  </button>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

// ─── Main Shell ────────────────────────────────────────────────────────────────

export function UdharKhataShell() {
  const khata = useKhata()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<FilterTab>('all')
  const [selectedContact, setSelectedContact] = useState<CreditContact | null>(null)
  const [showAddContact, setShowAddContact] = useState(false)
  const [showAddCredit, setShowAddCredit] = useState(false)
  const [addCreditForContact, setAddCreditForContact] = useState<string | undefined>()
  const [payingEntry, setPayingEntry] = useState<LedgerEntry | null>(null)

  const s = khata.stats()
  const ledger = selectedContact ? khata.ledgerForContact(selectedContact.id) : []

  const filteredContacts = khata.contacts.filter(c => {
    const q = search.toLowerCase()
    const matchesSearch = !q || c.name.toLowerCase().includes(q) || c.phone.includes(q) || c.area.toLowerCase().includes(q)
    if (!matchesSearch) return false
    const bal = khata.contactBalance(c.id)
    if (filter === 'overdue') {
      const entries = khata.entries.filter(e => e.contactId === c.id && e.status !== 'paid')
      return entries.some(e => daysOverdue(e.dueDate) > 0)
    }
    if (filter === 'paid') return bal.balance === 0
    return true
  }).sort((a, b) => {
    const ba = khata.contactBalance(a.id).balance
    const bb = khata.contactBalance(b.id).balance
    return bb - ba
  })

  if (!khata.loaded) {
    return (
      <div className="p-6 space-y-4 animate-pulse">
        {[1, 2, 3].map(i => <div key={i} className="h-20 bg-gray-100 rounded-2xl" />)}
      </div>
    )
  }

  if (selectedContact) {
    return (
      <div className="p-4 md:p-6 max-w-2xl mx-auto">
        <ContactLedger
          contact={selectedContact}
          ledger={ledger}
          onBack={() => setSelectedContact(null)}
          onAddCredit={() => { setAddCreditForContact(selectedContact.id); setShowAddCredit(true) }}
          onRecordPayment={setPayingEntry}
        />
        {showAddCredit && (
          <AddCreditModal
            contacts={khata.contacts}
            defaultContactId={addCreditForContact}
            onClose={() => { setShowAddCredit(false); setAddCreditForContact(undefined) }}
            onAdd={khata.addEntry}
          />
        )}
        {payingEntry && selectedContact && (
          <RecordPaymentModal
            entry={payingEntry}
            contact={selectedContact}
            onClose={() => setPayingEntry(null)}
            onPay={p => { khata.addPayment(p); setPayingEntry(null) }}
          />
        )}
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-[#7C3AED]/10 flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-[#7C3AED]" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">উধার খাতা</h1>
          </div>
          <p className="text-sm text-gray-500">বাকি বিক্রি ট্র্যাক করুন, সময়মতো আদায় করুন</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAddCredit(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#7C3AED] text-white text-sm font-medium rounded-xl hover:bg-[#6D28D9] transition-colors"
          >
            <Plus className="w-4 h-4" /> উধার যোগ
          </button>
          <button
            onClick={() => setShowAddContact(true)}
            className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors"
          >
            <UserPlus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-xl bg-[#7C3AED]/10 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-[#7C3AED]" />
            </div>
            <span className="text-xs text-gray-400">মোট পাওনা</span>
          </div>
          <p className="text-xl font-bold text-gray-900">{fmtBDT(s.totalReceivable)}</p>
          <p className="text-xs text-gray-400 mt-0.5">{s.activeDebtors} জন গ্রাহক</p>
        </div>
        <div className="bg-white rounded-2xl border border-red-100 p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-red-500" />
            </div>
            <span className="text-xs text-gray-400">মেয়াদ পেরিয়েছে</span>
          </div>
          <p className="text-xl font-bold text-red-600">{fmtBDT(s.overdueAmount)}</p>
          <p className="text-xs text-red-400 mt-0.5">{s.overdueCount}টি এন্ট্রি</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-xl bg-[#00C875]/10 flex items-center justify-center">
              <TrendingDown className="w-4 h-4 text-[#00C875]" />
            </div>
            <span className="text-xs text-gray-400">এই মাসে আদায়</span>
          </div>
          <p className="text-xl font-bold text-[#00C875]">{fmtBDT(s.collectedThisMonth)}</p>
          <p className="text-xs text-gray-400 mt-0.5">এই মাসে পেয়েছি</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center">
              <Clock className="w-4 h-4 text-gray-500" />
            </div>
            <span className="text-xs text-gray-400">মোট গ্রাহক</span>
          </div>
          <p className="text-xl font-bold text-gray-900">{khata.contacts.length}</p>
          <p className="text-xs text-gray-400 mt-0.5">{s.activeDebtors} জনের বাকি আছে</p>
        </div>
      </div>

      {/* Search + Filter */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
          <input
            type="text"
            placeholder="গ্রাহক খুঁজুন..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/10 bg-white"
          />
        </div>
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
          {([['all', 'সবাই'], ['overdue', 'বাকি'], ['paid', 'ক্লিয়ার']] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                filter === key ? 'bg-white text-[#7C3AED] shadow-sm' : 'text-gray-500 hover:text-gray-700'
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Contact list */}
      <div className="space-y-2">
        {filteredContacts.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">কোনো গ্রাহক পাওয়া যায়নি</p>
            <button onClick={() => setShowAddContact(true)} className="mt-2 text-[#7C3AED] text-sm hover:underline">নতুন গ্রাহক যোগ করুন</button>
          </div>
        ) : (
          filteredContacts.map(contact => {
            const bal = khata.contactBalance(contact.id)
            const ces = khata.entries.filter(e => e.contactId === contact.id && e.status !== 'paid')
            const maxOverdue = Math.max(0, ...ces.map(e => daysOverdue(e.dueDate)))
            const aging = agingLabel(maxOverdue)
            const hasBalance = bal.balance > 0

            return (
              <button
                key={contact.id}
                onClick={() => setSelectedContact(contact)}
                className="w-full text-left bg-white rounded-2xl border border-gray-200 p-4 hover:border-[#7C3AED]/30 hover:shadow-sm transition-all flex items-center gap-4"
              >
                {/* Avatar */}
                <div className={cn(
                  'w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold',
                  hasBalance ? 'bg-[#7C3AED]/10 text-[#7C3AED]' : 'bg-[#00C875]/10 text-[#00C875]'
                )}>
                  {contact.name.slice(0, 1)}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-semibold text-gray-900 text-sm truncate">{contact.name}</p>
                    {maxOverdue > 0 && (
                      <span className="text-xs px-1.5 py-0.5 rounded-full flex-shrink-0 font-medium" style={{ backgroundColor: aging.bg, color: aging.color }}>
                        {aging.label}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 truncate">{contact.area} · {contact.phone}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-gray-400">মোট: {fmtBDT(bal.total)}</span>
                    <span className="text-xs text-[#00C875]">পেয়েছি: {fmtBDT(bal.paid)}</span>
                  </div>
                </div>

                {/* Balance */}
                <div className="text-right flex-shrink-0">
                  <p className={cn('text-base font-bold', hasBalance ? 'text-red-500' : 'text-[#00C875]')}>
                    {hasBalance ? fmtBDT(bal.balance) : '✓ ক্লিয়ার'}
                  </p>
                  {hasBalance && <p className="text-xs text-gray-400">বাকি আছে</p>}
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
              </button>
            )
          })
        )}
      </div>

      {/* Modals */}
      {showAddContact && (
        <AddContactModal
          onClose={() => setShowAddContact(false)}
          onAdd={khata.addContact}
        />
      )}
      {showAddCredit && (
        <AddCreditModal
          contacts={khata.contacts}
          defaultContactId={addCreditForContact}
          onClose={() => { setShowAddCredit(false); setAddCreditForContact(undefined) }}
          onAdd={khata.addEntry}
        />
      )}
    </div>
  )
}
