'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
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
  Camera,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLocale } from '@/lib/i18n/context'

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

// ─── Seed data (demo fallback only, shown when persistence is unavailable) ────

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

function fmtBDT(n: number, isBn: boolean): string {
  return '৳' + n.toLocaleString(isBn ? 'bn-BD' : 'en-US')
}

function fmtDate(str: string, isBn: boolean): string {
  return new Date(str).toLocaleDateString(isBn ? 'bn-BD' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })
}

function agingLabel(days: number, isBn: boolean): { label: string; color: string; bg: string } {
  if (days === 0) return { label: isBn ? 'মেয়াদ আছে' : 'Not due', color: '#00C875', bg: '#F0FDF9' }
  if (days <= 30) return { label: isBn ? `${days} দিন বাকি` : `${days}d overdue`, color: '#F59E0B', bg: '#FFFBEB' }
  if (days <= 60) return { label: isBn ? `${days} দিন বাকি` : `${days}d overdue`, color: '#EF4444', bg: '#FEF2F2' }
  return { label: isBn ? `${days} দিন! জরুরি` : `${days}d! Urgent`, color: '#DC2626', bg: '#FFF1F1' }
}

function uid(): string {
  return Math.random().toString(36).slice(2, 10)
}

// ─── Server data mapping ────────────────────────────────────────────────────
// The API persists a coarser shape than the in-memory model (payments are
// scoped to a contact, not a specific entry — see supabase/migrations/
// 0001_unreal_bs_core.sql). On load, payments fetched from the server are
// reconciled against that contact's entries oldest-first (FIFO) to derive
// per-entry paidAmount/status. Within a session, newly recorded payments keep
// their precise entryId in local state (only contactId/amount/date are sent
// to the server), so the UI stays accurate until the next reload.

interface DbContactRow {
  id: string
  name: string
  phone: string | null
  area: string | null
  created_at: string
}

interface DbEntryRow {
  id: string
  contact_id: string
  amount: number | string
  description: string | null
  entry_date: string
  due_date: string | null
}

interface DbPaymentRow {
  id: string
  contact_id: string
  amount: number | string
  paid_at: string
}

function mapContact(row: DbContactRow): CreditContact {
  return { id: row.id, name: row.name, phone: row.phone ?? '', area: row.area ?? '', createdAt: row.created_at }
}

function mapEntryRaw(row: DbEntryRow): CreditEntry {
  return {
    id: row.id,
    contactId: row.contact_id,
    amount: Number(row.amount),
    description: row.description ?? '',
    date: row.entry_date,
    dueDate: row.due_date ?? '',
    paidAmount: 0,
    status: 'pending',
  }
}

function allocatePaymentsFifo(
  entries: CreditEntry[],
  rawPayments: { id: string; contactId: string; amount: number; date: string }[]
): { entries: CreditEntry[]; payments: PaymentRecord[] } {
  const entriesByContact = new Map<string, CreditEntry[]>()
  for (const e of entries) {
    if (!entriesByContact.has(e.contactId)) entriesByContact.set(e.contactId, [])
    entriesByContact.get(e.contactId)!.push(e)
  }
  const paymentsByContact = new Map<string, typeof rawPayments>()
  for (const p of rawPayments) {
    if (!paymentsByContact.has(p.contactId)) paymentsByContact.set(p.contactId, [])
    paymentsByContact.get(p.contactId)!.push(p)
  }

  const resultEntries: CreditEntry[] = []
  const resultPayments: PaymentRecord[] = []

  for (const [contactId, contactEntries] of entriesByContact) {
    const sorted = [...contactEntries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    const remaining = new Map(sorted.map(e => [e.id, e.amount]))
    const paid = new Map(sorted.map(e => [e.id, 0]))
    const contactPays = [...(paymentsByContact.get(contactId) ?? [])].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    )

    for (const p of contactPays) {
      let left = p.amount
      let splitIndex = 0
      for (const e of sorted) {
        if (left <= 0) break
        const rem = remaining.get(e.id) ?? 0
        if (rem <= 0) continue
        const applied = Math.min(rem, left)
        remaining.set(e.id, rem - applied)
        paid.set(e.id, (paid.get(e.id) ?? 0) + applied)
        resultPayments.push({
          id: splitIndex === 0 ? p.id : `${p.id}-${splitIndex}`,
          entryId: e.id,
          contactId,
          amount: applied,
          date: p.date,
          note: '',
        })
        left -= applied
        splitIndex++
      }
    }

    for (const e of sorted) {
      const pd = paid.get(e.id) ?? 0
      const status: CreditEntry['status'] = pd >= e.amount ? 'paid' : pd > 0 ? 'partial' : 'pending'
      resultEntries.push({ ...e, paidAmount: pd, status })
    }
  }

  return { entries: resultEntries, payments: resultPayments }
}

