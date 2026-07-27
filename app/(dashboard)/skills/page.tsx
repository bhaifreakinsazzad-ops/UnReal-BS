import { ComingSoonShell } from '@/components/shared/ComingSoonShell'

export const metadata = { title: 'Skills - UNREAL BS' }

// Was a fake integration catalogue: four integrations flagged "installed" and
// "verified" that were never connected, Install/Uninstall buttons that mutated
// local state only, and a custom-MCP form that collected a real API key into a
// password field with no handler behind it — an inert field inviting real
// secrets is worse than no field at all.
export default function SkillsPage() {
  return (
    <ComingSoonShell
      feature="skills"
      eyebrowEn="In development"
      eyebrowBn="তৈরি হচ্ছে"
      headlineEn="Connect the tools you already use."
      headlineBn="আপনি যে টুলগুলো ব্যবহার করেন সেগুলো যুক্ত করুন।"
      subheadlineEn="Google Sheets, WhatsApp, Facebook Ads and custom MCP servers, connected to your workspace so your AI can actually act on your data. Not connected yet — nothing here is installed."
      subheadlineBn="Google Sheets, WhatsApp, Facebook Ads এবং কাস্টম MCP সার্ভার আপনার ওয়ার্কস্পেসে যুক্ত হবে, যাতে AI আপনার ডেটা নিয়ে কাজ করতে পারে। এখনো যুক্ত হয়নি — এখানে কিছুই ইনস্টল করা নেই।"
      features={[
        { emoji: '🔌', titleEn: 'Real connections', titleBn: 'আসল সংযোগ', descEn: 'A real OAuth connection, not a checkbox that does nothing.', descBn: 'আসল OAuth সংযোগ, শুধু একটি নিষ্ক্রিয় চেকবক্স নয়।' },
        { emoji: '🔐', titleEn: 'Keys kept safe', titleBn: 'কী নিরাপদে থাকবে', descEn: 'Credentials encrypted the same way your card details are.', descBn: 'আপনার কার্ডের তথ্যের মতোই ক্রেডেনশিয়াল এনক্রিপ্ট করা হবে।' },
        { emoji: '⚡', titleEn: 'AI that acts', titleBn: 'কাজ করতে পারে এমন AI', descEn: 'Let the assistant read and update your connected tools.', descBn: 'সহকারী আপনার যুক্ত টুল পড়তে ও আপডেট করতে পারবে।' },
      ]}
    />
  )
}
