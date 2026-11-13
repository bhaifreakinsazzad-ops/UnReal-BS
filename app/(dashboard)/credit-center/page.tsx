import { ComingSoonShell } from '@/components/shared/ComingSoonShell'

export const metadata = { title: 'Credit Center - UnReal Systems' }

export default function CreditCenterPage() {
  return (
    <ComingSoonShell
      feature="credit_center"
      eyebrowEn="Powered by CGW Systems"
      eyebrowBn="CGW Systems দ্বারা চালিত"
      headlineEn="Real business credit, for businesses that qualify."
      headlineBn="প্রকৃত ব্যবসায়িক ক্রেডিট, যোগ্য ব্যবসার জন্য।"
      subheadlineEn="We're partnering with CGW Systems to bring eligible Bangladeshi businesses real access to business credit — not a demo limit, actual underwritten credit you can put to work. Launching soon."
      subheadlineBn="আমরা CGW Systems-এর সাথে অংশীদারিত্ব করছি যাতে যোগ্য বাংলাদেশি ব্যবসাগুলো প্রকৃত ব্যবসায়িক ক্রেডিট পেতে পারে — ডেমো লিমিট নয়, প্রকৃত আন্ডাররাইটেন ক্রেডিট যা আপনি কাজে লাগাতে পারবেন। শীঘ্রই আসছে।"
      features={[
        { emoji: '🤝', titleEn: 'Backed by CGW Systems', titleBn: 'CGW Systems-এর সমর্থনে', descEn: 'A real US financial partner, not an in-house simulation.', descBn: 'একটি প্রকৃত মার্কিন আর্থিক পার্টনার, ইন-হাউস সিমুলেশন নয়।' },
        { emoji: '✅', titleEn: 'Eligibility-based', titleBn: 'যোগ্যতা-ভিত্তিক', descEn: 'Credit access for businesses that qualify — real underwriting.', descBn: 'যোগ্য ব্যবসার জন্য ক্রেডিট সুবিধা — প্রকৃত আন্ডাররাইটিং।' },
        { emoji: '🚀', titleEn: 'Built for growth', titleBn: 'প্রবৃদ্ধির জন্য তৈরি', descEn: 'Put real credit to work funding your next opportunity.', descBn: 'আপনার পরবর্তী সুযোগে অর্থায়নের জন্য প্রকৃত ক্রেডিট ব্যবহার করুন।' },
      ]}
    />
  )
}
