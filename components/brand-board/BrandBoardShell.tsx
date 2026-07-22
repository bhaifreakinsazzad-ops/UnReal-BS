'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Palette, Globe, Phone, Mail, MapPin, ExternalLink, Edit3, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { GHLBrandBoard } from '@/lib/ghl/brand-board'

interface Props {
  brand: GHLBrandBoard | null
  locationId: string
}

function ColorSwatch({ color, label }: { color?: string; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="w-10 h-10 rounded-xl border border-white/20 shadow-sm flex-shrink-0"
        style={{ backgroundColor: color ?? '#7C3AED' }}
      />
      <div>
        <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
        <p className="text-sm font-mono text-gray-800">{color ?? '#7C3AED'}</p>
      </div>
    </div>
  )
}

const socialMeta = [
  { key: 'facebook',  emoji: '📘', label: 'Facebook' },
  { key: 'instagram', emoji: '📸', label: 'Instagram' },
  { key: 'youtube',   emoji: '▶️', label: 'YouTube' },
  { key: 'twitter',   emoji: '🐦', label: 'Twitter / X' },
  { key: 'linkedin',  emoji: '💼', label: 'LinkedIn' },
] as const

export function BrandBoardShell({ brand, locationId }: Props) {
  const [copied, setCopied] = useState<string | null>(null)

  function copy(val: string, key: string) {
    navigator.clipboard.writeText(val).then(() => {
      setCopied(key)
      setTimeout(() => setCopied(null), 1500)
    })
  }

  const ghlBrandUrl = `https://app.gohighlevel.com/location/${locationId}/settings/business-profile`

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">ব্র্যান্ড বোর্ড</h1>
          <p className="text-sm text-gray-500 mt-0.5">আপনার ব্যবসার পরিচিতি ও ব্র্যান্ড অ্যাসেট</p>
        </div>
        <a
          href={ghlBrandUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-2 border border-[#7C3AED] text-[#7C3AED] text-sm font-medium rounded-lg hover:bg-[#7C3AED]/5 transition-colors"
        >
          <Edit3 className="w-4 h-4" />
          GHL-এ সম্পাদনা
        </a>
      </div>

      {/* Identity card */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-[#7C3AED] to-[#00C875]" />
        <div className="px-6 pb-6">
          <div className="flex items-end gap-4 -mt-10 mb-4">
            <div className="w-20 h-20 rounded-2xl border-4 border-white shadow-md bg-white flex items-center justify-center overflow-hidden flex-shrink-0">
              {brand?.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={brand.logoUrl} alt="Logo" className="w-full h-full object-contain" />
              ) : (
                <div className="w-full h-full gradient-primary flex items-center justify-center">
                  <Palette className="w-8 h-8 text-white" />
                </div>
              )}
            </div>
            <div className="pb-1">
              <h2 className="text-xl font-bold text-gray-900">{brand?.name ?? 'আপনার ব্যবসার নাম'}</h2>
              {brand?.website && (
                <a
                  href={brand.website.startsWith('http') ? brand.website : `https://${brand.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-sm text-[#7C3AED] hover:underline mt-0.5"
                >
                  <Globe className="w-3.5 h-3.5" />
                  {brand.website}
                </a>
              )}
            </div>
          </div>

          {brand?.businessDescription && (
            <p className="text-sm text-gray-600 mb-4 leading-relaxed">{brand.businessDescription}</p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {brand?.phone && (
              <button
                onClick={() => copy(brand.phone, 'phone')}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl text-left hover:bg-gray-100 transition-colors group"
              >
                <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-400">ফোন</p>
                  <p className="text-sm font-medium text-gray-800 truncate">{brand.phone}</p>
                </div>
                {copied === 'phone' ? <Check className="w-3.5 h-3.5 text-green-500" /> : null}
              </button>
            )}
            {brand?.email && (
              <button
                onClick={() => copy(brand.email, 'email')}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl text-left hover:bg-gray-100 transition-colors"
              >
                <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-400">ইমেইল</p>
                  <p className="text-sm font-medium text-gray-800 truncate">{brand.email}</p>
                </div>
                {copied === 'email' ? <Check className="w-3.5 h-3.5 text-green-500" /> : null}
              </button>
            )}
            {(brand?.address || brand?.city) && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl sm:col-span-2">
                <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-400">ঠিকানা</p>
                  <p className="text-sm font-medium text-gray-800">
                    {[brand?.address, brand?.city, brand?.state, brand?.country].filter(Boolean).join(', ')}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Brand colors */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Palette className="w-4 h-4 text-[#7C3AED]" />
          ব্র্যান্ড রঙ
        </h3>
        <div className="flex gap-8 flex-wrap">
          <ColorSwatch color={brand?.primaryColor ?? '#7C3AED'} label="প্রাইমারি" />
          <ColorSwatch color={brand?.secondaryColor ?? '#00C875'} label="অ্যাকসেন্ট" />
        </div>
        <p className="text-xs text-gray-400 mt-4">
          রঙ পরিবর্তন করতে{' '}
          <a href={ghlBrandUrl} target="_blank" rel="noopener noreferrer" className="text-[#7C3AED] hover:underline">
            GHL Business Profile ↗
          </a>{' '}
          খুলুন।
        </p>
      </div>

      {/* Social links */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-900 mb-4">সোশ্যাল মিডিয়া</h3>
        <div className="space-y-2">
          {socialMeta.map(({ key, emoji, label }) => {
            const url = brand?.social?.[key as keyof typeof brand.social]
            return (
              <div key={key} className={cn(
                'flex items-center gap-3 p-3 rounded-xl border transition-colors',
                url ? 'border-gray-200 bg-white hover:border-[#7C3AED]/30' : 'border-dashed border-gray-200 bg-gray-50'
              )}>
                <span className={cn('text-base flex-shrink-0', !url && 'grayscale opacity-40')}>{emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-400">{label}</p>
                  {url ? (
                    <a
                      href={url.startsWith('http') ? url : `https://${url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-[#7C3AED] hover:underline truncate block"
                    >
                      {url}
                    </a>
                  ) : (
                    <p className="text-sm text-gray-400 italic">সংযুক্ত নেই</p>
                  )}
                </div>
                {url && <ExternalLink className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />}
              </div>
            )
          })}
        </div>
      </div>

      {/* Logo asset */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-900 mb-4">লোগো অ্যাসেট</h3>
        <div className="flex items-center gap-6 flex-wrap">
          <div className="w-24 h-24 rounded-2xl bg-[#0D0D1A] flex items-center justify-center border border-gray-200">
            <Image src="/logo.png" alt="Logo dark" width={64} height={64} className="object-contain rounded-xl" />
          </div>
          <div className="w-24 h-24 rounded-2xl bg-white flex items-center justify-center border border-gray-200">
            <Image src="/logo.png" alt="Logo light" width={64} height={64} className="object-contain rounded-xl" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-800 mb-1">UnReal BS Logo</p>
            <p className="text-xs text-gray-400 mb-3">PNG format · Monogram mark</p>
            <a
              href="/logo.png"
              download="unrealbs-logo.png"
              className="text-xs px-3 py-1.5 bg-[#7C3AED]/10 text-[#7C3AED] rounded-lg font-medium hover:bg-[#7C3AED]/15 transition-colors"
            >
              ডাউনলোড করুন
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
