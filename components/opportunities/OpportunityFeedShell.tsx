'use client'

import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle2, Clock, MapPin, ShieldCheck, Sparkles, XCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import {
  applyOpportunityStatuses,
  formatBDT,
  type OpportunityCard,
  type OpportunityStatus,
} from '@/lib/unreal/opportunities'
import { cn } from '@/lib/utils'

export function OpportunityFeedShell({ opportunities }: { opportunities: OpportunityCard[] }) {
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

  const visibleOpportunities = useMemo(
    () => applyOpportunityStatuses(opportunities, statusById),
    [opportunities, statusById]
  )

  function updateStatus(id: string, status: OpportunityStatus) {
    setStatusById((current) => ({ ...current, [id]: status }))

    fetch('/api/opportunities/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ opportunityId: id, status }),
    })
      .then(res => {
        if (!res.ok) throw new Error('request failed')
      })
      .catch(() => setPersistenceError(true))
  }

  const acceptedCount = visibleOpportunities.filter((opportunity) =>
    ['accepted', 'billable', 'paid'].includes(opportunity.status)
  ).length

  return (
    <div className="mx-auto max-w-[1440px] space-y-5 p-4 md:p-6">
      {persistenceError && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          <span>Accept/decline choices aren&apos;t persisting yet — they will reset if you leave this page.</span>
        </div>
      )}
      <div className="rounded-2xl bg-[#07101F] p-5 text-white md:p-7">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <Badge variant="accent" dot>Hoooplaaa Opportunity Feed</Badge>
            <h1 className="mt-4 text-2xl font-black md:text-4xl">Opportunities</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/65">
              Review requirement-matched opportunities before acceptance. Full private contact details stay hidden until accepted.
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/10 px-4 py-3">
            <p className="text-xs text-white/45">Accepted in this demo</p>
            <p className="text-2xl font-black text-[#D8B86A]">{acceptedCount}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {visibleOpportunities.map((opportunity) => (
          <OpportunityCardView
            key={opportunity.id}
            opportunity={opportunity}
            onAccept={() => updateStatus(opportunity.id, 'accepted')}
            onDecline={() => updateStatus(opportunity.id, 'declined')}
            onReview={() => updateStatus(opportunity.id, 'disputed')}
          />
        ))}
      </div>
    </div>
  )
}

function OpportunityCardView({
  opportunity,
  onAccept,
  onDecline,
  onReview,
}: {
  opportunity: OpportunityCard
  onAccept: () => void
  onDecline: () => void
  onReview: () => void
}) {
  const isAccepted = ['accepted', 'billable', 'paid'].includes(opportunity.status)
  const isDeclined = opportunity.status === 'declined'
  const isReview = opportunity.status === 'disputed'

  return (
    <Card className={cn('border-gray-200', isAccepted && 'border-[#00C875]/40 bg-[#F5FFF9]')}>
      <CardHeader>
        <div>
          <CardTitle>{opportunity.title}</CardTitle>
          <p className="mt-1 text-sm text-gray-500">{opportunity.serviceCategory}</p>
        </div>
        <Badge variant={isAccepted ? 'success' : isReview ? 'warning' : isDeclined ? 'gray' : 'primary'}>
          {opportunity.status}
        </Badge>
      </CardHeader>

      <div className="grid gap-3 sm:grid-cols-2">
        <Meta icon={MapPin} label="Location" value={opportunity.location} />
        <Meta icon={Clock} label="Timeline" value={opportunity.timeline} />
        <Meta icon={Sparkles} label="Intent score" value={`${opportunity.intentScore}/100`} />
        <Meta icon={ShieldCheck} label="Access" value={opportunity.exclusive ? 'Exclusive' : 'Shared'} />
      </div>

      <div className="mt-5 grid gap-3 rounded-xl border border-gray-100 bg-gray-50 p-4 sm:grid-cols-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-gray-400">Budget</p>
          <p className="mt-1 text-sm font-black text-gray-900">{opportunity.budgetRange}</p>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-gray-400">Tier</p>
          <p className="mt-1 text-sm font-black text-gray-900">{opportunity.tier}</p>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-gray-400">Cost</p>
          <p className="mt-1 text-sm font-black text-gray-900">{formatBDT(opportunity.opportunityCost)}</p>
        </div>
      </div>

      <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-800">
        Opportunity free নয়. Client opportunity accept করার আগে price, type and basic requirement দেখতে পাবে.
      </div>

      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <Button type="button" variant="accent" disabled={isAccepted} onClick={onAccept}>
          <CheckCircle2 className="h-4 w-4" />
          {isAccepted ? 'Accepted' : 'Accept'}
        </Button>
        <Button type="button" variant="outline" disabled={isDeclined} onClick={onDecline}>
          <XCircle className="h-4 w-4" />
          Decline
        </Button>
        <Button type="button" variant="secondary" disabled={isReview} onClick={onReview}>
          <AlertTriangle className="h-4 w-4" />
          Request Review
        </Button>
      </div>
    </Card>
  )
}

function Meta({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-3">
      <Icon className="h-4 w-4 text-[#7C3AED]" />
      <div>
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-sm font-bold text-gray-900">{value}</p>
      </div>
    </div>
  )
}
