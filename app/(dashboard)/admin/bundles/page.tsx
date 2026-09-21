import { notFound } from 'next/navigation'
import { auth } from '@/auth'
import { isAdminEmail } from '@/lib/security/admin'
import { AdminBundlesShell } from '@/components/admin/AdminBundlesShell'

export const metadata = { title: 'AI Packages - UnReal Systems' }

export const dynamic = 'force-dynamic'

export default async function AdminBundlesPage() {
  const session = await auth()
  if (!isAdminEmail(session?.user?.email)) {
    notFound()
  }

  return <AdminBundlesShell />
}
