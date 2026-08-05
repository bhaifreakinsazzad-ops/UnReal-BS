import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/client'
import { StorefrontShell } from '@/components/storefront/StorefrontChrome'
import { Card } from '@/components/ui/card'

export const dynamic = 'force-dynamic'

// One page listing everything a seller has published, so a shop owner can put
// a single link in their Facebook page bio instead of one per product.

interface StoreRow {
  id: string
  store_name: string | null
  business_name: string | null
  store_bio: string | null
}

async function loadStore(storeSlug: string) {
  if (!isSupabaseConfigured()) return null
  try {
    const supabase = getSupabaseAdmin()
    const { data: seller } = await supabase
      .from('unreal_bs_users')
      .select('id, store_name, business_name, store_bio')
      .eq('store_slug', storeSlug)
      .maybeSingle<StoreRow>()

    if (!seller) return null

    const { data: products } = await supabase
      .from('unreal_bs_digital_products')
      .select('id, slug, kind, title, subtitle, cover_image_url, price_bdt, sales_count')
      .eq('seller_id', seller.id)
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(100)

    return {
      name: seller.store_name ?? seller.business_name ?? storeSlug,
      bio: seller.store_bio,
      products: (products ?? []).map((p) => ({
        id: p.id,
        slug: p.slug,
        kind: p.kind,
        title: p.title,
        subtitle: p.subtitle,
        coverImageUrl: p.cover_image_url,
        priceBdt: Number(p.price_bdt),
        salesCount: p.sales_count,
      })),
    }
  } catch {
    return null
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ storeSlug: string }>
}): Promise<Metadata> {
  const { storeSlug } = await params
  const store = await loadStore(storeSlug)
  if (!store) return { title: 'Not found' }
  return {
    title: store.name,
    description: store.bio ?? `Digital products from ${store.name}`,
    openGraph: { title: store.name, description: store.bio ?? undefined, type: 'website' },
  }
}

export default async function StorePage({
  params,
}: {
  params: Promise<{ storeSlug: string }>
}) {
  const { storeSlug } = await params
  const store = await loadStore(storeSlug)
  if (!store) notFound()

  return (
    <StorefrontShell>
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{store.name}</h1>
          {store.bio && <p className="text-sm text-gray-600 mt-2">{store.bio}</p>}
        </div>

        {store.products.length === 0 ? (
          <Card className="text-center py-10">
            <p className="text-sm text-gray-600">Nothing on sale here yet.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {store.products.map((p) => (
              <Link key={p.id} href={`/p/${p.slug}`}>
                <Card hover className="h-full">
                  {p.coverImageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.coverImageUrl}
                      alt=""
                      className="w-full h-32 object-cover rounded-lg mb-3"
                    />
                  )}
                  <p className="text-sm font-semibold text-gray-900">{p.title}</p>
                  {p.subtitle && (
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{p.subtitle}</p>
                  )}
                  <p className="text-base font-bold text-gray-900 mt-2">
                    {p.priceBdt === 0 ? 'Free' : `৳${p.priceBdt.toLocaleString('en-US')}`}
                  </p>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </StorefrontShell>
  )
}
