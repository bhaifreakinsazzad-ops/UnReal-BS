import {
  LayoutDashboard,
  MessageSquare,
  Users,
  Wallet,
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
    labelBn: 'ড্যাশবোর্ড',
    labelEn: 'Dashboard',
    href: '/',
    icon: LayoutDashboard,
  },
  {
    key: 'conversations',
    labelBn: 'কনভার্সেশন',
    labelEn: 'Conversations',
    href: '/conversations',
    icon: MessageSquare,
    badge: '5',
  },
  {
    key: 'contacts',
    labelBn: 'কন্টাক্টস',
    labelEn: 'Contacts',
    href: '/contacts',
    icon: Users,
  },
  {
    key: 'agentic_hq',
    labelBn: 'এজেন্টিক HQ',
    labelEn: 'Agentic HQ',
    href: '/agentic-hq',
    icon: Bot,
  },
  {
    key: 'workflows',
    labelBn: 'ওয়ার্কফ্লো',
    labelEn: 'Workflows',
    href: '/workflows',
    icon: Zap,
  },
  {
    key: 'social_yo',
    labelBn: 'সোশ্যাল Yo',
    labelEn: 'Social Yo',
    href: '/social-yo',
    icon: Share2,
  },
  {
    key: 'clan',
    labelBn: 'ক্ল্যান',
    labelEn: 'Clan',
    href: '/clan',
    icon: Crown,
  },
  {
    key: 'payments',
    labelBn: 'পেমেন্ট',
    labelEn: 'Payments',
    href: '/payments',
    icon: Wallet,
    comingSoon: true,
  },
  {
    key: 'udhar_khata',
    labelBn: 'উধার খাতা',
    labelEn: 'Credit Ledger',
    href: '/udhar-khata',
    icon: BookOpen,
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
    key: 'sites',
    labelBn: 'সাইটস',
    labelEn: 'Sites',
    href: '/sites',
    icon: Globe,
  },
  {
    key: 'agent_studio',
    labelBn: 'এজেন্ট স্টুডিও',
    labelEn: 'Agent Studio',
    href: '/agent-studio',
    icon: BrainCircuit,
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
    key: 'brand_board',
    labelBn: 'ব্র্যান্ড বোর্ড',
    labelEn: 'Brand Board',
    href: '/brand-board',
    icon: Palette,
  },
  {
    key: 'integrations',
    labelBn: 'ইন্টিগ্রেশন',
    labelEn: 'Integrations',
    href: '/integrations',
    icon: Link2,
  },
  {
    key: 'ask_ai',
    labelBn: 'BhaiFreakin AI',
    labelEn: 'BhaiFreakin AI',
    href: '/ask-ai',
    icon: Sparkles,
    badge: 'AI',
  },
]

export const primaryNavItems = navItems.slice(0, 5)
