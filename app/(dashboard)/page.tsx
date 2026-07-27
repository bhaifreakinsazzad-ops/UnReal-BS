import { DashboardHome } from '@/components/dashboard/DashboardHome'
import { getContacts } from '@/lib/ghl/contacts'
import { getConversations } from '@/lib/ghl/conversations'
import { getOpportunities } from '@/lib/ghl/pipelines'
import { auth } from '@/auth'
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/client'
import { resolveUserIdByEmail } from '@/lib/supabase/user'
import { logError } from '@/lib/log-error'
import { getTenantLocationId } from '@/lib/tenant'

// This page reads the session and live GHL data on every request. Declaring it
// dynamic stops Next from attempting a static render, which would otherwise
// throw its internal bail-out exception into the GHL catch block below and get
// logged as if it were a real fetch failure.
export const dynamic = 'force-dynamic'

async function getRealMoneySnapshot() {
  if (!isSupabaseConfigured()) return { walletBalance: null, udharOutstanding: null }

  try {
    const session = await auth()
    const email = session?.user?.email
    if (!email) return { walletBalance: null, udharOutstanding: null }

    const userId = await resolveUserIdByEmail(email)
    if (!userId) return { walletBalance: null, udharOutstanding: null }

    const supabase = getSupabaseAdmin()
    const [walletRes, entriesRes, paymentsRes] = await Promise.all([
      supabase.from('unreal_bs_wallets').select('balance_bdt').eq('user_id', userId).maybeSingle(),
      supabase.from('unreal_bs_udhar_entries').select('amount').eq('user_id', userId),
      supabase.from('unreal_bs_udhar_payments').select('amount').eq('user_id', userId),
    ])

    const walletBalance = walletRes.data ? Number(walletRes.data.balance_bdt) : 0
    const totalOwed = (entriesRes.data ?? []).reduce((sum, e) => sum + Number(e.amount), 0)
    const totalPaid = (paymentsRes.data ?? []).reduce((sum, p) => sum + Number(p.amount), 0)
    const udharOutstanding = totalOwed - totalPaid

    return { walletBalance, udharOutstanding }
  } catch {
    return { walletBalance: null, udharOutstanding: null }
  }
}

export default async function DashboardPage() {
  // These start as null, NOT as plausible-looking numbers. They were previously
  // seeded with 52 / 38 (copied from the marketing mockup), so any GHL outage or
  // expired token silently showed every user "52 New Leads — GHL contact total"
  // with no indication the fetch had failed.
  let totalContacts: number | null = null
  let totalConversations: number | null = null
  let pipelineRevenue: number | null = null

  // Per-tenant. A user with no workspace provisioned simply gets null CRM
  // stats (rendered as an em-dash) rather than another merchant's numbers.
  // Their wallet and Udhar Khata figures below are their own regardless.
  const locationId = await getTenantLocationId()

  if (locationId) {
    try {
      const [contactsRes, convsRes, oppsRes] = await Promise.all([
        getContacts(locationId, 1),
        getConversations(locationId, 1),
        getOpportunities(locationId).catch(() => ({ opportunities: [] })),
      ])
      totalContacts = contactsRes.meta.total
      totalConversations = convsRes.total
      pipelineRevenue = oppsRes.opportunities.reduce((sum, o) => sum + (o.monetaryValue || 0), 0)
    } catch (err) {
      await logError('dashboard-ghl-fetch', err)
    }
  }

  const { walletBalance, udharOutstanding } = await getRealMoneySnapshot()

  return (
    <DashboardHome
      totalContacts={totalContacts}
      totalConversations={totalConversations}
      pipelineRevenue={pipelineRevenue}
      walletBalance={walletBalance}
      udharOutstanding={udharOutstanding}
    />
  )
}
