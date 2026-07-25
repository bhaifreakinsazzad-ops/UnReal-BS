'use client'

import { useState } from 'react'
import { Plus, Clock, CheckCircle2, AlertCircle, Image as ImageIcon, Type } from 'lucide-react'
import { cn } from '@/lib/utils'

// Full roster shown honestly — TikTok and Snapchat are listed but have zero
// backend integration yet (connected: false), matching LinkedIn's existing
// honest state. Only Facebook/Instagram compose today; real posting/API
// integration per platform (Meta Graph API, LinkedIn API, TikTok API,
// Snapchat Marketing API) is a separate, much larger undertaking requiring
// developer app registration and review with each platform.
const platforms = [
  { id: 'facebook', icon: '📘', label: 'Facebook', connected: true },
  { id: 'instagram', icon: '📸', label: 'Instagram', connected: true },
  { id: 'linkedin', icon: '💼', label: 'LinkedIn', connected: false },
  { id: 'tiktok', icon: '🎵', label: 'TikTok', connected: false },
  { id: 'snapchat', icon: '👻', label: 'Snapchat', connected: false },
]

const mockPosts = [
  { id: '1', content: 'আমাদের নতুন পণ্য লঞ্চ হচ্ছে এই সপ্তাহে! 🎉', platform: 'facebook', status: 'published', time: 'আজ সকাল ১০টা', reach: '১,২৩৪' },
  { id: '2', content: 'বিশেষ ছাড়ে সীমিত সময়ের অফার। এখনই নিন!', platform: 'instagram', status: 'scheduled', time: 'আগামীকাল দুপুর ২টা', reach: '—' },
  { id: '3', content: 'আমাদের সেবায় সন্তুষ্ট হয়েছেন? রিভিউ দিন...', platform: 'facebook', status: 'draft', time: '—', reach: '—' },
  { id: '4', content: 'সাফল্যের গল্প: কিভাবে আমাদের ক্লায়েন্ট ৩ মাসে ৩ গুণ আয় বাড়ালেন।', platform: 'instagram', status: 'failed', time: 'গতকাল', reach: '—' },
]

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  published: { label: 'প্রকাশিত', color: 'text-green-600 bg-green-50', icon: CheckCircle2 },
  scheduled: { label: 'নির্ধারিত', color: 'text-blue-600 bg-blue-50', icon: Clock },
  draft: { label: 'ড্রাফট', color: 'text-gray-600 bg-gray-100', icon: Type },
  failed: { label: 'ব্যর্থ', color: 'text-red-600 bg-red-50', icon: AlertCircle },
}

const platformIcons: Record<string, string> = { facebook: '📘', instagram: '📸', linkedin: '💼', tiktok: '🎵', snapchat: '👻' }

export function SocialMarket() {
  const [viewMode, setViewMode] = useState<'list' | 'compose'>('list')
  const [postContent, setPostContent] = useState('')
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['facebook'])

  function togglePlatform(id: string) {
    setSelectedPlatforms(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    )
  }

  if (viewMode === 'compose') {
    return (
      <div className="flex flex-col h-full max-w-2xl mx-auto">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white flex-shrink-0">
          <button onClick={() => setViewMode('list')} className="text-sm text-[#7C3AED] font-medium">← ফিরে যান</button>
          <h2 className="text-sm font-bold text-gray-900">নতুন পোস্ট</h2>
          <button
            onClick={() => setViewMode('list')}
            className="text-sm px-3 py-1.5 bg-[#7C3AED] text-white rounded-lg font-medium"
          >
            পোস্ট করুন
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Platform selector */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">প্ল্যাটফর্ম</p>
            <div className="flex gap-2">
              {platforms.filter(p => p.connected).map((p) => (
                <button
                  key={p.id}
                  onClick={() => togglePlatform(p.id)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border transition-colors',
                    selectedPlatforms.includes(p.id)
                      ? 'bg-[#7C3AED] text-white border-[#7C3AED]'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-[#7C3AED]'
                  )}
                >
                  <span>{p.icon}</span>
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">পোস্ট লিখুন</p>
            <textarea
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              placeholder="আপনার পোস্ট এখানে লিখুন..."
              rows={5}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED] resize-none"
            />
            <p className="text-xs text-gray-400 mt-1 text-right">{postContent.length}/500</p>
          </div>

          {/* Media */}
          <button className="w-full flex items-center justify-center gap-2 py-4 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 hover:border-[#7C3AED] hover:text-[#7C3AED] transition-colors">
            <ImageIcon className="w-5 h-5" aria-hidden="true" />
            <span className="text-sm font-medium">ছবি বা ভিডিও যোগ করুন</span>
          </button>

          {/* Schedule */}
          <div className="p-4 bg-gray-50 rounded-xl">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">সময় নির্ধারণ</p>
            <div className="flex gap-2">
              <button className="flex-1 py-2 bg-[#7C3AED] text-white text-sm font-medium rounded-lg">
                এখনই পোস্ট
              </button>
              <button className="flex-1 py-2 bg-white border border-gray-200 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-100">
                সময় নির্ধারণ করুন
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">সোশ্যাল মার্কেট</h1>
          <p className="text-sm text-gray-500 mt-0.5">সোশ্যাল মিডিয়া ম্যানেজমেন্ট</p>
        </div>
        <button
          onClick={() => setViewMode('compose')}
          className="flex items-center gap-1.5 px-3 py-2 bg-[#7C3AED] text-white text-sm font-medium rounded-lg hover:bg-[#6D28D9] transition-colors"
        >
          <Plus className="w-4 h-4" />
          নতুন পোস্ট
        </button>
      </div>

      {/* Connected Accounts */}
      <div className="flex gap-2 flex-wrap">
        {platforms.map((p) => (
          <div
            key={p.id}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm border',
              p.connected ? 'bg-white border-gray-200 text-gray-700' : 'bg-gray-50 border-dashed border-gray-200 text-gray-400'
            )}
          >
            <span>{p.icon}</span>
            <span className="font-medium">{p.label}</span>
            {p.connected ? (
              <span className="w-2 h-2 rounded-full bg-green-400" />
            ) : (
              <span className="text-xs text-[#7C3AED] font-medium">শীঘ্রই</span>
            )}
          </div>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'প্রকাশিত', value: '২৩', color: 'text-green-600' },
          { label: 'নির্ধারিত', value: '৭', color: 'text-blue-600' },
          { label: 'মোট রিচ', value: '১২,৩৪৫', color: 'text-[#7C3AED]' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-3 text-center">
            <p className={cn('text-xl font-bold', stat.color)}>{stat.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Post List */}
      <div className="space-y-2">
        {mockPosts.map((post) => {
          const config = statusConfig[post.status]
          const Icon = config.icon
          return (
            <div key={post.id} className="bg-white rounded-xl border border-gray-200 p-4 hover:border-[#7C3AED]/30 transition-colors">
              <div className="flex items-start gap-3">
                <span className="text-2xl flex-shrink-0 mt-0.5">{platformIcons[post.platform]}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800 line-clamp-2 mb-2">{post.content}</p>
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className={cn('flex items-center gap-1 px-2 py-0.5 rounded-full font-medium', config.color)}>
                      <Icon className="w-3 h-3" />
                      {config.label}
                    </span>
                    {post.time !== '—' && (
                      <span className="text-gray-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {post.time}
                      </span>
                    )}
                    {post.reach !== '—' && (
                      <span className="text-gray-400">রিচ: {post.reach}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
