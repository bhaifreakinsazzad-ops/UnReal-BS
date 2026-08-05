import { ProductEditor } from '@/components/products/ProductEditor'

export const metadata = { title: 'Edit product - UNREAL BS' }

export const dynamic = 'force-dynamic'

export default async function ProductEditorPage({
  params,
}: {
  params: Promise<{ productId: string }>
}) {
  const { productId } = await params
  return <ProductEditor productId={productId} />
}
