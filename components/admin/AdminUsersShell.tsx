'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, Check, Loader2, Users } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface AdminUser {
  id: string
  email: string
  businessName: string | null
  ghlLocationId: string | null
  dailySpendCapBdt: number | null
  freeDailyMessages: number | null
  role: string
  createdAt: string
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
}

// Provisioning screen: assigns each customer their own GHL sub-account.
// Until a user has a location here, every CRM screen shows them an honest
// "workspace being set up" state instead of another tenant's data.
export function AdminUsersShell() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [caps, setCaps] = useState<Record<string, string>>({})
  const [frees, setFrees] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState<string | null>(null)
  const [saved, setSaved] = useState<Record<string, boolean>>({})

  useEffect(() => {
    fetch('/api/admin/users')
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('failed'))))
      .then((json: { users: AdminUser[] }) => {
        const list = json.users ?? []
        setUsers(list)
        setDrafts(Object.fromEntries(list.map((u) => [u.id, u.ghlLocationId ?? ''])))
        setCaps(Object.fromEntries(list.map((u) => [u.id, u.dailySpendCapBdt != null ? String(u.dailySpendCapBdt) : ''])))
        setFrees(Object.fromEntries(list.map((u) => [u.id, u.freeDailyMessages != null ? String(u.freeDailyMessages) : ''])))
      })
      .catch(() => setError('Could not load users.'))
      .finally(() => setLoading(false))
  }, [])

  async function save(u: AdminUser) {
    const raw = (drafts[u.id] ?? '').trim()
    setSaving(u.id)
    setError(null)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: u.id,
          ghlLocationId: raw === '' ? null : raw,
          // Blank means "use the platform default"; 0 is a real value that
          // freezes spending / disables the free tier for this account.
          dailySpendCapBdt: (caps[u.id] ?? '') === '' ? null : Number(caps[u.id]),
          freeDailyMessages: (frees[u.id] ?? '') === '' ? null : Number(frees[u.id]),
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json?.message ?? 'Could not update this user.')

      setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, ghlLocationId: raw === '' ? null : raw } : x)))
      setSaved((s) => ({ ...s, [u.id]: true }))
      setTimeout(() => setSaved((s) => ({ ...s, [u.id]: false })), 2500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update this user.')
    } finally {
      setSaving(null)
    }
  }

  const unprovisioned = users.filter((u) => !u.ghlLocationId).length

  return (
    <div className="mx-auto max-w-[1100px] space-y-5 p-4 md:p-6">
      <div className="rounded-2xl bg-[#07101F] p-5 text-white md:p-7">
        <Badge variant="accent" dot>Admin</Badge>
        <h1 className="mt-4 text-2xl font-black md:text-4xl">Users &amp; Workspaces</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-white/65">
          Assign each customer their own GHL sub-account location id. Until you do, their
          CRM screens show a &quot;workspace being set up&quot; state — they never see another
          customer&apos;s data. Their wallet and AI work from day one regardless.
          Leave the daily cap and free-per-day fields blank to use the platform defaults
          (৳500/day, 10 free messages); enter 0 to freeze an account without deleting it.
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-600">
          <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <Card padding="none" className="overflow-hidden border-gray-200">
        <CardHeader className="border-b border-gray-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-[#7C3AED]" />
            <CardTitle>Registered Users</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {unprovisioned > 0 && <Badge variant="gray">{unprovisioned} awaiting workspace</Badge>}
            <Badge variant="gray">{users.length}</Badge>
          </div>
        </CardHeader>

        <div className="p-5">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading...
            </div>
          ) : users.length === 0 ? (
            <p className="text-sm text-gray-500">No registered users yet.</p>
          ) : (
            <div className="space-y-3">
              {users.map((u) => (
                <div key={u.id} className="rounded-xl border border-gray-200 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-gray-900">
                        {u.businessName || u.email}
                      </p>
                      <p className="text-xs text-gray-500">
                        {u.email} · joined {formatDate(u.createdAt)}
                        {u.ghlLocationId ? '' : ' · no workspace yet'}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-end gap-2">
                      <div className="w-52">
                        <Input
                          label="GHL location id"
                          placeholder="blank = none"
                          value={drafts[u.id] ?? ''}
                          onChange={(e) => setDrafts((d) => ({ ...d, [u.id]: e.target.value }))}
                        />
                      </div>
                      <div className="w-32">
                        <Input
                          label="Daily cap ৳"
                          type="number"
                          placeholder="500"
                          value={caps[u.id] ?? ''}
                          onChange={(e) => setCaps((c) => ({ ...c, [u.id]: e.target.value }))}
                        />
                      </div>
                      <div className="w-28">
                        <Input
                          label="Free/day"
                          type="number"
                          placeholder="10"
                          value={frees[u.id] ?? ''}
                          onChange={(e) => setFrees((f) => ({ ...f, [u.id]: e.target.value }))}
                        />
                      </div>
                      <Button onClick={() => save(u)} loading={saving === u.id} disabled={saving !== null}>
                        {saved[u.id] ? <Check className="h-4 w-4" /> : 'Save'}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
