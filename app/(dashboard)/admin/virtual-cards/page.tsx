import { notFound } from 'next/navigation'
import { auth } from '@/auth'
import { isAdminEmail } from '@/lib/security/admin'
import { AdminVirtualCardsShell } from '@/components/admin/AdminVirtualCardsShell'

export default async function AdminVirtualCardsPage() {
  const session = await auth()
  if (!isAdminEmail(session?.user?.email)) {
    notFound()
  }

  return <AdminVirtualCardsShell />
}
