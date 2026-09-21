import { EligibilityApplication } from '@/components/marketing/EligibilityApplication'

export const metadata = {
  title: 'Apply for UnReal Systems Eligibility',
  description: 'Apply for the UnReal Systems founding-client pilot and opportunity credit eligibility.',
}

export default async function ApplyPage({
  searchParams,
}: {
  searchParams: Promise<{ intent?: string; service?: string }>
}) {
  const params = await searchParams
  return <EligibilityApplication intent={params.intent} service={params.service} />
}
