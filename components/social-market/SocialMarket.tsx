'use client'

import { useState } from 'react'
import { Plus, Clock, CheckCircle2, AlertCircle, Image as ImageIcon, Type } from 'lucide-react'
import { cn } from '@/lib/utils'

// NOTHING on this page is connected to a real social platform yet. There is no
// Meta Graph / LinkedIn / TikTok / Snapchat client anywhere in lib/, and no OAuth
// flow exists, so every platform is honestly marked disconnected. Previously
// Facebook and Instagram were hardcoded `connected: true` and rendered a green
// live dot, which told users their accounts were linked when they never were.
const platforms = [
  { id: 'facebook', icon: '📘', label: 'Facebook', connected: false },
  { id: 'instagram', icon: '📸', label: 'Instagram', connected: false },
  { id: 'linkedin', icon: '💼', label: 'LinkedIn', connected: false },
  { id: 'tiktok', icon: '🎵', label: 'TikTok', connected: false },
  { id: 'snapchat', icon: '👻', label: 'Snapchat', connected: false },
]

// Post history is intentionally empty: there is no publishing backend, so any
// row here would be fabricated. It stays empty until real posts exist.
const posts: { id: string; content: string; platform: string; status: string; time: string; reach: string }[] = []

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
          {/* Publishing is not implemented. This button used to just navigate
              back, silently discarding the post while the list implied success. */}
          <button
            disabled
            title="প্রকাশ এখনো চালু হয়নি"
            className="text-sm px-3 py-1.5 bg-gray-200 text-gray-500 rounded-lg font-medium cursor-not-allowed"
          >
            প্রকাশ চালু হয়নি
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

      {/* Publishing status — honest notice. No platform is connected and there is
          no posting backend, so no counts or reach figures are shown. */}
      <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-800">
        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <span>
          সোশ্যাল অ্যাকাউন্ট সংযোগ ও পোস্ট প্রকাশ এখনো চালু হয়নি। এখানে খসড়া লিখে রাখতে
          পারেন, কিন্তু পোস্ট এখনো প্রকাশ করা যাবে না।
        </span>
      </div>

      {/* Post List */}
      <div className="space-y-2">
        {posts.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <Clock className="w-9 h-9 text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-500">এখনো কোনো পোস্ট নেই</p>
            <p className="text-xs text-gray-400 mt-1">প্রকাশ চালু হলে আপনার পোস্টগুলো এখানে দেখা যাবে।</p>
          </div>
        )}
        {posts.map((post) => {
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
