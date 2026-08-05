import { notFound } from 'next/navigation'
import { auth } from '@/auth'
import { AdminOrdersShell } from '@/components/admin/AdminOrdersShell'

export const metadata = { title: 'Product Orders - UNREAL BS' }

export const dynamic = 'force-dynamic'

export default async function AdminOrdersPage() {
  const session = await auth()
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase()
  if (!session?.user?.email || !adminEmail || session.user.email.trim().toLowerCase() !== adminEmail) {
    notFound()
  }

  return <AdminOrdersShell />
}
