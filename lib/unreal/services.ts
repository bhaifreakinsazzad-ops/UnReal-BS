export interface ServicePack {
  slug: string
  title: string
  painHook: string
  fixes: string
  startingPrice: string
}

export const servicePacks: ServicePack[] = [
  {
    slug: 'lead-response-recovery',
    title: 'Lead Response & Recovery',
    painHook: 'Lead আসে, কিন্তু reply late হয়.',
    fixes: 'Inbox routing, missed-lead alerts, follow-up scripts, and recovery workflow.',
    startingPrice: 'Starts at ৳12,000',
  },
  {
    slug: 'ad-to-sale-conversion',
    title: 'Ad-to-Sale Conversion',
    painHook: 'Ad spend চলছে, sales tracking নেই.',
    fixes: 'Landing flow, CRM capture, pipeline status, and conversion follow-up.',
    startingPrice: 'Starts at ৳18,000',
  },
  {
    slug: 'customer-reactivation',
    title: 'Customer Reactivation',
    painHook: 'Old customers silent হয়ে গেছে.',
    fixes: 'Segmented win-back messaging, offer flow, and response tracking.',
    startingPrice: 'Starts at ৳10,000',
  },
  {
    slug: 'appointment-no-show-control',
    title: 'Appointment & No-Show Control',
    painHook: 'Booking হয়, কিন্তু মানুষ আসে না.',
    fixes: 'Reminder sequences, confirmation flows, reschedule links, and staff alerts.',
    startingPrice: 'Starts at ৳9,000',
  },
  {
    slug: 'trust-review-growth',
    title: 'Trust & Review Growth',
    painHook: 'Good work হচ্ছে, proof জমছে না.',
    fixes: 'Review request system, testimonial capture, and trust asset publishing.',
    startingPrice: 'Starts at ৳8,500',
  },
  {
    slug: 'premium-brand-upgrade',
    title: 'Premium Brand Upgrade',
    painHook: 'Brand looks smaller than the service quality.',
    fixes: 'Brand board, offer copy, visual polish, and customer-facing assets.',
    startingPrice: 'Starts at ৳25,000',
  },
  {
    slug: 'ai-service-worker',
    title: 'AI Service Worker',
    painHook: 'Repeated admin work team time খাচ্ছে.',
    fixes: 'AI-assisted replies, summaries, content drafts, and task prompts.',
    startingPrice: 'Starts at ৳15,000',
  },
  {
    slug: 'sales-team-control',
    title: 'Sales Team Control',
    painHook: 'Staff follow-up করছে কিনা বোঝা যায় না.',
    fixes: 'Pipeline hygiene, activity review, lead ownership, and daily action list.',
    startingPrice: 'Starts at ৳16,000',
  },
  {
    slug: 'client-experience-portal',
    title: 'Client Experience Portal',
    painHook: 'Customers বারবার status জানতে চায়.',
    fixes: 'Client hub, intake form, status updates, and service handoff flow.',
    startingPrice: 'Starts at ৳22,000',
  },
  {
    slug: 'business-leak-audit',
    title: 'Business Leak Audit',
    painHook: 'Revenue কোথায় leak হচ্ছে পরিষ্কার না.',
    fixes: 'Lead source audit, follow-up gaps, staff process review, and fix roadmap.',
    startingPrice: 'Starts at ৳7,500',
  },
]
