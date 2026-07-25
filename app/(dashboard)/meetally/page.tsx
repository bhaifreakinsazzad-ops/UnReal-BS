import { ComingSoonShell } from '@/components/shared/ComingSoonShell'

export const metadata = { title: 'MeetAlly - UNREAL BS' }

// meetally.site (the owner's own platform) doesn't resolve yet (DNS
// failure, verified 2026-07-25) — content here is an honest placeholder
// per the owner's own choice, not fabricated copy. The Upwork/Fiverr cards
// below are real, curated external links (same pattern as the Integrations
// page) — not deep API integration, since that requires each platform's
// own developer API access, which isn't configured for this app.
const MARKETPLACES = [
  { name: 'Upwork', emoji: '🟢', desc: 'Find freelancers and post jobs on the world’s largest freelance marketplace.', url: 'https://www.upwork.com' },
  { name: 'Fiverr', emoji: '🐸', desc: 'Hire freelancers for fixed-price gigs across every skill category.', url: 'https://www.fiverr.com' },
]

export default function MeetAllyPage() {
  return (
    <ComingSoonShell
      feature="meetally"
      eyebrow="Your own platform, integrated"
      headline="MeetAlly is coming."
      subheadline="Your own MeetAlly platform will be integrated here, alongside curated marketplaces — one place to find talent and get work done."
      features={[
        { emoji: '🤝', title: 'Your platform', desc: 'MeetAlly (meetally.site) integrated directly into UnReal BS.' },
        { emoji: '🌐', title: 'Curated marketplaces', desc: 'Upwork, Fiverr, and other effective marketplaces in one place.' },
        { emoji: '⚡', title: 'Built for Bangladesh', desc: 'Matched to how local businesses actually hire and get hired.' },
      ]}
    >
      <div className="w-full max-w-2xl mt-6">
        <p className="text-center text-white/40 text-xs uppercase tracking-wide mb-3">Explore marketplaces meanwhile</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {MARKETPLACES.map((m) => (
            <a
              key={m.name}
              href={m.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl p-4 hover:bg-white/10 transition-colors"
            >
              <span className="text-2xl flex-shrink-0">{m.emoji}</span>
              <div className="min-w-0">
                <p className="text-white font-semibold text-sm">{m.name} ↗</p>
                <p className="text-gray-400 text-xs leading-relaxed">{m.desc}</p>
              </div>
            </a>
          ))}
        </div>
      </div>
    </ComingSoonShell>
  )
}
