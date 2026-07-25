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
}

export const navItems: NavItem[] = [
  {
    key: 'dashboard',
    labelBn: 'Control Room',
    labelEn: 'Control Room',
    href: '/',
    icon: LayoutDashboard,
  },
  {
    key: 'opportunities',
    labelBn: 'Opportunities',
    labelEn: 'Opportunities',
    href: '/opportunities',
    icon: HandCoins,
    comingSoon: true,
  },
  {
    key: 'credit_center',
    labelBn: 'Credit Center',
    labelEn: 'Credit Center',
    href: '/credit-center',
    icon: BookOpen,
    comingSoon: true,
  },
  {
    key: 'ai_subscriptions',
    labelBn: 'AI Subscriptions',
    labelEn: 'AI Subscriptions',
    href: '/ai-subscriptions',
    icon: MessagesSquare,
    badge: 'NEW',
  },
  {
    key: 'conversations',
    labelBn: 'Inbox',
    labelEn: 'Inbox',
    href: '/conversations',
    icon: MessageSquare,
    badge: '5',
  },
  {
    key: 'contacts',
    labelBn: 'Customers',
    labelEn: 'Customers',
    href: '/contacts',
    icon: Users,
  },
  {
    key: 'workflows',
    labelBn: 'Sales Pipeline',
    labelEn: 'Sales Pipeline',
    href: '/workflows',
    icon: Zap,
  },
  {
    key: 'services',
    labelBn: '400 Services',
    labelEn: '400 Services',
    href: '/services',
    icon: BriefcaseBusiness,
    badge: 'MVP',
  },
  {
    key: 'sites',
    labelBn: 'Sites & Funnels',
    labelEn: 'Sites & Funnels',
    href: '/sites',
    icon: Globe,
  },
  {
    key: 'ai_agents',
    labelBn: 'AI Agents',
    labelEn: 'AI Agents',
    href: '/ai-agents',
    icon: Cpu,
    badge: 'NEW',
  },
  {
    key: 'agent_studio',
    labelBn: 'Agent Studio',
    labelEn: 'Agent Studio',
    href: '/agent-studio',
    icon: BrainCircuit,
  },
  {
    key: 'brand_board',
    labelBn: 'Brand Board',
    labelEn: 'Brand Board',
    href: '/brand-board',
    icon: Palette,
  },
  {
    key: 'support',
    labelBn: 'Support',
    labelEn: 'Support',
    href: '/ask-ai',
    icon: LifeBuoy,
    badge: 'AI',
  },
  {
    key: 'agentic_hq',
    labelBn: 'Agentic HQ',
    labelEn: 'Agentic HQ',
    href: '/agentic-hq',
    icon: Bot,
  },
  {
    key: 'integrations',
    labelBn: 'Integrations',
    labelEn: 'Integrations',
    href: '/integrations',
    icon: Link2,
  },
  {
    key: 'social_yo',
    labelBn: 'Social Yo',
    labelEn: 'Social Yo',
    href: '/social-yo',
    icon: Share2,
  },
  {
    key: 'clan',
    labelBn: 'Clan',
    labelEn: 'Clan',
    href: '/clan',
    icon: Crown,
  },
  {
    key: 'app_developer',
    labelBn: 'App Developer',
    labelEn: 'App Developer',
    href: '/app-developer',
    icon: Code2,
  },
  {
    key: 'skills',
    labelBn: 'Skills',
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
    key: 'wallet',
    labelBn: 'Wallet',
    labelEn: 'Wallet',
    href: '/payments',
    icon: Wallet,
    badge: 'NEW',
  },
  {
    key: 'virtual_cards',
    labelBn: 'Virtual Cards',
    labelEn: 'Virtual Cards',
    href: '/virtual-cards',
    icon: CreditCard,
    badge: 'NEW',
  },
]

export const primaryNavItems = navItems.slice(0, 5)