// ─── Data hook ────────────────────────────────────────────────────────────────

function useKhata() {
  const [contacts, setContacts] = useState<CreditContact[]>([])
  const [entries, setEntries] = useState<CreditEntry[]>([])
  const [payments, setPayments] = useState<PaymentRecord[]>([])
  const [loaded, setLoaded] = useState(false)
  const [persistenceError, setPersistenceError] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await fetch('/api/udhar-khata')
        if (!res.ok) throw new Error('request failed')
        const json = (await res.json()) as { contacts: DbContactRow[]; entries: DbEntryRow[]; payments: DbPaymentRow[] }
        if (cancelled) return

        const mappedContacts = (json.contacts ?? []).map(mapContact)
        const rawEntries = (json.entries ?? []).map(mapEntryRaw)
        const rawPayments = (json.payments ?? []).map(row => ({
          id: row.id,
          contactId: row.contact_id,
          amount: Number(row.amount),
          date: row.paid_at,
        }))
        const { entries: derivedEntries, payments: derivedPayments } = allocatePaymentsFifo(rawEntries, rawPayments)

        setContacts(mappedContacts)
        setEntries(derivedEntries)
        setPayments(derivedPayments)
      } catch {
        if (cancelled) return
        setPersistenceError(true)
        setContacts(SEED_CONTACTS)
        setEntries(SEED_ENTRIES)
        setPayments(SEED_PAYMENTS)
      } finally {
        if (!cancelled) setLoaded(true)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  const addContact = useCallback(async (c: Omit<CreditContact, 'id' | 'createdAt'>) => {
    const optimistic: CreditContact = { ...c, id: uid(), createdAt: todayStr() }
    setContacts(prev => [...prev, optimistic])
    try {
      const res = await fetch('/api/udhar-khata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'contact', data: { name: c.name, phone: c.phone, area: c.area } }),
      })
      if (!res.ok) throw new Error('request failed')
      const json = (await res.json()) as { contact: DbContactRow }
      setContacts(prev => prev.map(x => (x.id === optimistic.id ? mapContact(json.contact) : x)))
    } catch {
      setPersistenceError(true)
    }
    return optimistic
  }, [])

  const addEntry = useCallback(async (e: Omit<CreditEntry, 'id' | 'paidAmount' | 'status'>) => {
    const optimistic: CreditEntry = { ...e, id: uid(), paidAmount: 0, status: 'pending' }
    setEntries(prev => [...prev, optimistic])
    try {
      const res = await fetch('/api/udhar-khata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'entry',
          data: { contactId: e.contactId, amount: e.amount, description: e.description, entryDate: e.date, dueDate: e.dueDate },
        }),
      })
      if (!res.ok) throw new Error('request failed')
      const json = (await res.json()) as { entry: DbEntryRow }
      setEntries(prev => prev.map(x => (x.id === optimistic.id ? { ...mapEntryRaw(json.entry), paidAmount: 0, status: 'pending' } : x)))
    } catch {
      setPersistenceError(true)
    }
  }, [])

  const addPayment = useCallback(async (p: Omit<PaymentRecord, 'id'>) => {
    const optimisticId = uid()
    setPayments(prev => {
      const np = [...prev, { ...p, id: optimisticId }]
      setEntries(prevEntries => prevEntries.map(e => {
        if (e.id !== p.entryId) return e
        const paidAmount = np.filter(x => x.entryId === e.id).reduce((s, x) => s + x.amount, 0)
        const status: CreditEntry['status'] = paidAmount >= e.amount ? 'paid' : paidAmount > 0 ? 'partial' : 'pending'
        return { ...e, paidAmount, status }
      }))
      return np
    })
    try {
      const res = await fetch('/api/udhar-khata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'payment', data: { contactId: p.contactId, amount: p.amount, paidAt: p.date } }),
      })
      if (!res.ok) throw new Error('request failed')
      const json = (await res.json()) as { payment: DbPaymentRow }
      setPayments(prev => prev.map(x => (x.id === optimisticId ? { ...x, id: json.payment.id } : x)))
    } catch {
      setPersistenceError(true)
    }
  }, [])

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

  return { contacts, entries, payments, loaded, persistenceError, addContact, addEntry, addPayment, contactBalance, ledgerForContact, stats }
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

