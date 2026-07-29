import { notFound } from 'next/navigation'
import { auth } from '@/auth'
import { AdminAdCampaignsShell } from '@/components/admin/AdminAdCampaignsShell'

export const metadata = { title: 'Ad Campaigns - UNREAL BS' }

export const dynamic = 'force-dynamic'

export default async function AdminAdCampaignsPage() {
  const session = await auth()
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase()
  if (!session?.user?.email || !adminEmail || session.user.email.trim().toLowerCase() !== adminEmail) {
    notFound()
  }

  return <AdminAdCampaignsShell />
}
