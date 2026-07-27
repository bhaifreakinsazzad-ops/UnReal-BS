import { ComingSoonShell } from '@/components/shared/ComingSoonShell'

export const metadata = { title: 'Clan - UNREAL BS' }

// Was a fully fabricated membership dashboard: two invented "clans", four named
// Bengali members with join dates, and a hardcoded "৳79,000/month revenue" —
// numbers a user could have quoted to a lender. None of it was ever real.
export default function ClanPage() {
  return (
    <ComingSoonShell
      feature="clan"
      eyebrowEn="In development"
      eyebrowBn="তৈরি হচ্ছে"
      headlineEn="Turn your customers into a paying membership."
      headlineBn="আপনার কাস্টমারদের নিয়ে পেইড মেম্বারশিপ তৈরি করুন।"
      subheadlineEn="Recurring revenue from the customers you already have — tiers, member management and content, built for how Bangladeshi businesses actually sell. Not live yet."
      subheadlineBn="আপনার বর্তমান কাস্টমারদের থেকেই নিয়মিত আয় — টিয়ার, মেম্বার ব্যবস্থাপনা ও কন্টেন্ট, বাংলাদেশি ব্যবসার ধরন অনুযায়ী তৈরি। এখনো চালু হয়নি।"
      features={[
        { emoji: '👑', titleEn: 'Membership tiers', titleBn: 'মেম্বারশিপ টিয়ার', descEn: 'Price different levels of access for different customers.', descBn: 'বিভিন্ন কাস্টমারের জন্য বিভিন্ন স্তরের মূল্য নির্ধারণ করুন।' },
        { emoji: '🔁', titleEn: 'Recurring revenue', titleBn: 'নিয়মিত আয়', descEn: 'Predictable monthly income instead of one-off sales.', descBn: 'একবারের বিক্রির বদলে প্রতি মাসে নিশ্চিত আয়।' },
        { emoji: '📊', titleEn: 'Real member data', titleBn: 'আসল মেম্বার ডেটা', descEn: 'Your actual members and revenue — never sample numbers.', descBn: 'আপনার আসল মেম্বার ও আয় — কখনোই নমুনা সংখ্যা নয়।' },
      ]}
    />
  )
}
