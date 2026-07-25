export type OpportunityTier = 'verified' | 'qualified' | 'high-intent' | 'appointment-ready'
export type OpportunityStatus = 'available' | 'accepted' | 'declined' | 'disputed' | 'billable' | 'paid'

export interface OpportunityCard {
  id: string
  title: string
  serviceCategory: string
  location: string
  budgetRange: string
  timeline: string
  intentScore: number
  tier: OpportunityTier
  opportunityCost: number
  status: OpportunityStatus
  exclusive: boolean
  source: 'hoooplaaa' | 'demo' | 'ghl'
  createdAt: string
}

export const STARTER_CREDIT_LIMIT = Number(process.env.HOOOPLAAA_STARTER_CREDIT_LIMIT ?? 5000)

export const demoOpportunities: OpportunityCard[] = [
  {
    id: 'opp-web-dhaka',
    title: 'Business Website',
    serviceCategory: 'Website & Funnel',
    location: 'Dhaka',
    budgetRange: '৳40k-60k',
    timeline: 'Ready this week',
    intentScore: 92,
    tier: 'high-intent',
    opportunityCost: 3500,
    status: 'available',
    exclusive: true,
    source: 'demo',
    createdAt: '2026-07-21',
  },
  {
    id: 'opp-meta-ctg',
    title: 'Meta Ads Setup',
    serviceCategory: 'Paid Acquisition',
    location: 'Chattogram',
    budgetRange: '৳30k-50k',
    timeline: 'Needs launch plan',
    intentScore: 88,
    tier: 'qualified',
    opportunityCost: 2500,
    status: 'available',
    exclusive: false,
    source: 'demo',
    createdAt: '2026-07-22',
  },
  {
    id: 'opp-consult-dhaka',
    title: 'Consultation Booking',
    serviceCategory: 'Appointment System',
    location: 'Dhaka',
    budgetRange: '৳25k-40k',
    timeline: 'Appointment requested',
    intentScore: 95,
    tier: 'appointment-ready',
    opportunityCost: 5000,
    status: 'available',
    exclusive: true,
    source: 'demo',
    createdAt: '2026-07-22',
  },
  {
    id: 'opp-ecom-sylhet',
    title: 'E-commerce Setup',
    serviceCategory: 'Commerce Build',
    location: 'Sylhet',
    budgetRange: '৳70k-120k',
    timeline: 'Within 30 days',
    intentScore: 91,
    tier: 'high-intent',
    opportunityCost: 6000,
    status: 'available',
    exclusive: true,
    source: 'demo',
    createdAt: '2026-07-23',
  },
  {
    id: 'opp-brand-dhaka',
    title: 'Corporate Branding',
    serviceCategory: 'Brand Upgrade',
    location: 'Dhaka',
    budgetRange: '৳50k-90k',
    timeline: 'Comparing vendors',
    intentScore: 84,
    tier: 'qualified',
    opportunityCost: 3000,
    status: 'available',
    exclusive: false,
    source: 'demo',
    createdAt: '2026-07-23',
  },
]

export function formatBDT(amount: number) {
  return new Intl.NumberFormat('en-BD', {
    style: 'currency',
    currency: 'BDT',
    maximumFractionDigits: 0,
  }).format(amount).replace('BDT', '৳')
}

export function applyOpportunityStatuses(
  opportunities: OpportunityCard[],
  statusById: Record<string, OpportunityStatus>
) {
  return opportunities.map((opportunity) => ({
    ...opportunity,
    status: statusById[opportunity.id] ?? opportunity.status,
  }))
}

export function getAcceptedOpportunities(statusById: Record<string, OpportunityStatus> = {}) {
  return applyOpportunityStatuses(demoOpportunities, statusById).filter((opportunity) =>
    ['accepted', 'billable', 'paid'].includes(opportunity.status)
  )
}
