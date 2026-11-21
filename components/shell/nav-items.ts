import {
  LayoutDashboard,
  MessageSquare,
  Users,
  Bot,
  Zap,
  Share2,
  Code2,
  Globe,
  BrainCircuit,
  Link2,
  Sparkles,
  Cpu,
  BookOpen,
  HandCoins,
  BriefcaseBusiness,
  LifeBuoy,
  Wallet,
  MessagesSquare,
  CreditCard,
  Megaphone,
  Store,
  GraduationCap,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface NavItem {
  key: string
  labelBn: string
  labelEn: string
  href: string
  icon: LucideIcon
  badge?: string
  comingSoon?: boolean
  /** Section this item renders under in the sidebar. Items with no group
   *  (or group 'more') live under the collapsible "More" toggle so the
   *  most-used real features aren't crowded by the long tail. */
  group?: 'workspace' | 'money-ai'
}

// Real, live features come first; comingSoon placeholders sit at the very
// end so they never crowd out something a user can actually use today.
const allNavItems: NavItem[] = [
  {
    key: 'dashboard',
    labelBn: 'কন্ট্রোল রুম',
    labelEn: 'Control Room',
    href: '/',
    icon: LayoutDashboard,
    group: 'workspace',
  },
  {
    key: 'wallet',
    labelBn: 'ওয়ালেট',
    labelEn: 'Wallet',
    href: '/payments',
    icon: Wallet,
    badge: 'NEW',
    group: 'workspace',
  },
  {
    key: 'products',
    labelBn: 'ডিজিটাল প্রোডাক্ট',
    labelEn: 'Digital Products',
    href: '/products',
    icon: GraduationCap,
    badge: 'NEW',
    group: 'workspace',
  },
  {
    key: 'ai_subscriptions',
    labelBn: 'AI সাবস্ক্রিপশন',
    labelEn: 'AI Subscriptions',
    href: '/ai-subscriptions',
    icon: MessagesSquare,
    badge: 'NEW',
    group: 'money-ai',
  },
  {
    key: 'conversations',
    labelBn: 'ইনবক্স',
    labelEn: 'Inbox',
    href: '/conversations',
    icon: MessageSquare,
    group: 'money-ai',
  },
  {
    key: 'ads',
    labelBn: 'ফেসবুক বিজ্ঞাপন',
    labelEn: 'Facebook Ads',
    href: '/ads',
    icon: Megaphone,
    badge: 'NEW',
    group: 'money-ai',
  },
  {
    key: 'contacts',
    labelBn: 'কাস্টমার',
    labelEn: 'Customers',
    href: '/contacts',
    icon: Users,
    group: 'money-ai',
  },
  {
    key: 'workflows',
    labelBn: 'সেলস পাইপলাইন',
    labelEn: 'Sales Pipeline',
    href: '/workflows',
    icon: Zap,
    group: 'money-ai',
  },
  {
    key: 'virtual_cards',
    labelBn: 'ভার্চুয়াল কার্ড',
    labelEn: 'Virtual Cards',
    href: '/virtual-cards',
    icon: CreditCard,
    badge: 'NEW',
    group: 'money-ai',
  },
  {
    key: 'services',
    labelBn: 'SaaS IT সার্ভিস',
    labelEn: 'SaaS IT Services',
    href: '/services',
    icon: BriefcaseBusiness,
    badge: 'MVP',
  },
  {
    key: 'sites',
    labelBn: 'সাইট ও ফানেল',
    labelEn: 'Sites & Funnels',
    href: '/sites',
    icon: Globe,
  },
  {
    key: 'ai_agents',
    labelBn: 'AI এজেন্ট',
    labelEn: 'AI Agents',
    href: '/ai-agents',
    icon: Cpu,
    badge: 'NEW',
  },
  {
    key: 'agent_studio',
    labelBn: 'এজেন্ট স্টুডিও',
    labelEn: 'Agent Studio',
    href: '/agent-studio',
    icon: BrainCircuit,
  },
  {
    key: 'support',
    labelBn: 'সাপোর্ট',
    labelEn: 'Support',
    href: '/ask-ai',
    icon: LifeBuoy,
    badge: 'AI',
  },
  {
    key: 'agentic_hq',
    labelBn: 'এজেন্টিক HQ',
    labelEn: 'Agentic HQ',
    href: '/agentic-hq',
    icon: Bot,
  },
  {
    key: 'integrations',
    labelBn: 'ইন্টিগ্রেশন',
    labelEn: 'Integrations',
    href: '/integrations',
    icon: Link2,
  },
  {
    key: 'social_market',
    labelBn: 'সোশ্যাল মার্কেট',
    labelEn: 'Social Market',
    href: '/social-market',
    icon: Share2,
  },
  {
    key: 'meetally',
    labelBn: 'MeetAlly',
    labelEn: 'MeetAlly',
    href: '/meetally',
    icon: Store,
    comingSoon: true,
  },
  {
    key: 'app_developer',
    labelBn: 'অ্যাপ ডেভেলপার',
    labelEn: 'App Developer',
    href: '/app-developer',
    icon: Code2,
  },
  {
    key: 'ask_ai',
    labelBn: 'UnReal AI',
    labelEn: 'UnReal AI',
    href: '/ask-ai',
    icon: Sparkles,
    badge: 'AI',
  },
  {
    key: 'opportunities',
    labelBn: 'সুযোগ',
    labelEn: 'Opportunities',
    href: '/opportunities',
    icon: HandCoins,
    comingSoon: true,
  },
  {
    key: 'credit_center',
    labelBn: 'ক্রেডিট সেন্টার',
    labelEn: 'Credit Center',
    href: '/credit-center',
    icon: BookOpen,
    comingSoon: true,
  },
]

const hiddenNavKeys = new Set(['products'])

const navOrder = [
  'dashboard',
  'wallet',
  'ads',
  'conversations',
  'contacts',
  'workflows',
  'ai_subscriptions',
  'virtual_cards',
  'services',
  'sites',
  'ai_agents',
  'agent_studio',
  'support',
  'integrations',
  'social_market',
  'agentic_hq',
  'app_developer',
  'ask_ai',
  'meetally',
  'opportunities',
  'credit_center',
]

const navGroups: Record<string, NavItem['group']> = {
  dashboard: 'workspace',
  wallet: 'workspace',
  ads: 'workspace',
  conversations: 'workspace',
  contacts: 'workspace',
  workflows: 'workspace',
  ai_subscriptions: 'money-ai',
  virtual_cards: 'money-ai',
  services: 'money-ai',
  sites: 'money-ai',
  ai_agents: 'money-ai',
  agent_studio: 'money-ai',
}

// Marketplace and removed product surfaces stay out of all user navigation.
export const navItems = allNavItems
  .filter((item) => !hiddenNavKeys.has(item.key))
  .map((item) => ({ ...item, group: navGroups[item.key] ?? undefined }))
  .sort((a, b) => navOrder.indexOf(a.key) - navOrder.indexOf(b.key))

export const primaryNavItems = navItems.slice(0, 5)
