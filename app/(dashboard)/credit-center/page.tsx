import { ComingSoonShell } from '@/components/shared/ComingSoonShell'

export const metadata = { title: 'Credit Center - UNREAL BS' }

export default function CreditCenterPage() {
  return (
    <ComingSoonShell
      feature="credit_center"
      eyebrow="Powered by CGW Systems"
      headline="Real business credit, for businesses that qualify."
      subheadline="We're partnering with CGW Systems to bring eligible Bangladeshi businesses real access to business credit — not a demo limit, actual underwritten credit you can put to work. Launching soon."
      features={[
        { emoji: '🤝', title: 'Backed by CGW Systems', desc: 'A real US financial partner, not an in-house simulation.' },
        { emoji: '✅', title: 'Eligibility-based', desc: 'Credit access for businesses that qualify — real underwriting.' },
        { emoji: '🚀', title: 'Built for growth', desc: 'Put real credit to work funding your next opportunity.' },
      ]}
    />
  )
}
