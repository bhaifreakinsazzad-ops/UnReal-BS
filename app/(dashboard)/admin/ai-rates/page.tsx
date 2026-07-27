import { notFound } from 'next/navigation'
import { auth } from '@/auth'
import { AdminAIRatesShell } from '@/components/admin/AdminAIRatesShell'

export const metadata = { title: 'AI Rate Card - UNREAL BS' }

export const dynamic = 'force-dynamic'

export default async function AdminAIRatesPage() {
  const session = await auth()
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase()
  if (!session?.user?.email || !adminEmail || session.user.email.trim().toLowerCase() !== adminEmail) {
    notFound()
  }

  return <AdminAIRatesShell />
}
