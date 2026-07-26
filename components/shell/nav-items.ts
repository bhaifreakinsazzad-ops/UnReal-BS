import {
  LayoutDashboard,
  MessageSquare,
  Users,
  Bot,
  Zap,
  Share2,
  Crown,
  Code2,
  Plug,
  Globe,
  BrainCircuit,
  Palette,
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
  Landmark,
  Store,
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
export const navItems: NavItem[] = [
  {
    key: 'dashboard',
    labelBn: 'কন্ট্রোল রুম',
    labelEn: 'Control Room',
    href: '/',
    icon: LayoutDashboard,
    group: 'workspace',
  },
  {
    key: 'udhar_khata',
    labelBn: 'উধার খাতা',
    labelEn: 'Udhar Khata',
    href: '/udhar-khata',
    icon: Landmark,
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
    labelBn: '৪০০ সার্ভিস',
    labelEn: '400 Services',
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
    key: 'brand_board',
    labelBn: 'ব্র্যান্ড বোর্ড',
    labelEn: 'Brand Board',
    href: '/brand-board',
    icon: Palette,
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
    key: 'clan',
    labelBn: 'ক্ল্যান',
    labelEn: 'Clan',
    href: '/clan',
    icon: Crown,
  },
  {
    key: 'app_developer',
    labelBn: 'অ্যাপ ডেভেলপার',
    labelEn: 'App Developer',
    href: '/app-developer',
    icon: Code2,
  },
  {
    key: 'skills',
    labelBn: 'স্কিলস',
    labelEn: 'Skills',
    href: '/skills',
    icon: Plug,
  },
  {
    key: 'ask_ai',
    labelBn: 'BhaiFreakin AI',
    labelEn: 'BhaiFreakin AI',
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

export const primaryNavItems = navItems.slice(0, 5)
