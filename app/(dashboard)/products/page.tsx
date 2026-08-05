import { notFound } from 'next/navigation'
import { ProductsShell } from '@/components/products/ProductsShell'
import { requireAdminSession } from '@/lib/security/admin'
import { commerceEnabledFor } from '@/lib/commerce/flags'

export const metadata = { title: 'Platform Products - UNREAL BS' }
export const dynamic = 'force-dynamic'

export default async function ProductsPage() {
  const admin = await requireAdminSession()
  if (admin.error || !commerceEnabledFor(admin.email)) notFound()
  return <ProductsShell />
}
