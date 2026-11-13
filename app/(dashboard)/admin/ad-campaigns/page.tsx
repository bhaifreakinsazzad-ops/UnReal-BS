import { notFound } from 'next/navigation'
import { auth } from '@/auth'
import { isAdminEmail } from '@/lib/security/admin'
import { AdminAdCampaignsShell } from '@/components/admin/AdminAdCampaignsShell'

export const metadata = { title: 'Ad Campaigns - UnReal Systems' }

export const dynamic = 'force-dynamic'

export default async function AdminAdCampaignsPage() {
  const session = await auth()
  if (!isAdminEmail(session?.user?.email)) {
    notFound()
  }

  return <AdminAdCampaignsShell />
}
