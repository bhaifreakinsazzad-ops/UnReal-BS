import { notFound } from 'next/navigation'
import { auth } from '@/auth'
import { MetaDatasetShell } from '@/components/admin/MetaDatasetShell'
import { isAdminEmail } from '@/lib/security/admin'

export const metadata = { title: 'Meta Dataset - UnReal Systems' }
export const dynamic = 'force-dynamic'

export default async function MetaDatasetPage() {
  const session = await auth()
  if (!isAdminEmail(session?.user?.email)) notFound()

  return (
    <div className="mx-auto max-w-[980px] space-y-5 p-4 md:p-6">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-700">Operator only</p>
        <h1 className="mt-2 text-2xl font-black text-slate-950 md:text-3xl">Meta Pixel & Dataset</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          Verify that server events reach the same Meta dataset as the consent-gated browser Pixel.
        </p>
      </div>
      <MetaDatasetShell />
    </div>
  )
}
