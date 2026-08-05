'use client'

import { useState } from 'react'
import { CheckCircle2, DatabaseZap, Loader2, ShieldCheck, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { requestPasswordReverification } from '@/lib/security/reverify-client'

type ValidationResponse = {
  ok?: boolean
  message?: string
  destination?: string
  eventId?: string
  eventsReceived?: number
  traceId?: string | null
  missing?: string[]
}

export function MetaDatasetShell() {
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<ValidationResponse | null>(null)

  async function validate() {
    setBusy(true)
    setResult(null)
    try {
      const submit = () => fetch('/api/admin/meta/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
      })
      let response = await submit()
      if (response.status === 428) {
        const password = await requestPasswordReverification(
          'Re-enter your password before sending a synthetic event to Meta Test Events.'
        )
        if (!password) throw new Error('Password re-verification was cancelled.')
        const verified = await fetch('/api/auth/reverify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password }),
        })
        if (!verified.ok) throw new Error('Password verification failed.')
        response = await submit()
      }
      const json = await response.json().catch(() => ({})) as ValidationResponse
      setResult({ ...json, ok: response.ok && json.ok === true })
    } catch (error) {
      setResult({ ok: false, message: error instanceof Error ? error.message : 'Validation failed.' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      <Card className="p-5 md:p-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-violet-700">
              <DatabaseZap className="h-5 w-5" />
              <span className="text-xs font-black uppercase tracking-[0.16em]">Meta dataset</span>
            </div>
            <h2 className="mt-3 text-xl font-black text-slate-950">Test the server connection safely</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Sends one synthetic <strong>CompleteRegistration</strong> event to Meta Test Events.
              It contains no customer data and cannot count as a real campaign conversion.
            </p>
          </div>
          <Button onClick={validate} disabled={busy} className="min-w-44">
            {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
            Validate dataset
          </Button>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {[
            ['Dataset ID', process.env.NEXT_PUBLIC_META_PIXEL_ID || 'Not configured'],
            ['Validation mode', 'Meta Test Events only'],
            ['Real conversion', 'CompleteRegistration after signup'],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{label}</p>
              <p className="mt-1 break-words text-sm font-semibold text-slate-900">{value}</p>
            </div>
          ))}
        </div>
      </Card>

      {result && (
        <Card className={`border p-5 ${result.ok ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'}`}>
          <div className="flex items-start gap-3">
            {result.ok
              ? <CheckCircle2 className="mt-0.5 h-5 w-5 flex-none text-emerald-700" />
              : <XCircle className="mt-0.5 h-5 w-5 flex-none text-red-700" />}
            <div className="min-w-0">
              <p className={`font-bold ${result.ok ? 'text-emerald-950' : 'text-red-950'}`}>
                {result.message || (result.ok ? 'Dataset connection verified.' : 'Dataset validation failed.')}
              </p>
              {result.missing?.length ? (
                <p className="mt-1 text-sm text-red-800">Missing server configuration: {result.missing.join(', ')}</p>
              ) : null}
              {result.ok ? (
                <dl className="mt-3 grid gap-2 text-xs text-emerald-900 sm:grid-cols-2">
                  <div><dt className="font-bold">Events received</dt><dd>{result.eventsReceived}</dd></div>
                  <div><dt className="font-bold">Event ID</dt><dd className="break-all">{result.eventId}</dd></div>
                  {result.traceId ? <div><dt className="font-bold">Meta trace</dt><dd className="break-all">{result.traceId}</dd></div> : null}
                </dl>
              ) : null}
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
