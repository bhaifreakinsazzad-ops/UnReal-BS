import { ComingSoonShell } from '@/components/shared/ComingSoonShell'

export const metadata = { title: 'Opportunities - UNREAL BS' }

export default function OpportunitiesPage() {
  return (
    <ComingSoonShell
      feature="opportunities"
      eyebrow="In active development"
      headline="Real leads, matched to your business."
      subheadline="We're building a live feed of Bangladeshi business opportunities — matched to your service category and location, ready to accept in one tap. Real leads, not a demo."
      features={[
        { emoji: '🎯', title: 'Matched to you', desc: 'Leads filtered by your service category, location, and capacity.' },
        { emoji: '⚡', title: 'One-tap accept', desc: 'Accept or decline instantly — no back-and-forth.' },
        { emoji: '📈', title: 'Real inventory', desc: 'Sourced from real demand, not seeded or simulated.' },
      ]}
    />
  )
}
