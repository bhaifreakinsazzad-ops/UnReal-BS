import { ComingSoonShell } from '@/components/shared/ComingSoonShell'

export const metadata = { title: 'Agentic HQ - UnReal Systems' }

// Was a fabricated agent dashboard: two invented agents shown under a tab
// literally labelled "My Agents", one with a green "running" pill claiming it
// had executed 47 times — so a user would believe automations were already
// messaging their customers and would not build the real follow-up process.
// The play/pause, settings and install buttons had no handlers at all.
export default function AgenticHQPage() {
  return (
    <ComingSoonShell
      feature="agentic_hq"
      eyebrowEn="In development"
      eyebrowBn="তৈরি হচ্ছে"
      headlineEn="Automations that work while your shop is closed."
      headlineBn="আপনার দোকান বন্ধ থাকলেও কাজ করবে এমন অটোমেশন।"
      subheadlineEn="Follow-up bots, appointment setters and reminder agents that run on your own customer list. Nothing is running yet — when it is, you will see real run counts, not sample ones."
      subheadlineBn="ফলো-আপ বট, অ্যাপয়েন্টমেন্ট সেটার ও রিমাইন্ডার এজেন্ট আপনার নিজের কাস্টমার তালিকায় চলবে। এখনো কিছুই চলছে না — চালু হলে আপনি আসল সংখ্যা দেখবেন, নমুনা নয়।"
      features={[
        { emoji: '🤖', titleEn: 'Follow-up on autopilot', titleBn: 'অটোমেটিক ফলো-আপ', descEn: 'Follow up with quiet leads without remembering to.', descBn: 'মনে রাখার দরকার নেই — নিষ্ক্রিয় লিড নিজেই ফলো-আপ করবে।' },
        { emoji: '📅', titleEn: 'Appointment setting', titleBn: 'অ্যাপয়েন্টমেন্ট সেটিং', descEn: 'Book customers in without a back-and-forth.', descBn: 'বারবার কথা না বলেই কাস্টমারের সময় ঠিক করুন।' },
        { emoji: '✅', titleEn: 'Honest run history', titleBn: 'সত্যিকারের রেকর্ড', descEn: 'Every run logged and auditable — no invented activity.', descBn: 'প্রতিটি কাজের সত্যিকারের রেকর্ড — বানানো কিছু নয়।' },
      ]}
    />
  )
}
