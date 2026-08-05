import { StorefrontShell } from '@/components/storefront/StorefrontChrome'
import { LearnView } from '@/components/storefront/LearnView'
import { notFound } from 'next/navigation'
import { storefrontEnabledForRequest } from '@/lib/commerce/flags'

export const dynamic = 'force-dynamic'

// noindex: this link IS the buyer's access credential. Letting a crawler index
// it would put paid content in a search result.
export const metadata = {
  title: 'Your purchase',
  robots: { index: false, follow: false },
}

export default async function LearnPage({
  params,
}: {
  params: Promise<{ accessToken: string }>
}) {
  if (!(await storefrontEnabledForRequest())) notFound()
  const { accessToken } = await params
  return (
    <StorefrontShell>
      <LearnView accessToken={accessToken} />
    </StorefrontShell>
  )
}
