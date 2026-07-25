'use client'

import { useState } from 'react'
import { ExternalLink, Search } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Integration {
  id: string
  name: string
  nameEn: string
  description: string
  category: string
  emoji: string
  ghlPath?: string
  externalUrl?: string
  popular?: boolean
}

const INTEGRATIONS: Integration[] = [
  // Messaging
  { id: 'whatsapp', name: 'WhatsApp Business', nameEn: 'WhatsApp Business', description: 'ব্যবসায়িক হোয়াটসঅ্যাপ থেকে সরাসরি মেসেজ পাঠান', category: 'মেসেজিং', emoji: '📱', ghlPath: 'integration/whatsapp', popular: true },
  { id: 'facebook', name: 'Facebook', nameEn: 'Facebook', description: 'Facebook পেজ ও Messenger ইন্টিগ্রেশন', category: 'মেসেজিং', emoji: '📘', ghlPath: 'integration/facebook', popular: true },
  { id: 'instagram', name: 'Instagram', nameEn: 'Instagram', description: 'Instagram DM ও কমেন্ট ম্যানেজমেন্ট', category: 'মেসেজিং', emoji: '📸', ghlPath: 'integration/instagram' },
  { id: 'gmail', name: 'Gmail', nameEn: 'Gmail', description: 'Gmail দিয়ে ইমেইল পাঠান ও গ্রহণ করুন', category: 'মেসেজিং', emoji: '📧', ghlPath: 'integration/gmail', popular: true },
  // Payments
  { id: 'stripe', name: 'Stripe', nameEn: 'Stripe', description: 'আন্তর্জাতিক কার্ড পেমেন্ট গ্রহণ করুন', category: 'পেমেন্ট', emoji: '💳', ghlPath: 'payment/stripe', popular: true },
  { id: 'paypal', name: 'PayPal', nameEn: 'PayPal', description: 'PayPal দিয়ে পেমেন্ট গ্রহণ করুন', category: 'পেমেন্ট', emoji: '🅿️', ghlPath: 'payment/paypal' },
  { id: 'bkash', name: 'bKash', nameEn: 'bKash', description: 'বাংলাদেশের সবচেয়ে জনপ্রিয় মোবাইল ব্যাংকিং', category: 'পেমেন্ট', emoji: '🟣', externalUrl: 'https://www.bkash.com/business', popular: true },
  { id: 'nagad', name: 'Nagad', nameEn: 'Nagad', description: 'ডাক বিভাগের ডিজিটাল আর্থিক সেবা', category: 'পেমেন্ট', emoji: '🟠', externalUrl: 'https://nagad.com.bd' },
  { id: 'sslcommerz', name: 'SSLCommerz', nameEn: 'SSLCommerz', description: 'বাংলাদেশের সেরা পেমেন্ট গেটওয়ে', category: 'পেমেন্ট', emoji: '🔒', externalUrl: 'https://sslcommerz.com', popular: true },
  // Google
  { id: 'google_business', name: 'Google Business', nameEn: 'Google Business', description: 'Google My Business রিভিউ ও মেসেজ', category: 'গুগল', emoji: '🗺️', ghlPath: 'integration/gmb', popular: true },
  { id: 'google_analytics', name: 'Google Analytics', nameEn: 'Google Analytics', description: 'ওয়েবসাইট ট্র্যাফিক অ্যানালিটিক্স', category: 'গুগল', emoji: '📊', externalUrl: 'https://analytics.google.com' },
  { id: 'google_ads', name: 'Google Ads', nameEn: 'Google Ads', description: 'Google বিজ্ঞাপন ক্যাম্পেইন', category: 'গুগল', emoji: '🎯', externalUrl: 'https://ads.google.com' },
  // Productivity
  { id: 'zoom', name: 'Zoom', nameEn: 'Zoom', description: 'ভিডিও কল ও মিটিং', category: 'প্রোডাক্টিভিটি', emoji: '📹', ghlPath: 'integration/zoom' },
  { id: 'google_calendar', name: 'Google Calendar', nameEn: 'Google Calendar', description: 'অ্যাপয়েন্টমেন্ট ও ক্যালেন্ডার সিঙ্ক', category: 'প্রোডাক্টিভিটি', emoji: '📅', ghlPath: 'integration/google-calendar', popular: true },
  { id: 'slack', name: 'Slack', nameEn: 'Slack', description: 'টিম নোটিফিকেশন ও কমিউনিকেশন', category: 'প্রোডাক্টিভিটি', emoji: '💬', externalUrl: 'https://slack.com' },
  { id: 'notion', name: 'Notion', nameEn: 'Notion', description: 'নোট, ডক্স ও টিম উইকি একসাথে রাখুন', category: 'প্রোডাক্টিভিটি', emoji: '📓', externalUrl: 'https://www.notion.so', popular: true },
  { id: 'hubspot', name: 'HubSpot', nameEn: 'HubSpot', description: 'CRM, মার্কেটিং ও সেলস টুলস', category: 'প্রোডাক্টিভিটি', emoji: '🧡', externalUrl: 'https://www.hubspot.com' },
  // eCommerce
  { id: 'shopify', name: 'Shopify', nameEn: 'Shopify', description: 'Shopify স্টোরের অর্ডার ও গ্রাহক সিঙ্ক', category: 'ই-কমার্স', emoji: '🛍️', externalUrl: 'https://shopify.com' },
  { id: 'woocommerce', name: 'WooCommerce', nameEn: 'WooCommerce', description: 'WordPress WooCommerce স্টোর', category: 'ই-কমার্স', emoji: '🛒', externalUrl: 'https://woocommerce.com' },
  // Social
  { id: 'youtube', name: 'YouTube', nameEn: 'YouTube', description: 'YouTube চ্যানেল কানেক্ট করুন', category: 'সোশ্যাল', emoji: '▶️', ghlPath: 'integration/youtube' },
  { id: 'tiktok', name: 'TikTok', nameEn: 'TikTok', description: 'TikTok বিজ্ঞাপন ও কনটেন্ট', category: 'সোশ্যাল', emoji: '🎵', ghlPath: 'integration/tiktok' },
  { id: 'linkedin', name: 'LinkedIn', nameEn: 'LinkedIn', description: 'B2B লিড জেনারেশন ও পোস্টিং', category: 'সোশ্যাল', emoji: '💼', externalUrl: 'https://linkedin.com' },
]

