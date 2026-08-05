import { notFound } from 'next/navigation'
import { auth } from '@/auth'
import { AdminProductsShell } from '@/components/admin/AdminProductsShell'

export const metadata = { title: 'Published Products - UNREAL BS' }

export const dynamic = 'force-dynamic'

export default async function AdminProductsPage() {
  const session = await auth()
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase()
  if (!session?.user?.email || !adminEmail || session.user.email.trim().toLowerCase() !== adminEmail) {
    notFound()
  }

  return <AdminProductsShell />
}
