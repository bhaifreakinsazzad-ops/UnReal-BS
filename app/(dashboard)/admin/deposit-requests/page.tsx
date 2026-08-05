import { notFound } from 'next/navigation'
import { auth } from '@/auth'
import { isAdminEmail } from '@/lib/security/admin'
import { AdminDepositRequestsShell } from '@/components/admin/AdminDepositRequestsShell'

export const metadata = { title: 'Deposit Approvals - UNREAL BS' }

export default async function AdminDepositRequestsPage() {
  const session = await auth()
  if (!isAdminEmail(session?.user?.email)) {
    notFound()
  }

  return <AdminDepositRequestsShell />
}
