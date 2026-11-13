import { ProductEditor } from '@/components/products/ProductEditor'
import { notFound } from 'next/navigation'
import { requireAdminSession } from '@/lib/security/admin'
import { commerceEnabledFor } from '@/lib/commerce/flags'

export const metadata = { title: 'Edit product - UnReal Systems' }

export const dynamic = 'force-dynamic'

export default async function ProductEditorPage({
  params,
}: {
  params: Promise<{ productId: string }>
}) {
  const admin = await requireAdminSession()
  if (admin.error || !commerceEnabledFor(admin.email)) notFound()
  const { productId } = await params
  return <ProductEditor productId={productId} />
}
