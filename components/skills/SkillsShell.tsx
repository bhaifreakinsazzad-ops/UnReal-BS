'use client'

import { useState } from 'react'
import { Search, Settings, Trash2, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

const categories = [
  { value: 'all', label: 'সব' },
  { value: 'crm', label: 'CRM' },
  { value: 'social', label: 'সোশ্যাল' },
  { value: 'payment', label: 'পেমেন্ট' },
  { value: 'ai', label: 'AI' },
  { value: 'mcp', label: 'MCP' },
]

const allSkills = [
  { id: '1', name: 'Google Sheets', desc: 'কন্টাক্ট ডেটা Google Sheets-এ সিঙ্ক করুন।', icon: '📊', category: 'crm', installed: true, verified: true },
  { id: '2', name: 'Facebook Ads', desc: 'Facebook বিজ্ঞাপন পরিচালনা করুন।', icon: '📘', category: 'social', installed: true, verified: true },
  { id: '3', name: 'bKash', desc: 'bKash পেমেন্ট গেটওয়ে সংযুক্ত করুন।', icon: '💸', category: 'payment', installed: false, verified: true },
  { id: '4', name: 'Gemini AI', desc: 'Google Gemini AI ক্ষমতা যোগ করুন।', icon: '🤖', category: 'ai', installed: false, verified: true },
  { id: '5', name: 'Claude MCP', desc: 'Anthropic Claude AI MCP সার্ভার।', icon: '⚡', category: 'mcp', installed: true, verified: true },
  { id: '6', name: 'Notion', desc: 'Notion ডেটাবেজের সাথে সংযুক্ত হন।', icon: '📓', category: 'crm', installed: false, verified: false },
  { id: '7', name: 'Nagad', desc: 'Nagad পেমেন্ট ইন্টিগ্রেশন।', icon: '💳', category: 'payment', installed: false, verified: true },
  { id: '8', name: 'WhatsApp API', desc: 'WhatsApp Business API সংযুক্ত করুন।', icon: '📱', category: 'social', installed: true, verified: true },
]

const tabs = [
  { value: 'browse', label: 'ব্রাউজ' },
  { value: 'installed', label: 'ইন্সটল করা' },
  { value: 'custom', label: 'কাস্টম MCP' },
]

export function SkillsShell() {
  const [activeTab, setActiveTab] = useState('browse')
  const [activeCategory, setActiveCategory] = useState('all')
  const [search, setSearch] = useState('')
  const [installed, setInstalled] = useState<Set<string>>(
    new Set(allSkills.filter(s => s.installed).map(s => s.id))
  )
  const [mcpUrl, setMcpUrl] = useState('')
  const [mcpName, setMcpName] = useState('')

  const filtered = allSkills.filter(s => {
    const matchCat = activeCategory === 'all' || s.category === activeCategory
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) || s.desc.includes(search)
    const matchTab = activeTab === 'installed' ? installed.has(s.id) : true
    return matchCat && matchSearch && matchTab
  })

  function toggleInstall(id: string) {
    setInstalled(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">স্কিলস & কানেকশন</h1>
          <p className="text-sm text-gray-500 mt-0.5">প্লাগিন ও ইন্টিগ্রেশন মার্কেটপ্লেস</p>
        </div>
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

      {activeTab === 'custom' ? (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h3 className="font-semibold text-gray-900">কাস্টম MCP সার্ভার যোগ করুন</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">সার্ভারের নাম</label>
                <input
                  value={mcpName}
                  onChange={(e) => setMcpName(e.target.value)}
                  placeholder="আমার কাস্টম টুল"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">সার্ভার URL</label>
                <input
                  value={mcpUrl}
                  onChange={(e) => setMcpUrl(e.target.value)}
                  placeholder="https://my-mcp-server.com/sse"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">API কী (ঐচ্ছিক)</label>
                <input
                  type="password"
                  placeholder="sk-..."
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED]"
                />
              </div>
              <div className="flex gap-2">
                <button className="px-4 py-2.5 bg-gray-100 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-200 transition-colors">
                  সংযোগ পরীক্ষা
                </button>
                <button className="flex-1 py-2.5 bg-[#7C3AED] text-white text-sm font-medium rounded-xl hover:bg-[#6D28D9] transition-colors">
                  সংযুক্ত করুন
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Search + Category */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="স্কিল খুঁজুন..."
                className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED]"
              />
            </div>
            <div className="overflow-x-auto pb-1">
              <div className="flex gap-1.5 min-w-max">
                {categories.map((cat) => (
                  <button
                    key={cat.value}
                    onClick={() => setActiveCategory(cat.value)}
                    className={cn(
                      'px-3 py-1.5 text-xs font-medium rounded-full transition-colors whitespace-nowrap',
                      activeCategory === cat.value
                        ? 'bg-[#7C3AED] text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    )}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Skills Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filtered.map((skill) => (
              <div key={skill.id} className="bg-white rounded-xl border border-gray-200 p-4 hover:border-[#7C3AED]/30 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-xl bg-gray-100 flex items-center justify-center text-2xl flex-shrink-0">
                    {skill.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <p className="font-semibold text-gray-900 text-sm">{skill.name}</p>
                      {skill.verified && <CheckCircle className="w-3.5 h-3.5 text-[#00C875]" />}
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed">{skill.desc}</p>
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  {installed.has(skill.id) ? (
                    <>
                      <span className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-green-50 text-green-700 text-xs font-medium rounded-lg">
                        <CheckCircle className="w-3.5 h-3.5" />
                        ইন্সটল করা
                      </span>
                      <button
                        onClick={() => toggleInstall(skill.id)}
                        className="p-1.5 border border-gray-200 text-gray-400 rounded-lg hover:border-red-300 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <button className="p-1.5 border border-gray-200 text-gray-400 rounded-lg hover:bg-gray-50 transition-colors">
                        <Settings className="w-3.5 h-3.5" />
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => toggleInstall(skill.id)}
                      className="flex-1 py-1.5 bg-[#7C3AED] text-white text-xs font-medium rounded-lg hover:bg-[#6D28D9] transition-colors"
                    >
                      ইন্সটল করুন
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
