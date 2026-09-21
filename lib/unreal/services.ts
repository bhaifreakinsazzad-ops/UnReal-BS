export interface ServicePack {
  slug: string
  title: string
  painHook: string
  fixes: string
  startingPrice: string
}

export const servicePacks: ServicePack[] = [
  {
    slug: 'agency-os-setup',
    title: 'Agency OS Setup',
    painHook: 'Agency চালু আছে, কিন্তু delivery system নেই.',
    fixes: 'Client workspace setup, CRM pipeline, service intake, reporting dashboard, and operator handoff.',
    startingPrice: 'Starts at ৳12,000',
  },
  {
    slug: 'client-launch-sprint',
    title: 'Client Launch Sprint',
    painHook: 'New client আসে, launch process slow হয়.',
    fixes: 'Offer page, onboarding flow, CRM capture, automation triggers, and launch checklist.',
    startingPrice: 'Starts at ৳18,000',
  },
  {
    slug: 'ai-agent-operations',
    title: 'AI Agent Operations',
    painHook: 'Repeated support and admin work team time খাচ্ছে.',
    fixes: 'AI-assisted replies, summaries, content drafts, task prompts, and agent studio setup.',
    startingPrice: 'Starts at ৳10,000',
  },
  {
    slug: 'website-funnel-system',
    title: 'Website & Funnel System',
    painHook: 'Website আছে, কিন্তু lead conversion weak.',
    fixes: 'Campaign landing page, service funnel, booking route, tracking-ready copy, and CRM handoff.',
    startingPrice: 'Starts at ৳9,000',
  },
  {
    slug: 'ads-growth-ops',
    title: 'Ads Growth Ops',
    painHook: 'Ad spend চলছে, reporting and follow-up scattered.',
    fixes: 'Meta campaign intake, budget tracking, conversion follow-up, and weekly growth review.',
    startingPrice: 'Starts at ৳8,500',
  },
  {
    slug: 'premium-brand-system',
    title: 'Premium Brand System',
    painHook: 'Brand looks smaller than the agency quality.',
    fixes: 'Brand board, service positioning, offer copy, visual polish, and customer-facing assets.',
    startingPrice: 'Starts at ৳25,000',
  },
  {
    slug: 'saas-product-commerce',
    title: 'SaaS Product Commerce',
    painHook: 'Digital products sell manually and access delivery breaks.',
    fixes: 'Product setup, checkout path, access tokens, learning delivery, and operator verification flow.',
    startingPrice: 'Starts at ৳15,000',
  },
  {
    slug: 'sales-team-control',
    title: 'Sales Team Control',
    painHook: 'Staff follow-up করছে কিনা বোঝা যায় না.',
    fixes: 'Pipeline hygiene, activity review, lead ownership, daily action list, and manager reporting.',
    startingPrice: 'Starts at ৳16,000',
  },
  {
    slug: 'client-experience-portal',
    title: 'Client Experience Portal',
    painHook: 'Clients বারবার status জানতে চায়.',
    fixes: 'Client hub, intake form, status updates, service handoff, and support escalation flow.',
    startingPrice: 'Starts at ৳22,000',
  },
  {
    slug: 'agency-leak-audit',
    title: 'Agency Leak Audit',
    painHook: 'Revenue, delivery, and reporting কোথায় leak হচ্ছে পরিষ্কার না.',
    fixes: 'Lead source audit, follow-up gaps, delivery process review, tool audit, and fix roadmap.',
    startingPrice: 'Starts at ৳7,500',
  },
]
