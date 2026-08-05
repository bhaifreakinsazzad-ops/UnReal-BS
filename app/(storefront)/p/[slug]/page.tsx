import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/client'
import { StorefrontShell } from '@/components/storefront/StorefrontChrome'
import { ProductPublicView, type PublicLesson } from '@/components/storefront/ProductPublicView'
import { storefrontEnabledForRequest } from '@/lib/commerce/flags'

export const dynamic = 'force-dynamic'

// Rendered on the server rather than fetched from the client, for one reason
// that matters more than any other in this market: Facebook and WhatsApp read
// the HTML to build a link preview. A product shared without a title, price
// and picture in the preview gets a fraction of the clicks.

interface Row {
  id: string
  seller_id: string
  slug: string
  kind: string
  title: string
  subtitle: string | null
  description: string | null
  cover_image_url: string | null
  price_bdt: string | number
  compare_at_price_bdt: string | number | null
  delivery_note: string | null
  sales_count: number
}

async function loadProduct(slug: string) {
  if (!(await storefrontEnabledForRequest())) return null
  if (!isSupabaseConfigured()) return null

  try {
    const supabase = getSupabaseAdmin()

    // Only published products are visible. A draft is not reachable by URL
    // even by someone who knows the slug.
    const { data: product } = await supabase
      .from('unreal_bs_digital_products')
      .select('id, seller_id, slug, kind, title, subtitle, description, cover_image_url, price_bdt, compare_at_price_bdt, delivery_note, sales_count')
      .eq('slug', slug)
      .eq('status', 'published')
      .eq('platform_owned', true)
      .maybeSingle<Row>()

    if (!product) return null

    const [{ data: lessons }, { data: assets }, { data: seller }] = await Promise.all([
      supabase
        .from('unreal_bs_product_lessons')
        .select('id, module_title, title, video_url, duration_minutes, position, is_preview')
        .eq('product_id', product.id)
        .order('position', { ascending: true }),
      supabase
        .from('unreal_bs_product_assets')
        .select('id', { count: 'exact' })
        .eq('product_id', product.id),
      supabase
        .from('unreal_bs_users')
        .select('store_name, business_name')
        .eq('id', product.seller_id)
        .maybeSingle(),
    ])

    const lessonRows = lessons ?? []

    return {
      product: {
        slug: product.slug,
        kind: product.kind,
        title: product.title,
        subtitle: product.subtitle,
        description: product.description,
        coverImageUrl: product.cover_image_url,
        priceBdt: Number(product.price_bdt),
        compareAtPriceBdt:
          product.compare_at_price_bdt != null ? Number(product.compare_at_price_bdt) : null,
        salesCount: product.sales_count,
        sellerName: seller?.store_name ?? seller?.business_name ?? null,
        deliveryNote: product.delivery_note,
        lessonCount: lessonRows.length,
        totalMinutes: lessonRows.reduce((s, l) => s + (l.duration_minutes ?? 0), 0),
        fileCount: (assets ?? []).length,
      },
      // The video URL is only included for lessons the seller marked as a free
      // preview. Everything else is a title and a duration until somebody pays
      // — withholding it here rather than hiding it in the UI is the whole
      // difference between a paywall and a suggestion.
      lessons: lessonRows.map<PublicLesson>((l) => ({
        id: l.id,
        moduleTitle: l.module_title,
        title: l.title,
        durationMinutes: l.duration_minutes,
        isPreview: l.is_preview,
        videoUrl: l.is_preview ? l.video_url : null,
      })),
    }
  } catch {
    return null
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const loaded = await loadProduct(slug)
  if (!loaded) return { title: 'Not found' }

  const { product } = loaded
  const price = product.priceBdt === 0 ? 'Free' : `৳${product.priceBdt.toLocaleString('en-US')}`
  const description = product.subtitle ?? product.description?.slice(0, 160) ?? product.title

  return {
    title: `${product.title} — ${price}`,
    description,
    openGraph: {
      title: `${product.title} — ${price}`,
      description,
      type: 'website',
      images: product.coverImageUrl ? [product.coverImageUrl] : undefined,
    },
  }
}

export default async function PublicProductPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const loaded = await loadProduct(slug)
  if (!loaded) notFound()

  return (
    <StorefrontShell>
      <ProductPublicView product={loaded.product} lessons={loaded.lessons} />
    </StorefrontShell>
  )
}
