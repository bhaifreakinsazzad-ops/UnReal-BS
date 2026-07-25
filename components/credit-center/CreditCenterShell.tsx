'use client'

import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, CalendarClock, CreditCard, FileCheck2, ShieldCheck, WalletCards } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import {
  applyOpportunityStatuses,
  formatBDT,
  STARTER_CREDIT_LIMIT,
  type OpportunityCard,
  type OpportunityStatus,
} from '@/lib/unreal/opportunities'

export function CreditCenterShell({ opportunities }: { opportunities: OpportunityCard[] }) {
  const [statusById, setStatusById] = useState<Record<string, OpportunityStatus>>({})
  const [persistenceError, setPersistenceError] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch('/api/opportunities/status')
      .then(res => {
        if (!res.ok) throw new Error('request failed')
        return res.json() as Promise<{ statusById: Record<string, OpportunityStatus> }>
      })
      .then(json => {
        if (!cancelled) setStatusById(json.statusById ?? {})
      })
      .catch(() => {
        if (!cancelled) setPersistenceError(true)
      })
    return () => { cancelled = true }
  }, [])

  const accepted = useMemo(
    () => applyOpportunityStatuses(opportunities, statusById).filter((opportunity) =>
      ['accepted', 'billable', 'paid'].includes(opportunity.status)
    ),
    [opportunities, statusById]
  )

  const usedCredit = accepted.reduce((sum, opportunity) => sum + opportunity.opportunityCost, 0)
  const availableCredit = Math.max(0, STARTER_CREDIT_LIMIT - usedCredit)

  const metrics = [
    { label: 'Approved Limit', value: formatBDT(STARTER_CREDIT_LIMIT), icon: ShieldCheck },
    { label: 'Used Credit', value: formatBDT(usedCredit), icon: CreditCard },
    { label: 'Available Credit', value: formatBDT(availableCredit), icon: WalletCards },
    { label: 'Due This Week', value: formatBDT(usedCredit), icon: CalendarClock },
    { label: 'Accepted Opportunities', value: String(accepted.length), icon: FileCheck2 },
    { label: 'Overdue', value: '৳0 / 0', icon: ShieldCheck },
  ]

  return (
    <div className="mx-auto max-w-[1440px] space-y-5 p-4 md:p-6">
      {persistenceError && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          <span>Opportunity status data isn&apos;t persisting yet — this view may not reflect the latest accept/decline actions.</span>
        </div>
      )}
      <div className="rounded-2xl bg-[#07101F] p-5 text-white md:p-7">
        <Badge variant="accent" dot>Opportunity Credit Center</Badge>
        <h1 className="mt-4 text-2xl font-black md:text-4xl">Opportunity Credit Center</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-white/65">
          Accepted opportunity-এর settlement weekly. Demo totals are calculated from accepted demo opportunities only.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {metrics.map((metric) => {
          const Icon = metric.icon
          return (
            <Card key={metric.label} className="border-gray-200">
              <Icon className="mb-5 h-6 w-6 text-[#7C3AED]" />
              <p className="text-2xl font-black text-gray-950">{metric.value}</p>
              <p className="mt-2 text-sm font-bold text-gray-600">{metric.label}</p>
            </Card>
          )
        })}
      </div>

      <Card padding="none" className="overflow-hidden border-gray-200">
        <CardHeader className="border-b border-gray-100 px-5 py-4">
          <CardTitle>Settlement Ledger</CardTitle>
          <Badge variant="gray">Demo source</Badge>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-400">
              <tr>
                <th className="px-5 py-3">Opportunity ID</th>
                <th className="px-5 py-3">Service</th>
                <th className="px-5 py-3">Client preview</th>
                <th className="px-5 py-3">Accepted date</th>
                <th className="px-5 py-3">Cost</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Due date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {accepted.length ? accepted.map((opportunity) => (
                <tr key={opportunity.id}>
                  <td className="px-5 py-4 font-mono text-xs text-gray-500">{opportunity.id}</td>
                  <td className="px-5 py-4 font-bold text-gray-900">{opportunity.title}</td>
                  <td className="px-5 py-4 text-gray-500">{opportunity.location} buyer preview</td>
                  <td className="px-5 py-4 text-gray-500">{new Date().toISOString().slice(0, 10)}</td>
                  <td className="px-5 py-4 font-black text-gray-900">{formatBDT(opportunity.opportunityCost)}</td>
                  <td className="px-5 py-4"><Badge variant="warning">pending</Badge></td>
                  <td className="px-5 py-4 text-gray-500">This week</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-gray-500">
                    No accepted demo opportunities yet. Accept one from Opportunities to preview settlement.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
