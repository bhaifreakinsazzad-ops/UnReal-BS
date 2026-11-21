import Link from 'next/link'
import { ArrowRight, BriefcaseBusiness, CheckCircle2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import type { ServicePack } from '@/lib/unreal/services'
import { brand } from '@/lib/brand'

export function ServicesMarketplaceShell({ services }: { services: ServicePack[] }) {
  return (
    <div className="mx-auto max-w-[1440px] space-y-5 p-4 md:p-6">
      <div className="rounded-2xl bg-[#07101F] p-5 text-white md:p-7">
        <Badge variant="accent" dot>{brand.serviceCatalogName}</Badge>
        <h1 className="mt-4 text-2xl font-black md:text-4xl">Managed SaaS IT Services</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-white/65">
          Starter solution packs for agency clients. Request setup now, then the team scopes the right SaaS, automation, AI, ads, and support path before activation.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {services.map((service) => (
          <Card key={service.slug} className="flex flex-col border-gray-200">
            <BriefcaseBusiness className="mb-5 h-6 w-6 text-[#7C3AED]" />
            <CardHeader>
              <CardTitle>{service.title}</CardTitle>
              <Badge variant="gray">{service.startingPrice}</Badge>
            </CardHeader>
            <p className="text-sm font-bold text-gray-900">{service.painHook}</p>
            <p className="mt-3 flex-1 text-sm leading-6 text-gray-500">{service.fixes}</p>
            <Link
              href={`/apply?intent=service&service=${service.slug}`}
              className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-[#7C3AED] px-4 py-3 text-sm font-black text-white transition hover:bg-[#6D28D9]"
            >
              Request Setup
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Card>
        ))}
      </div>

      <Card className="border-[#D8B86A]/30 bg-[#FFF8E6]">
        <CardHeader>
          <CardTitle>Need a single service only?</CardTitle>
          <Badge variant="warning">Agency catalog</Badge>
        </CardHeader>
        <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
          <p className="text-sm leading-6 text-gray-600">
            Request any individual service from the managed agency catalog. The operator team will confirm scope, price, owner, and delivery path manually before activation.
          </p>
          <Link
            href="/apply?intent=service&service=individual-service"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#07101F] px-5 py-3 text-sm font-black text-white"
          >
            Ask Quote
            <CheckCircle2 className="h-4 w-4" />
          </Link>
        </div>
      </Card>
    </div>
  )
}
