import { notFound } from 'next/navigation'
import { auth } from '@/auth'
import { isAdminEmail } from '@/lib/security/admin'
import { commerceEnabledFor } from '@/lib/commerce/flags'
import { AdminProductsShell } from '@/components/admin/AdminProductsShell'

export const metadata = { title: 'Published Products - UNREAL BS' }

export const dynamic = 'force-dynamic'

export default async function AdminProductsPage() {
  const session = await auth()
  if (!isAdminEmail(session?.user?.email) || !commerceEnabledFor(session?.user?.email)) {
    notFound()
  }

  return <AdminProductsShell />
}
