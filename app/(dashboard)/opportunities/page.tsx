import { ComingSoonShell } from '@/components/shared/ComingSoonShell'

export const metadata = { title: 'Opportunities - UnReal Systems' }

export default function OpportunitiesPage() {
  return (
    <ComingSoonShell
      feature="opportunities"
      eyebrowEn="In active development"
      eyebrowBn="সক্রিয়ভাবে তৈরি হচ্ছে"
      headlineEn="Real leads, matched to your business."
      headlineBn="আসল লিড, আপনার ব্যবসার সাথে মিলিয়ে।"
      subheadlineEn="We're building a live feed of Bangladeshi business opportunities — matched to your service category and location, ready to accept in one tap. Real leads, not a demo."
      subheadlineBn="আমরা বাংলাদেশি ব্যবসার সুযোগের একটি লাইভ ফিড তৈরি করছি — আপনার সার্ভিস ক্যাটাগরি ও অবস্থান অনুযায়ী মিলিয়ে, এক ট্যাপে গ্রহণ করার জন্য প্রস্তুত। আসল লিড, ডেমো নয়।"
      features={[
        { emoji: '🎯', titleEn: 'Matched to you', titleBn: 'আপনার সাথে মিলিয়ে', descEn: 'Leads filtered by your service category, location, and capacity.', descBn: 'আপনার সার্ভিস ক্যাটাগরি, অবস্থান ও সক্ষমতা অনুযায়ী ফিল্টার করা লিড।' },
        { emoji: '⚡', titleEn: 'One-tap accept', titleBn: 'এক ট্যাপে গ্রহণ', descEn: 'Accept or decline instantly — no back-and-forth.', descBn: 'সাথে সাথে গ্রহণ বা প্রত্যাখ্যান করুন — কোনো ঝামেলা নেই।' },
        { emoji: '📈', titleEn: 'Real inventory', titleBn: 'আসল ইনভেন্টরি', descEn: 'Sourced from real demand, not seeded or simulated.', descBn: 'আসল চাহিদা থেকে আসা, সাজানো বা কৃত্রিম নয়।' },
      ]}
    />
  )
}
