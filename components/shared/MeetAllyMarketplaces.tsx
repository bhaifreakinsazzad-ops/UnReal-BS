'use client'

import { useLocale } from '@/lib/i18n/context'

const MARKETPLACES = [
  { name: 'Upwork', emoji: '🟢', descEn: 'Find freelancers and post jobs on the world’s largest freelance marketplace.', descBn: 'বিশ্বের সবচেয়ে বড় ফ্রিল্যান্স মার্কেটপ্লেসে ফ্রিল্যান্সার খুঁজুন এবং কাজ পোস্ট করুন।', url: 'https://www.upwork.com' },
  { name: 'Fiverr', emoji: '🐸', descEn: 'Hire freelancers for fixed-price gigs across every skill category.', descBn: 'প্রতিটি স্কিল ক্যাটাগরিতে নির্দিষ্ট মূল্যের গিগের জন্য ফ্রিল্যান্সার নিয়োগ করুন।', url: 'https://www.fiverr.com' },
]

// meetally.site (the owner's own platform) doesn't resolve yet — the
// Upwork/Fiverr cards below are real, curated external links (same pattern
// as the Integrations page), not deep API integration.
export function MeetAllyMarketplaces() {
  const locale = useLocale()
  const isBn = locale === 'bn'

  return (
    <div className="w-full max-w-2xl mt-6">
      <p className="text-center text-white/40 text-xs uppercase tracking-wide mb-3">
        {isBn ? 'এর মধ্যে মার্কেটপ্লেস দেখুন' : 'Explore marketplaces meanwhile'}
      </p>
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
              <p className="text-gray-400 text-xs leading-relaxed">{isBn ? m.descBn : m.descEn}</p>
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}
