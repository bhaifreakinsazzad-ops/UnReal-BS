import { notFound } from 'next/navigation'
import { auth } from '@/auth'
import { AdminPayoutsShell } from '@/components/admin/AdminPayoutsShell'

export const metadata = { title: 'Seller Payouts - UNREAL BS' }

export const dynamic = 'force-dynamic'

export default async function AdminPayoutsPage() {
  const session = await auth()
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase()
  if (!session?.user?.email || !adminEmail || session.user.email.trim().toLowerCase() !== adminEmail) {
    notFound()
  }

  return <AdminPayoutsShell />
}
