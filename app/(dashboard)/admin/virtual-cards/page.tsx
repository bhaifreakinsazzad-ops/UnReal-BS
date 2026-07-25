import { notFound } from 'next/navigation'
import { auth } from '@/auth'
import { AdminVirtualCardsShell } from '@/components/admin/AdminVirtualCardsShell'

export default async function AdminVirtualCardsPage() {
  const session = await auth()
  const adminEmail = process.env.ADMIN_EMAIL
  if (!session?.user?.email || !adminEmail || session.user.email !== adminEmail) {
    notFound()
  }

  return <AdminVirtualCardsShell />
}