function PersistenceBanner() {
  const isBn = useLocale() === 'bn'
  return (
    <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
      <span>
        {isBn
          ? 'ডেটা এখনো সংরক্ষণ হচ্ছে না — এই সেশনের পরে পরিবর্তনগুলো হারিয়ে যাবে।'
          : "Data isn't being saved yet — changes will be lost after this session."}
      </span>
    </div>
  )
}

function StatusBadge({ status }: { status: CreditEntry['status'] }) {
  const isBn = useLocale() === 'bn'
  const map = {
    pending: { label: isBn ? 'বাকি' : 'Pending', bg: '#FEF2F2', color: '#EF4444' },
    partial: { label: isBn ? 'আংশিক' : 'Partial', bg: '#FFFBEB', color: '#F59E0B' },
    paid: { label: isBn ? 'পরিশোধ' : 'Paid', bg: '#F0FDF9', color: '#00C875' },
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
  const isBn = useLocale() === 'bn'
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [area, setArea] = useState('')

  function submit() {
    if (!name.trim() || !phone.trim()) return
    onAdd({ name: name.trim(), phone: phone.trim(), area: area.trim() })
    onClose()
  }

  return (
    <Modal title={isBn ? 'নতুন গ্রাহক যোগ করুন' : 'Add New Customer'} onClose={onClose}>
      <InputField
        label={isBn ? 'গ্রাহকের নাম *' : 'Customer name *'}
        placeholder={isBn ? 'মোঃ রাহিম উদ্দিন' : 'e.g. Rahim Uddin'}
        value={name}
        onChange={e => setName(e.target.value)}
      />
      <InputField
        label={isBn ? 'মোবাইল নম্বর *' : 'Mobile number *'}
        placeholder="017XXXXXXXX"
        value={phone}
        onChange={e => setPhone(e.target.value)}
        type="tel"
      />
      <InputField
        label={isBn ? 'এলাকা / ঠিকানা' : 'Area / address'}
        placeholder={isBn ? 'মিরপুর, ঢাকা' : 'e.g. Mirpur, Dhaka'}
        value={area}
        onChange={e => setArea(e.target.value)}
      />
      <button
        onClick={submit}
        disabled={!name.trim() || !phone.trim()}
        className="w-full py-3 rounded-xl bg-[#7C3AED] text-white font-semibold text-sm hover:bg-[#6D28D9] transition-colors disabled:opacity-40"
      >
        {isBn ? 'গ্রাহক যোগ করুন' : 'Add Customer'}
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
  const isBn = useLocale() === 'bn'
  const [contactId, setContactId] = useState(defaultContactId ?? '')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(todayStr())
  const [dueDate, setDueDate] = useState(dateAfterDays(30))
  const [scanning, setScanning] = useState(false)
  const [scanError, setScanError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function submit() {
    if (!contactId || !amount || !description.trim()) return
    onAdd({ contactId, amount: Number(amount), description: description.trim(), date, dueDate })
    onClose()
  }

  async function handlePhotoSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!window.puter?.ai) {
      setScanError(isBn ? 'AI এখনো লোড হচ্ছে — একটু পর আবার চেষ্টা করুন বা ম্যানুয়ালি লিখুন।' : 'AI is still loading — try again in a moment or enter manually.')
      return
    }

    setScanning(true)
    setScanError(null)
    try {
      const ocrText = await window.puter.ai.img2txt(file)
      const raw = await window.puter.ai.chat(
        [
          {
            role: 'system',
            content:
              'You extract structured data from messy OCR text of a handwritten or printed Bangladeshi khata (credit ledger) entry. ' +
              'The text may be in Bangla, English, or a mix, and may use Bangla numerals. ' +
              'Reply with ONLY a JSON object like {"amount": 1500, "description": "short description"} — no other text. ' +
              'Convert any Bangla numerals to standard digits. If no clear amount is found, use 0. If no clear description is found, use an empty string.',
          },
          { role: 'user', content: ocrText },
        ],
        { model: 'claude-sonnet-5' }
      )

      const text = typeof raw === 'string' ? raw : JSON.stringify(raw)
      const match = text.match(/\{[\s\S]*\}/)
      if (!match) throw new Error('No structured data found')
      const parsed = JSON.parse(match[0]) as { amount?: number | string; description?: string }

      const parsedAmount = Number(parsed.amount)
      if (Number.isFinite(parsedAmount) && parsedAmount > 0) {
        setAmount(String(parsedAmount))
      }
      if (parsed.description) {
        setDescription(String(parsed.description))
      }
    } catch {
      setScanError(isBn ? 'ছবিটি পড়া যায়নি — আবার চেষ্টা করুন বা ম্যানুয়ালি লিখুন।' : "Couldn't read that image — try again or enter manually.")
    } finally {
      setScanning(false)
    }
  }

  return (
    <Modal title={isBn ? 'উধার বিক্রি যোগ করুন' : 'Add Credit Sale'} onClose={onClose}>
      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handlePhotoSelected}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={scanning}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[#7C3AED]/40 bg-[#EDE9FE]/30 py-2.5 text-sm font-medium text-[#7C3AED] transition-colors hover:bg-[#EDE9FE]/60 disabled:opacity-60"
        >
          {scanning ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {isBn ? 'ছবি পড়া হচ্ছে...' : 'Reading photo...'}
            </>
          ) : (
            <>
              <Camera className="h-4 w-4" />
              {isBn ? '📷 ছবি স্ক্যান করুন' : '📷 Scan a photo instead'}
            </>
          )}
        </button>
        {scanError && (
          <p className="mt-1.5 text-xs text-red-500">{scanError}</p>
        )}
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1.5">{isBn ? 'গ্রাহক বেছে নিন *' : 'Select customer *'}</label>
        <select
          value={contactId}
          onChange={e => setContactId(e.target.value)}
          className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-[#7C3AED] bg-white"
        >
          <option value="">{isBn ? '-- গ্রাহক নির্বাচন করুন --' : '-- Select a customer --'}</option>
          {contacts.map(c => <option key={c.id} value={c.id}>{c.name} — {c.phone}</option>)}
        </select>
      </div>
      <InputField
        label={isBn ? 'পণ্য / সেবার বিবরণ *' : 'Product / service description *'}
        placeholder={isBn ? 'পণ্য সরবরাহ — ব্যাচ নং ১' : 'e.g. Goods delivery — batch 1'}
        value={description}
        onChange={e => setDescription(e.target.value)}
      />
      <InputField
        label={isBn ? 'মোট টাকার পরিমাণ (৳) *' : 'Total amount (৳) *'}
        placeholder="5000"
        type="number"
        min="1"
        value={amount}
        onChange={e => setAmount(e.target.value)}
      />
      <div className="grid grid-cols-2 gap-3">
        <InputField label={isBn ? 'বিক্রির তারিখ' : 'Sale date'} type="date" value={date} onChange={e => setDate(e.target.value)} />
        <InputField label={isBn ? 'শেষ তারিখ (ডেডলাইন)' : 'Due date'} type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
      </div>
      <button
        onClick={submit}
        disabled={!contactId || !amount || !description.trim()}
        className="w-full py-3 rounded-xl bg-[#7C3AED] text-white font-semibold text-sm hover:bg-[#6D28D9] transition-colors disabled:opacity-40"
      >
        {isBn ? 'উধার রেকর্ড করুন' : 'Record Credit'}
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
  const isBn = useLocale() === 'bn'
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
    <Modal title={isBn ? 'পেমেন্ট রেকর্ড করুন' : 'Record Payment'} onClose={onClose}>
      <div className="bg-[#7C3AED]/5 rounded-xl p-3 space-y-1">
        <p className="text-xs text-gray-500">{contact.name} — {entry.description}</p>
        <p className="text-sm font-bold text-[#7C3AED]">
          {isBn ? 'বাকি আছে' : 'Outstanding'}: {fmtBDT(entry.balance, isBn)}
        </p>
      </div>
      <InputField
        label={isBn ? `পেমেন্টের পরিমাণ (সর্বোচ্চ ${fmtBDT(entry.balance, isBn)})` : `Payment amount (max ${fmtBDT(entry.balance, isBn)})`}
        type="number"
        min="1"
        max={entry.balance}
        value={amount}
        onChange={e => setAmount(e.target.value)}
      />
      <InputField
        label={isBn ? 'পেমেন্টের মাধ্যম / নোট' : 'Payment method / note'}
        placeholder={isBn ? 'নগদ / bKash / ব্যাংক' : 'Cash / bKash / Bank'}
        value={note}
        onChange={e => setNote(e.target.value)}
      />
      <InputField label={isBn ? 'পেমেন্টের তারিখ' : 'Payment date'} type="date" value={date} onChange={e => setDate(e.target.value)} />
      <div className="flex gap-2">
        <button
          onClick={() => setAmount(String(entry.balance))}
          className="flex-1 py-2.5 rounded-xl border border-[#7C3AED] text-[#7C3AED] text-sm font-medium hover:bg-[#7C3AED]/5 transition-colors"
        >
          {isBn ? 'সম্পূর্ণ পরিশোধ' : 'Full payment'}
        </button>
        <button
          onClick={submit}
          disabled={!amount || Number(amount) <= 0 || Number(amount) > entry.balance}
          className="flex-1 py-2.5 rounded-xl bg-[#00C875] text-white text-sm font-semibold hover:bg-[#00B068] transition-colors disabled:opacity-40"
        >
          {isBn ? 'পেমেন্ট সেভ করুন' : 'Save Payment'}
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
  const isBn = useLocale() === 'bn'
  const totalBalance = ledger.reduce((s, e) => s + e.balance, 0)
  const totalCredit = ledger.reduce((s, e) => s + e.amount, 0)
  const totalPaid = ledger.reduce((s, e) => s + e.paidAmount, 0)
  const hasOverdue = ledger.some(e => e.status !== 'paid' && e.daysOverdue > 0)

  const waMsg = encodeURIComponent(
    `আসসালামুয়ালাইকুম ${contact.name},\n\nআপনার কাছে আমাদের মোট ${fmtBDT(totalBalance, true)} টাকা পাওনা আছে। অনুগ্রহ করে শীঘ্রই পরিশোধ করুন।\n\n— UnReal BS`
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
        <p className="text-white/70 text-sm mb-1">{isBn ? 'মোট বাকি আছে' : 'Total outstanding'}</p>
        <p className="text-3xl font-bold mb-4">{fmtBDT(totalBalance, isBn)}</p>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-white/15 rounded-xl p-3">
            <p className="text-white/60 text-xs mb-0.5">{isBn ? 'মোট উধার' : 'Total credit'}</p>
            <p className="font-bold">{fmtBDT(totalCredit, isBn)}</p>
          </div>
          <div className="bg-white/15 rounded-xl p-3">
            <p className="text-white/60 text-xs mb-0.5">{isBn ? 'মোট পরিশোধ' : 'Total paid'}</p>
            <p className="font-bold text-[#00C875]">{fmtBDT(totalPaid, isBn)}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onAddCredit}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" /> {isBn ? 'নতুন উধার' : 'New credit'}
          </button>
          <a
            href={`tel:${contact.phone}`}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-sm font-medium transition-colors"
          >
            <Phone className="w-4 h-4" /> {isBn ? 'কল করুন' : 'Call'}
          </a>
          {hasOverdue && (
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#00C875] hover:bg-[#00B068] text-sm font-medium transition-colors"
            >
              <Send className="w-4 h-4" /> {isBn ? 'রিমাইন্ডার' : 'Remind'}
            </a>
          )}
        </div>
      </div>

      {/* Ledger entries */}
      <div className="space-y-3">
        <h3 className="font-semibold text-gray-900 text-sm">
          {isBn ? `লেনদেনের ইতিহাস (${ledger.length}টি)` : `Transaction History (${ledger.length})`}
        </h3>
        {ledger.length === 0 ? (
          <div className="text-center py-10 text-gray-400 text-sm">{isBn ? 'এখনো কোনো লেনদেন নেই' : 'No transactions yet'}</div>
        ) : (
          ledger.map((entry) => {
            const aging = agingLabel(entry.daysOverdue, isBn)
            return (
              <div key={entry.id} className={cn(
                'bg-white rounded-2xl border p-4 space-y-3',
                entry.status !== 'paid' && entry.daysOverdue > 0 ? 'border-red-100' : 'border-gray-200'
              )}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm">{entry.description}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-xs text-gray-400">{fmtDate(entry.date, isBn)}</span>
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
                    <span>{isBn ? 'মোট' : 'Total'}: {fmtBDT(entry.amount, isBn)}</span>
                    <span>
                      {isBn ? 'পেয়েছি' : 'Received'}: {fmtBDT(entry.paidAmount, isBn)} · {isBn ? 'বাকি' : 'Due'}:{' '}
                      <span className="font-bold text-red-500">{fmtBDT(entry.balance, isBn)}</span>
                    </span>
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
                    <p className="text-xs text-gray-400 font-medium">{isBn ? 'পেমেন্ট ইতিহাস' : 'Payment history'}</p>
                    {entry.payments.map(p => (
                      <div key={p.id} className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">{fmtDate(p.date, isBn)} {p.note ? `· ${p.note}` : ''}</span>
                        <span className="font-semibold text-[#00C875]">+{fmtBDT(p.amount, isBn)}</span>
                      </div>
                    ))}
                  </div>
                )}

                {entry.status !== 'paid' && (
                  <button
                    onClick={() => onRecordPayment(entry)}
                    className="w-full py-2 rounded-xl bg-[#00C875]/10 text-[#00A85A] text-sm font-medium hover:bg-[#00C875]/20 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" /> {isBn ? 'পেমেন্ট রেকর্ড করুন' : 'Record Payment'}
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
  const isBn = useLocale() === 'bn'
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
      <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-4">
        {khata.persistenceError && <PersistenceBanner />}
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
      {khata.persistenceError && <PersistenceBanner />}
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-[#7C3AED]/10 flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-[#7C3AED]" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">{isBn ? 'উধার খাতা' : 'Udhar Khata'}</h1>
          </div>
          <p className="text-sm text-gray-500">
            {isBn ? 'বাকি বিক্রি ট্র্যাক করুন, সময়মতো আদায় করুন' : 'Track credit sales, collect on time'}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAddCredit(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#7C3AED] text-white text-sm font-medium rounded-xl hover:bg-[#6D28D9] transition-colors"
          >
            <Plus className="w-4 h-4" /> {isBn ? 'উধার যোগ' : 'Add Credit'}
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
            <span className="text-xs text-gray-400">{isBn ? 'মোট পাওনা' : 'Total receivable'}</span>
          </div>
          <p className="text-xl font-bold text-gray-900">{fmtBDT(s.totalReceivable, isBn)}</p>
          <p className="text-xs text-gray-400 mt-0.5">{isBn ? `${s.activeDebtors} জন গ্রাহক` : `${s.activeDebtors} customers`}</p>
        </div>
        <div className="bg-white rounded-2xl border border-red-100 p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-red-500" />
            </div>
            <span className="text-xs text-gray-400">{isBn ? 'মেয়াদ পেরিয়েছে' : 'Overdue'}</span>
          </div>
          <p className="text-xl font-bold text-red-600">{fmtBDT(s.overdueAmount, isBn)}</p>
          <p className="text-xs text-red-400 mt-0.5">{isBn ? `${s.overdueCount}টি এন্ট্রি` : `${s.overdueCount} entries`}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-xl bg-[#00C875]/10 flex items-center justify-center">
              <TrendingDown className="w-4 h-4 text-[#00C875]" />
            </div>
            <span className="text-xs text-gray-400">{isBn ? 'এই মাসে আদায়' : 'Collected this month'}</span>
          </div>
          <p className="text-xl font-bold text-[#00C875]">{fmtBDT(s.collectedThisMonth, isBn)}</p>
          <p className="text-xs text-gray-400 mt-0.5">{isBn ? 'এই মাসে পেয়েছি' : 'Received this month'}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center">
              <Clock className="w-4 h-4 text-gray-500" />
            </div>
            <span className="text-xs text-gray-400">{isBn ? 'মোট গ্রাহক' : 'Total customers'}</span>
          </div>
          <p className="text-xl font-bold text-gray-900">{khata.contacts.length}</p>
          <p className="text-xs text-gray-400 mt-0.5">{isBn ? `${s.activeDebtors} জনের বাকি আছে` : `${s.activeDebtors} owe balances`}</p>
        </div>
      </div>

      {/* Search + Filter */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
          <input
            type="text"
            placeholder={isBn ? 'গ্রাহক খুঁজুন...' : 'Search customers...'}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/10 bg-white"
          />
        </div>
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
          {(isBn
            ? ([['all', 'সবাই'], ['overdue', 'বাকি'], ['paid', 'ক্লিয়ার']] as const)
            : ([['all', 'All'], ['overdue', 'Overdue'], ['paid', 'Cleared']] as const)
          ).map(([key, label]) => (
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
            <p className="text-sm">{isBn ? 'কোনো গ্রাহক পাওয়া যায়নি' : 'No customers found'}</p>
            <button onClick={() => setShowAddContact(true)} className="mt-2 text-[#7C3AED] text-sm hover:underline">
              {isBn ? 'নতুন গ্রাহক যোগ করুন' : 'Add a new customer'}
            </button>
          </div>
        ) : (
          filteredContacts.map(contact => {
            const bal = khata.contactBalance(contact.id)
            const ces = khata.entries.filter(e => e.contactId === contact.id && e.status !== 'paid')
            const maxOverdue = Math.max(0, ...ces.map(e => daysOverdue(e.dueDate)))
            const aging = agingLabel(maxOverdue, isBn)
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
                    <span className="text-xs text-gray-400">{isBn ? 'মোট' : 'Total'}: {fmtBDT(bal.total, isBn)}</span>
                    <span className="text-xs text-[#00C875]">{isBn ? 'পেয়েছি' : 'Received'}: {fmtBDT(bal.paid, isBn)}</span>
                  </div>
                </div>

                {/* Balance */}
                <div className="text-right flex-shrink-0">
                  <p className={cn('text-base font-bold', hasBalance ? 'text-red-500' : 'text-[#00C875]')}>
                    {hasBalance ? fmtBDT(bal.balance, isBn) : (isBn ? '✓ ক্লিয়ার' : '✓ Cleared')}
                  </p>
                  {hasBalance && <p className="text-xs text-gray-400">{isBn ? 'বাকি আছে' : 'Outstanding'}</p>}
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