const CATEGORIES = ['সব', ...Array.from(new Set(INTEGRATIONS.map(i => i.category)))]

interface Props { locationId: string }

// Note: this page has no real in-app connect flow for any entry — clicking
// "Open ↗" just opens the provider's own setup page in a new tab, nothing is
// tracked as "connected" here. A previous version showed a fake green
// "Connected" checkmark after any click (setTimeout only, no real
// auth/backend) — removed, since that claimed a connection was made when
// nothing had happened. Real in-app OAuth (credential storage, live
// connection status) for any of these is a separate, larger project
// requiring API credentials from each provider's developer console.
export function IntegrationsShell({ locationId }: Props) {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('সব')

  const filtered = INTEGRATIONS.filter(i => {
    const matchCat = category === 'সব' || i.category === category
    const matchSearch = !search ||
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      i.description.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  const popular = filtered.filter(i => i.popular)
  const rest = filtered.filter(i => !i.popular)

  function getHref(integration: Integration) {
    if (integration.ghlPath) {
      return `https://app.gohighlevel.com/location/${locationId}/${integration.ghlPath}`
    }
    return integration.externalUrl ?? '#'
  }

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">ইন্টিগ্রেশন</h1>
          <p className="text-sm text-gray-500 mt-0.5">{INTEGRATIONS.length}টি উপলব্ধ</p>
        </div>
        <a
          href={`https://app.gohighlevel.com/location/${locationId}/integration`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-sm text-[#7C3AED] border border-[#7C3AED]/30 px-3 py-2 rounded-lg hover:bg-[#7C3AED]/5 transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          GHL ইন্টিগ্রেশন
        </a>
      </div>

      {/* Search + categories */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="ইন্টিগ্রেশন খুঁজুন..."
            className="w-full pl-9 pr-3 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED]"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={cn(
                'px-3 py-1.5 text-sm font-medium rounded-full whitespace-nowrap transition-colors flex-shrink-0',
                category === cat
                  ? 'bg-[#7C3AED] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Popular section */}
      {popular.length > 0 && category === 'সব' && !search && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">জনপ্রিয়</p>
          <IntegrationGrid items={popular} getHref={getHref} />
        </div>
      )}

      {/* All / filtered */}
      <div>
        {(category !== 'সব' || search) ? (
          <IntegrationGrid items={filtered} getHref={getHref} />
        ) : (
          <>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">সব ইন্টিগ্রেশন</p>
            <IntegrationGrid items={rest} getHref={getHref} />
          </>
        )}
      </div>
    </div>
  )
}

function IntegrationGrid({
  items,
  getHref,
}: {
  items: Integration[]
  getHref: (i: Integration) => string
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {items.map(item => (
        <div
          key={item.id}
          className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4 transition-colors hover:border-[#7C3AED]/30"
        >
          <div className="w-11 h-11 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center text-2xl flex-shrink-0">
            {item.emoji}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <p className="font-semibold text-gray-900 text-sm">{item.name}</p>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">{item.category}</span>
            </div>
            <p className="text-xs text-gray-400 leading-snug line-clamp-2">{item.description}</p>
          </div>
          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            <a
              href={getHref(item)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs px-3 py-1.5 bg-[#7C3AED] text-white rounded-lg font-medium hover:bg-[#6D28D9] transition-colors whitespace-nowrap"
            >
              খুলুন ↗
            </a>
          </div>
        </div>
      ))}
    </div>
  )
}
