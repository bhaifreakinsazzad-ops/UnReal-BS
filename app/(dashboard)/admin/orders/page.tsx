import { notFound } from 'next/navigation'
import { auth } from '@/auth'
import { isAdminEmail } from '@/lib/security/admin'
import { commerceEnabledFor } from '@/lib/commerce/flags'
import { AdminOrdersShell } from '@/components/admin/AdminOrdersShell'

export const metadata = { title: 'Product Orders - UnReal Systems' }

export const dynamic = 'force-dynamic'

export default async function AdminOrdersPage() {
  const session = await auth()
  if (!isAdminEmail(session?.user?.email) || !commerceEnabledFor(session?.user?.email)) {
    notFound()
  }

  return <AdminOrdersShell />
}
