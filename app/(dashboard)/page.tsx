import { TrendingUp, Users, MessageSquare, Zap, ArrowUpRight } from 'lucide-react'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DashboardChart } from '@/components/dashboard/DashboardChart'
import { QuickActions } from '@/components/dashboard/QuickActions'
import { getContacts } from '@/lib/ghl/contacts'
import { getConversations } from '@/lib/ghl/conversations'
import { getOpportunities } from '@/lib/ghl/pipelines'

const LOCATION_ID = process.env.GHL_LOCATION_ID!

function toBengaliNumeral(n: number): string {
  const bn = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯']
  return n.toString().replace(/[0-9]/g, d => bn[parseInt(d)])
}

const recentActivities = [
  {
    textBn: 'নতুন লিড যোগ হয়েছে — মোহাম্মদ রাশেদুল',
    textEn: 'New lead added — Mohammad Rashedul',
    time: '২ মিনিট আগে',
    timeEn: '2 mins ago',
    type: 'lead',
  },
  {
    textBn: 'WhatsApp মেসেজ পাঠানো হয়েছে — ৩২ জন কন্টাক্টকে',
    textEn: 'WhatsApp message sent — to 32 contacts',
    time: '১৫ মিনিট আগে',
    timeEn: '15 mins ago',
    type: 'message',
  },
  {
    textBn: '"ফলো-আপ ওয়ার্কফ্লো" সফলভাবে চলেছে',
    textEn: '"Follow-up Workflow" ran successfully',
    time: '১ ঘণ্টা আগে',
    timeEn: '1 hour ago',
    type: 'workflow',
  },
  {
    textBn: 'নতুন সদস্য যোগ দিয়েছেন — ক্ল্যান "প্রিমিয়াম"-এ',
    textEn: 'New member joined — Clan "Premium"',
    time: '২ ঘণ্টা আগে',
    timeEn: '2 hours ago',
    type: 'clan',
  },
  {
    textBn: 'BhaiFreakin AI — ১৮টি প্রশ্নের উত্তর দিয়েছে',
    textEn: 'BhaiFreakin AI — answered 18 questions',
    time: 'আজ সকাল ৯টা',
    timeEn: 'Today 9 AM',
    type: 'ai',
  },
]

const activityIcons: Record<string, { icon: string; bg: string }> = {
  lead: { icon: '👤', bg: 'bg-[#EDE9FE]' },
  message: { icon: '💬', bg: 'bg-[#DBEAFE]' },
  workflow: { icon: '⚡', bg: 'bg-[#FEF3C7]' },
  clan: { icon: '👑', bg: 'bg-[#D1FAE5]' },
  ai: { icon: '🤖', bg: 'bg-[#EDE9FE]' },
}

export default async function DashboardPage() {
  let totalContacts = 52
  let totalConversations = 38
  let pipelineRevenue = 0

  try {
    const [contactsRes, convsRes, oppsRes] = await Promise.all([
      getContacts(LOCATION_ID, 1),
      getConversations(LOCATION_ID, 1),
      getOpportunities(LOCATION_ID).catch(() => ({ opportunities: [] })),
    ])
    totalContacts = contactsRes.meta.total
    totalConversations = convsRes.total
    pipelineRevenue = oppsRes.opportunities.reduce((sum, o) => sum + (o.monetaryValue || 0), 0)
  } catch {}

  const stats = [
    {
      labelBn: 'মোট কন্টাক্ট',
      value: toBengaliNumeral(totalContacts),
      change: '+১২%',
      icon: Users,
      color: 'bg-[#EDE9FE]',
      iconColor: 'text-[#7C3AED]',
      trend: 'up',
    },
    {
      labelBn: 'মোট পাইপলাইন',
      value: pipelineRevenue > 0
        ? '৳' + toBengaliNumeral(pipelineRevenue)
        : '৳০',
      change: '+৮%',
      icon: TrendingUp,
      color: 'bg-[#D1FAE5]',
      iconColor: 'text-[#059669]',
      trend: 'up',
    },
    {
      labelBn: 'মোট কনভার্সেশন',
      value: toBengaliNumeral(totalConversations),
      change: '+৫',
      icon: MessageSquare,
      color: 'bg-[#DBEAFE]',
      iconColor: 'text-[#2563EB]',
      trend: 'up',
    },
    {
      labelBn: 'চলমান ওয়ার্কফ্লো',
      value: '১২',
      change: '৩ বিরতি',
      icon: Zap,
      color: 'bg-[#FEF3C7]',
      iconColor: 'text-[#D97706]',
      trend: 'neutral',
    },
  ]

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">
            ড্যাশবোর্ড
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            স্বাগতম! আপনার ব্যবসার সারসংক্ষেপ দেখুন।
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="accent" dot>
            লাইভ
          </Badge>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.labelBn} className="relative overflow-hidden">
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${stat.iconColor}`} />
                </div>
                {stat.trend === 'up' && (
                  <span className="text-xs text-[#059669] font-semibold flex items-center gap-0.5">
                    <ArrowUpRight className="w-3 h-3" />
                    {stat.change}
                  </span>
                )}
                {stat.trend === 'neutral' && (
                  <span className="text-xs text-gray-400 font-medium">{stat.change}</span>
                )}
              </div>
              <p className="text-2xl md:text-3xl font-bold text-gray-900 leading-none mb-1">
                {stat.value}
              </p>
              <p className="text-xs text-gray-500 font-medium">{stat.labelBn}</p>
            </Card>
          )
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Chart */}
        <div className="lg:col-span-2">
          <Card padding="lg">
            <CardHeader>
              <CardTitle>পারফরম্যান্স — গত ৭ দিন</CardTitle>
              <Badge variant="gray">লিড • আয়</Badge>
            </CardHeader>
            <DashboardChart />
          </Card>
        </div>

        {/* Quick Actions */}
        <div>
          <Card padding="lg">
            <CardHeader>
              <CardTitle>দ্রুত কাজ</CardTitle>
            </CardHeader>
            <QuickActions />
          </Card>
        </div>
      </div>

      {/* Recent Activity */}
      <Card padding="none">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-900">সাম্প্রতিক কার্যক্রম</h3>
          <button className="text-sm text-[#7C3AED] font-medium hover:underline">
            সব দেখুন
          </button>
        </div>
        <div className="divide-y divide-gray-50">
          {recentActivities.map((activity, i) => {
            const { icon, bg } = activityIcons[activity.type]
            return (
              <div key={i} className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50/50 transition-colors">
                <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center text-lg flex-shrink-0`}>
                  {icon}
                </div>
                <p className="text-sm text-gray-700 flex-1">{activity.textBn}</p>
                <span className="text-xs text-gray-400 flex-shrink-0">{activity.time}</span>
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}
