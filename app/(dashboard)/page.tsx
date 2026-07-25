import { DashboardHome } from '@/components/dashboard/DashboardHome'
import { getContacts } from '@/lib/ghl/contacts'
import { getConversations } from '@/lib/ghl/conversations'
import { getOpportunities } from '@/lib/ghl/pipelines'
import { auth } from '@/auth'
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/client'
import { resolveUserIdByEmail } from '@/lib/supabase/user'

const LOCATION_ID = process.env.GHL_LOCATION_ID!

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
  let totalContacts = 52
  let totalConversations = 38
  let pipelineRevenue = 0

  try {
    const [contactsRes, convsRes, oppsRes] = await Promise.all([
      getContacts(LOCATION_ID, 1),
      getConversations(LOCATION_ID, 1),
      getOpportunities(LOCATION_ID).catch(() => ({ opportunities: [] })),
    ])
    totalContacts = contactsRes.meta.total
    totalConversations = convsRes.total
    pipelineRevenue = oppsRes.opportunities.reduce((sum, o) => sum + (o.monetaryValue || 0), 0)
  } catch {
    // Keep the dashboard usable when GHL credentials are not available in local/dev environments.
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
