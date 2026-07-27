import { notFound } from 'next/navigation'
import { auth } from '@/auth'
import { AdminDepositRequestsShell } from '@/components/admin/AdminDepositRequestsShell'

export const metadata = { title: 'Deposit Approvals - UNREAL BS' }

export default async function AdminDepositRequestsPage() {
  const session = await auth()
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase()
  if (!session?.user?.email || !adminEmail || session.user.email.trim().toLowerCase() !== adminEmail) {
    notFound()
  }

  return <AdminDepositRequestsShell />
}
