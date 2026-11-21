import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowRight,
  CheckCircle2,
  CreditCard,
  Inbox,
  LineChart,
  Network,
  ShieldCheck,
  Sparkles,
  Users,
  Zap,
} from 'lucide-react'
import { brand } from '@/lib/brand'

const problems = [
  'Software আছে, কিন্তু system owner নেই',
  'Lead আসে, delivery handoff হারিয়ে যায়',
  'Website, CRM, ads, AI আলাদা আলাদা চলছে',
  'Client reporting manual এবং late',
  'Agency grow করতে delivery engine দরকার',
]

const pillars = [
  {
    title: 'SaaS Stack',
    body: 'CRM, inbox, sites, funnels, wallet, products, AI subscriptions, and reporting in one client operating system.',
    icon: Network,
  },
  {
    title: 'Agency Delivery',
    body: 'Managed setup, launch, support, automations, ads, and service execution packages for each client account.',
    icon: Sparkles,
  },
  {
    title: 'AI Workforce',
    body: 'Business assistants, agent studio, developer tools, and provider-backed AI packages ready for operator workflows.',
    icon: Zap,
  },
]

const steps = [
  'Apply',
  'Scope the agency offer',
  'Activate Agency OS',
  'Connect CRM, site, wallet, and AI',
  'Run managed growth sprints',
]

// Illustrative only — these are example figures shown on the marketing page,
// NOT live data. They previously sat under a "Live system" badge, which read as
// a claim about the visitor's own account.
const previewMetrics = [
  { label: 'New leads', value: '52', icon: Users },
  { label: 'Open delivery tasks', value: '12', icon: Inbox },
  { label: 'Managed revenue', value: '৳84,200', icon: CreditCard },
  { label: 'Client wallet', value: '৳720', icon: ShieldCheck },
]

export function UnrealBSLanding() {
  return (
    <main className="min-h-screen bg-[#070B12] text-white">
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/unreal-bs" className="flex items-center gap-3">
            <Image src="/logo.png" alt={brand.name} width={38} height={38} className="rounded-xl" priority />
            <span className="text-sm font-black tracking-wide">{brand.name}</span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-white/70 md:flex">
            <a href="#solution" className="hover:text-white">Agency OS</a>
            <a href="#price" className="hover:text-white">Takeover Offer</a>
            <a href="#how" className="hover:text-white">How it works</a>
          </nav>
          <Link
            href="/apply"
            className="rounded-lg bg-[#D8B86A] px-4 py-2 text-sm font-black text-[#07101F] transition hover:bg-[#F0CE7D]"
          >
            Apply
          </Link>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(0,200,117,0.25),transparent_30%),radial-gradient(circle_at_80%_10%,rgba(124,58,237,0.3),transparent_32%)]" />
        <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:py-24">
          <div className="flex flex-col justify-center">
            <p className="mb-4 text-sm font-bold uppercase tracking-[0.18em] text-[#00C875]">SaaS IT Agency Takeover</p>
            <h1 className="max-w-3xl text-5xl font-black leading-tight sm:text-6xl">
              {brand.name}
              <span className="mt-4 block text-3xl text-[#D8B86A] sm:text-4xl">
                We build, run, and grow the client system behind your agency.
              </span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/75">
              CRM, websites, funnels, ads, AI agents, payments, digital products, and support workflows - one managed SaaS IT agency platform.
            </p>
            <p className="mt-3 max-w-2xl text-base text-white/60">
              Built for Bangladesh founders who want a branded digital agency engine, not another disconnected tool subscription.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/apply"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#00C875] px-6 py-3 text-sm font-black text-[#06110C] transition hover:bg-[#19E08E]"
              >
                Start Agency Takeover
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/apply?intent=demo"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-6 py-3 text-sm font-bold text-white transition hover:bg-white/15"
              >
                Request Operator Demo
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 shadow-2xl shadow-black/30 backdrop-blur">
            <div className="rounded-xl bg-[#10172A] p-5">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <p className="text-xs text-white/45">Control Room Preview</p>
                  <p className="text-lg font-black">Agency command signal</p>
                </div>
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white/60">Example view</span>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3">
                {previewMetrics.map(({ label, value, icon: Icon }) => (
                  <div key={label} className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                    <Icon className="mb-4 h-5 w-5 text-[#D8B86A]" />
                    <p className="text-2xl font-black">{value}</p>
                    <p className="text-xs text-white/50">{label}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-xl border border-[#00C875]/20 bg-[#00C875]/10 p-4">
                <p className="text-sm font-bold text-[#00C875]">Next Best Action</p>
                <p className="mt-1 text-sm text-white/70">Launch the next client sprint with CRM, funnel, AI, and reporting owners assigned.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-3 md:grid-cols-5">
          {problems.map((problem) => (
            <div key={problem} className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
              <CheckCircle2 className="mb-4 h-5 w-5 text-[#D8B86A]" />
              <p className="text-sm font-bold leading-6">{problem}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="solution" className="border-y border-white/10 bg-white/[0.03]">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-black">One branded operating system for SaaS IT agency delivery.</h2>
            <p className="mt-3 text-white/65">
              Your agency should not depend on scattered tools, forgotten follow-up, or manual reporting.
            </p>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {pillars.map((pillar) => {
              const Icon = pillar.icon
              return (
                <div key={pillar.title} className="rounded-2xl border border-white/10 bg-[#10172A] p-6">
                  <Icon className="h-7 w-7 text-[#00C875]" />
                  <h3 className="mt-6 text-xl font-black">{pillar.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-white/65">{pillar.body}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section id="price" className="mx-auto grid max-w-6xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <h2 className="text-3xl font-black">Agency Takeover Membership</h2>
          <p className="mt-4 text-white/65">
            Built for Bangladesh operators who want a branded SaaS IT agency, managed onboarding, and a delivery platform we can keep scaling.
          </p>
        </div>
        <div className="rounded-2xl border border-[#D8B86A]/30 bg-[#D8B86A]/10 p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              ['Agency OS activation', '৳4,999'],
              ['Managed monthly', '৳6,999'],
              ['AI and automation packs', 'From ৳699'],
              ['Wallet, CRM, services', 'Included'],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl bg-[#070B12]/70 p-4">
                <p className="text-xs uppercase tracking-wide text-white/45">{label}</p>
                <p className="mt-2 text-lg font-black text-[#D8B86A]">{value}</p>
              </div>
            ))}
          </div>
          <p className="mt-5 text-sm leading-6 text-white/65">
            Each client scope is confirmed before activation: service type, delivery owner, price, and weekly operating cadence stay visible.
          </p>
        </div>
      </section>

      <section id="how" className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-black">How it works</h2>
            <p className="mt-3 text-white/65">From agency scoping to portal activation to managed growth sprints.</p>
          </div>
          <LineChart className="hidden h-10 w-10 text-[#00C875] sm:block" />
        </div>
        <div className="grid gap-3 md:grid-cols-7">
          {steps.map((step, index) => (
            <div key={step} className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
              <span className="text-xs font-black text-[#00C875]">0{index + 1}</span>
              <p className="mt-3 text-sm font-bold">{step}</p>
            </div>
          ))}
        </div>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/apply"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#00C875] px-6 py-3 text-sm font-black text-[#06110C] transition hover:bg-[#19E08E]"
          >
            Claim Agency Takeover Slot
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/apply?intent=credit"
            className="inline-flex items-center justify-center rounded-xl border border-white/20 px-6 py-3 text-sm font-bold text-white transition hover:bg-white/10"
          >
            See Managed Service Packs
          </Link>
        </div>
      </section>
    </main>
  )
}
