import { StorefrontShell } from '@/components/storefront/StorefrontChrome'
import { CheckoutView } from '@/components/storefront/CheckoutView'
import { notFound } from 'next/navigation'
import { storefrontEnabledForRequest } from '@/lib/commerce/flags'

export const dynamic = 'force-dynamic'

// noindex: an order page is private to whoever holds the link, and there is no
// reason for a search engine to ever hold one.
export const metadata = {
  title: 'Complete your payment',
  robots: { index: false, follow: false },
}

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ accessToken: string }>
}) {
  if (!(await storefrontEnabledForRequest())) notFound()
  const { accessToken } = await params
  return (
    <StorefrontShell>
      <CheckoutView accessToken={accessToken} />
    </StorefrontShell>
  )
}
