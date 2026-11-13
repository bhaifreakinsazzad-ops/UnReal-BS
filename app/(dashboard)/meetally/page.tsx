import { ComingSoonShell } from '@/components/shared/ComingSoonShell'
import { MeetAllyMarketplaces } from '@/components/shared/MeetAllyMarketplaces'

export const metadata = { title: 'MeetAlly - UnReal Systems' }

// meetally.site (the owner's own platform) doesn't resolve yet (DNS
// failure, verified 2026-07-25) — content here is an honest placeholder
// per the owner's own choice, not fabricated copy.
export default function MeetAllyPage() {
  return (
    <ComingSoonShell
      feature="meetally"
      eyebrowEn="Your own platform, integrated"
      eyebrowBn="আপনার নিজস্ব প্ল্যাটফর্ম, সংযুক্ত"
      headlineEn="MeetAlly is coming."
      headlineBn="MeetAlly আসছে।"
      subheadlineEn="Your own MeetAlly platform will be integrated here, alongside curated marketplaces — one place to find talent and get work done."
      subheadlineBn="আপনার নিজস্ব MeetAlly প্ল্যাটফর্ম এখানে সংযুক্ত হবে, বাছাই করা মার্কেটপ্লেসের সাথে — মেধা খুঁজে কাজ করানোর এক জায়গা।"
      features={[
        { emoji: '🤝', titleEn: 'Your platform', titleBn: 'আপনার প্ল্যাটফর্ম', descEn: 'MeetAlly (meetally.site) integrated directly into UnReal Systems.', descBn: 'MeetAlly (meetally.site) সরাসরি UnReal Systems-এ সংযুক্ত।' },
        { emoji: '🌐', titleEn: 'Curated marketplaces', titleBn: 'বাছাই করা মার্কেটপ্লেস', descEn: 'Upwork, Fiverr, and other effective marketplaces in one place.', descBn: 'Upwork, Fiverr এবং অন্যান্য কার্যকর মার্কেটপ্লেস এক জায়গায়।' },
        { emoji: '⚡', titleEn: 'Built for Bangladesh', titleBn: 'বাংলাদেশের জন্য তৈরি', descEn: 'Matched to how local businesses actually hire and get hired.', descBn: 'স্থানীয় ব্যবসা যেভাবে নিয়োগ করে ও নিয়োগ পায় সেভাবে মিলিয়ে তৈরি।' },
      ]}
    >
      <MeetAllyMarketplaces />
    </ComingSoonShell>
  )
}
