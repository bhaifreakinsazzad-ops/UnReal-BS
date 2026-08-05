import { StorefrontShell } from '@/components/storefront/StorefrontChrome'
import { LearnView } from '@/components/storefront/LearnView'

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
  const { accessToken } = await params
  return (
    <StorefrontShell>
      <LearnView accessToken={accessToken} />
    </StorefrontShell>
  )
}
