import { ProductsShell } from '@/components/products/ProductsShell'

export const metadata = { title: 'Digital Products - UNREAL BS' }

export const dynamic = 'force-dynamic'

// Selling does not require a connected GHL workspace — products, orders and
// payouts all live in our own per-user tables. GHL is used only to record the
// buyer as a contact after a sale, and its absence never blocks one.
export default function ProductsPage() {
  return <ProductsShell />
}
