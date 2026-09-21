import { notFound } from 'next/navigation'
import { auth } from '@/auth'
import { isAdminEmail } from '@/lib/security/admin'
import { AdminUsersShell } from '@/components/admin/AdminUsersShell'

export const metadata = { title: 'Users & Workspaces - UnReal Systems' }

export const dynamic = 'force-dynamic'

export default async function AdminUsersPage() {
  const session = await auth()
  if (!isAdminEmail(session?.user?.email)) {
    notFound()
  }

  return <AdminUsersShell />
}
