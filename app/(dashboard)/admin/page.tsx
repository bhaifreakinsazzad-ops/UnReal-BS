import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowRight, Banknote, CreditCard, Package, Sparkles, Users } from 'lucide-react'
import { auth } from '@/auth'
import { Badge } from '@/components/ui/badge'

export const metadata = { title: 'Admin - UNREAL BS' }

export const dynamic = 'force-dynamic'

// Admin hub. These screens existed but were unreachable from anywhere in the
// UI — the operator had to type the URLs by hand.
const TOOLS = [
  {
    href: '/admin/deposit-requests',
    title: 'Deposit Approvals',
    desc: 'Confirm money received and credit a customer’s wallet. This is the only way to add funds inside the product.',
    icon: Banknote,
    tone: 'bg-[#E8FFF4] text-[#059669]',
  },
  {
    href: '/admin/virtual-cards',
    title: 'Virtual Card Orders',
    desc: 'Assign a card to a pending order. Charges the customer’s wallet and encrypts the credential.',
    icon: CreditCard,
    tone: 'bg-[#EDE9FE] text-[#6D28D9]',
  },
  {
    href: '/admin/users',
    title: 'Users & Workspaces',
    desc: 'See who has registered and give each customer their own GHL workspace. Until you do, their CRM screens stay empty — never another tenant’s data.',
    icon: Users,
    tone: 'bg-[#EAF2FF] text-[#2563EB]',
  },
  {
    href: '/admin/ai-rates',
    title: 'AI Rate Card',
    desc: 'What you charge for metered AI, per model. Review whenever a provider changes its prices.',
    icon: Sparkles,
    tone: 'bg-[#FFF5D8] text-[#A87925]',
  },
  {
    href: '/admin/bundles',
    title: 'AI Packages',
    desc: 'The prepaid packages customers buy. Shows the exact worst-case provider cost and profit for each one.',
    icon: Package,
    tone: 'bg-[#FFE9F0] text-[#BE185D]',
  },
]

export default async function AdminHubPage() {
  const session = await auth()
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase()
  if (!session?.user?.email || !adminEmail || session.user.email.trim().toLowerCase() !== adminEmail) {
    notFound()
  }

  return (
    <div className="mx-auto max-w-[1100px] space-y-5 p-4 md:p-6">
      <div className="rounded-2xl bg-[#07101F] p-5 text-white md:p-7">
        <Badge variant="accent" dot>Operator only</Badge>
        <h1 className="mt-4 text-2xl font-black md:text-4xl">Admin</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-white/65">
          Everything that moves customer money or grants access lives here. Only the
          account configured as ADMIN_EMAIL can see these screens.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {TOOLS.map((t) => {
          const Icon = t.icon
          return (
            <Link
              key={t.href}
              href={t.href}
              className="group rounded-2xl border border-gray-200 bg-white p-5 transition hover:border-[#7C3AED]/30 hover:shadow-[0_10px_40px_rgba(15,23,42,0.06)]"
            >
              <div className="flex items-start gap-3">
                <span className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl ${t.tone}`}>
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-gray-900">{t.title}</p>
                    <ArrowRight className="h-4 w-4 text-gray-300 transition group-hover:text-[#7C3AED]" />
                  </div>
                  <p className="mt-1.5 text-xs leading-relaxed text-gray-500">{t.desc}</p>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
