import { notFound } from 'next/navigation'
import { auth } from '@/auth'
import { AdminBundlesShell } from '@/components/admin/AdminBundlesShell'

export const metadata = { title: 'AI Packages - UNREAL BS' }

export const dynamic = 'force-dynamic'

export default async function AdminBundlesPage() {
  const session = await auth()
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase()
  if (!session?.user?.email || !adminEmail || session.user.email.trim().toLowerCase() !== adminEmail) {
    notFound()
  }

  return <AdminBundlesShell />
}
