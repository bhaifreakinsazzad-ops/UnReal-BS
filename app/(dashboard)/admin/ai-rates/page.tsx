import { notFound } from 'next/navigation'
import { auth } from '@/auth'
import { isAdminEmail } from '@/lib/security/admin'
import { AdminAIRatesShell } from '@/components/admin/AdminAIRatesShell'

export const metadata = { title: 'AI Rate Card - UnReal Systems' }

export const dynamic = 'force-dynamic'

export default async function AdminAIRatesPage() {
  const session = await auth()
  if (!isAdminEmail(session?.user?.email)) {
    notFound()
  }

  return <AdminAIRatesShell />
}
