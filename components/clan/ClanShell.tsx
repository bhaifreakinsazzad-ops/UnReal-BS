'use client'

import { useState } from 'react'
import { Plus, Users, Crown, BookOpen, TrendingUp, Settings, ChevronRight } from 'lucide-react'
import { Avatar } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

const tabs = [
  { value: 'overview', label: 'সারসংক্ষেপ' },
  { value: 'members', label: 'সদস্যরা' },
  { value: 'content', label: 'কন্টেন্ট' },
]

const mockClans = [
  { id: '1', name: 'প্রিমিয়াম মেম্বার্স', members: 234, revenue: '৳৪৫,০০০', tier: 'প্রিমিয়াম', emoji: '👑' },
  { id: '2', name: 'স্ট্যান্ডার্ড ক্লাব', members: 567, revenue: '৳৩৪,০০০', tier: 'স্ট্যান্ডার্ড', emoji: '⭐' },
]

const mockMembers = [
  { name: 'রাশেদুল ইসলাম', plan: 'প্রিমিয়াম', joined: '১ মাস আগে', lastActive: 'আজ', status: 'active' },
  { name: 'সাবরিনা আক্তার', plan: 'স্ট্যান্ডার্ড', joined: '৩ মাস আগে', lastActive: 'গতকাল', status: 'active' },
  { name: 'আরিফুল হক', plan: 'প্রিমিয়াম', joined: '২ মাস আগে', lastActive: '১ সপ্তাহ আগে', status: 'inactive' },
  { name: 'নাদিরা বেগম', plan: 'স্ট্যান্ডার্ড', joined: '৫ মাস আগে', lastActive: '২ দিন আগে', status: 'active' },
]

const mockContent = [
  { title: 'শুরু করুন: ব্যবসার বেসিক', lessons: 5, type: 'course', emoji: '📚' },
  { title: 'মার্কেটিং মাস্টারক্লাস', lessons: 8, type: 'course', emoji: '🎯' },
  { title: 'সাপ্তাহিক লাইভ সেশন', lessons: 1, type: 'live', emoji: '🎥' },
]

export function ClanShell() {
  const [activeTab, setActiveTab] = useState('overview')

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">ক্ল্যান</h1>
          <p className="text-sm text-gray-500 mt-0.5">সদস্যতা ও কমিউনিটি পরিচালনা</p>
        </div>
        <button className="flex items-center gap-1.5 px-3 py-2 bg-[#7C3AED] text-white text-sm font-medium rounded-lg hover:bg-[#6D28D9] transition-colors">
          <Plus className="w-4 h-4" />
          নতুন ক্ল্যান
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'মোট সদস্য', value: '৮০১', icon: Users, color: 'text-[#7C3AED] bg-[#EDE9FE]' },
          { label: 'এই সপ্তাহে নতুন', value: '৪৫', icon: TrendingUp, color: 'text-green-600 bg-green-50' },
          { label: 'মাসিক আয়', value: '৳৭৯,০০০', icon: Crown, color: 'text-yellow-600 bg-yellow-50' },
          { label: 'কন্টেন্ট', value: '৩', icon: BookOpen, color: 'text-blue-600 bg-blue-50' },
        ].map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-3">
              <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center mb-2', stat.color.split(' ')[1])}>
                <Icon className={cn('w-5 h-5', stat.color.split(' ')[0])} />
              </div>
              <p className="text-lg font-bold text-gray-900">{stat.value}</p>
              <p className="text-xs text-gray-500">{stat.label}</p>
            </div>
          )
        })}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={cn(
              'flex-1 py-2 text-sm font-medium rounded-lg transition-colors',
              activeTab === tab.value ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-3">
          {mockClans.map((clan) => (
            <div key={clan.id} className="bg-white rounded-xl border border-gray-200 p-4 hover:border-[#7C3AED]/30 transition-colors cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#EDE9FE] flex items-center justify-center text-2xl flex-shrink-0">
                  {clan.emoji}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900">{clan.name}</h3>
                    <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full">{clan.tier}</span>
                  </div>
                  <div className="flex gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {clan.members} সদস্য
                    </span>
                    <span>আয়: {clan.revenue}/মাস</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
                    <Settings className="w-4 h-4" />
                  </button>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'members' && (
        <div className="space-y-2">
          {mockMembers.map((member, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-3 flex items-center gap-3 hover:border-[#7C3AED]/30 transition-colors">
              <Avatar name={member.name} size="md" online={member.status === 'active'} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900">{member.name}</p>
                <p className="text-xs text-gray-400">{member.plan} · যোগ দিয়েছেন {member.joined}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-xs text-gray-400">সক্রিয়</p>
                <p className="text-xs font-medium text-gray-600">{member.lastActive}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'content' && (
        <div className="space-y-3">
          {mockContent.map((content, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4 hover:border-[#7C3AED]/30 transition-colors cursor-pointer">
              <div className="w-12 h-12 rounded-xl bg-[#EDE9FE] flex items-center justify-center text-2xl flex-shrink-0">
                {content.emoji}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">{content.title}</p>
                <p className="text-xs text-gray-400 mt-0.5">{content.lessons}টি {content.type === 'live' ? 'লাইভ সেশন' : 'লেসন'}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
            </div>
          ))}
          <button className="w-full py-3 border-2 border-dashed border-gray-200 text-gray-400 rounded-xl text-sm hover:border-[#7C3AED] hover:text-[#7C3AED] transition-colors flex items-center justify-center gap-2">
            <Plus className="w-4 h-4" />
            কন্টেন্ট যোগ করুন
          </button>
        </div>
      )}
    </div>
  )
}
