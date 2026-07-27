import { notFound } from 'next/navigation'
import { auth } from '@/auth'
import { AdminUsersShell } from '@/components/admin/AdminUsersShell'

export const metadata = { title: 'Users & Workspaces - UNREAL BS' }

export const dynamic = 'force-dynamic'

export default async function AdminUsersPage() {
  const session = await auth()
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase()
  if (!session?.user?.email || !adminEmail || session.user.email.trim().toLowerCase() !== adminEmail) {
    notFound()
  }

  return <AdminUsersShell />
}
