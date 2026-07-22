'use client'

import { useState } from 'react'
import { Globe, Plus, ExternalLink, ChevronDown, ChevronRight, Search, BarChart2, Eye } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLocale } from '@/lib/i18n/context'
import { getTranslations, formatNumber, formatDate } from '@/lib/i18n'
import type { GHLFunnel } from '@/lib/ghl/sites'

const typeBadge: Record<string, string> = {
  funnel: 'bg-violet-100 text-violet-700',
  website: 'bg-blue-100 text-blue-700',
}

interface Props {
  funnels: GHLFunnel[]
  total: number
  locationId: string
}

type FilterType = 'all' | 'funnel' | 'website'

export function SitesShell({ funnels, total, locationId }: Props) {
  const locale = useLocale()
  const t = getTranslations(locale).sites
  const [filter, setFilter] = useState<FilterType>('all')
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)

  const typeLabel: Record<string, string> = {
    funnel: t.type_funnel,
    website: t.type_website,
  }

  const filtered = funnels.filter(f => {
    const matchType = filter === 'all' || f.type === filter
    const matchSearch = !search || f.name.toLowerCase().includes(search.toLowerCase())
    return matchType && matchSearch
  })

  const funnelCount = funnels.filter(f => f.type === 'funnel').length
  const websiteCount = funnels.filter(f => f.type === 'website').length

  const tabs: { value: FilterType; label: string; count: number }[] = [
    { value: 'all', label: t.tab_all, count: funnels.length },
    { value: 'funnel', label: t.tab_funnels, count: funnelCount },
    { value: 'website', label: t.tab_websites, count: websiteCount },
  ]

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{t.title}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{t.subtitle}</p>
        </div>
        <a
          href={`https://app.gohighlevel.com/location/${locationId}/funnels`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-2 bg-[#7C3AED] text-white text-sm font-medium rounded-lg hover:bg-[#6D28D9] transition-colors"
        >
          <Plus className="w-4 h-4" />
          {t.new_site}
        </a>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: t.stat_total, value: formatNumber(total || funnels.length, locale), icon: Globe, color: 'text-violet-600 bg-violet-50' },
          { label: t.stat_funnels, value: formatNumber(funnelCount, locale), icon: BarChart2, color: 'text-blue-600 bg-blue-50' },
          { label: t.stat_websites, value: formatNumber(websiteCount, locale), icon: Eye, color: 'text-green-600 bg-green-50' },
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
            <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0', stat.color)}>
              <stat.icon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs text-gray-500">{stat.label}</p>
              <p className="text-xl font-bold text-gray-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters + Search */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex bg-gray-100 rounded-lg p-0.5 gap-0.5">
          {tabs.map(tab => (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              className={cn(
                'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                filter === tab.value
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              {tab.label}
              <span className={cn(
                'ml-1.5 text-xs px-1.5 py-0.5 rounded-full',
                filter === tab.value ? 'bg-[#7C3AED]/10 text-[#7C3AED]' : 'bg-gray-200 text-gray-500'
              )}>
                {formatNumber(tab.count, locale)}
              </span>
            </button>
          ))}
        </div>
        <div className="relative flex-1 min-w-40">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t.search_placeholder}
            className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED]"
          />
        </div>
      </div>

      {/* Sites list */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-gray-200">
          <div className="w-16 h-16 rounded-2xl bg-[#EDE9FE] flex items-center justify-center mx-auto mb-4">
            <Globe className="w-8 h-8 text-[#7C3AED]" />
          </div>
          <h3 className="font-semibold text-gray-800 mb-1">{t.no_sites_title}</h3>
          <p className="text-sm text-gray-400 mb-5 max-w-xs mx-auto">
            {t.no_sites_subtitle}
          </p>
          <a
            href={`https://app.gohighlevel.com/location/${locationId}/funnels`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#7C3AED] text-white text-sm font-medium rounded-lg hover:bg-[#6D28D9] transition-colors"
          >
            <Plus className="w-4 h-4" />
            {t.create_in_ghl}
          </a>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(funnel => {
            const isOpen = expanded === funnel.id
            return (
              <div key={funnel.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:border-[#7C3AED]/30 transition-colors">
                {/* Card header */}
                <div className="flex items-center gap-4 p-4">
                  <div className="w-10 h-10 rounded-xl bg-[#EDE9FE] flex items-center justify-center flex-shrink-0">
                    <Globe className="w-5 h-5 text-[#7C3AED]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-semibold text-gray-900 leading-tight">{funnel.name}</h3>
                      <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', typeBadge[funnel.type] ?? 'bg-gray-100 text-gray-600')}>
                        {typeLabel[funnel.type] ?? funnel.type}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-400 flex-wrap">
                      {funnel.url && (
                        <a
                          href={funnel.url.startsWith('http') ? funnel.url : `https://${funnel.url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-[#7C3AED] hover:underline"
                          onClick={e => e.stopPropagation()}
                        >
                          <ExternalLink className="w-3 h-3" />
                          {funnel.url}
                        </a>
                      )}
                      {funnel.steps?.length > 0 && (
                        <span>{formatNumber(funnel.steps.length, locale)}{locale === 'en' ? ' ' : ''}{t.pages_suffix}</span>
                      )}
                      <span>{t.updated_prefix} {formatDate(funnel.dateUpdated, locale)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <a
                      href={`https://app.gohighlevel.com/location/${locationId}/funnels/builder/${funnel.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 text-xs font-medium text-[#7C3AED] border border-[#7C3AED]/30 rounded-lg hover:bg-[#7C3AED]/5 transition-colors"
                    >
                      {t.edit} ↗
                    </a>
                    {funnel.steps?.length > 0 && (
                      <button
                        onClick={() => setExpanded(isOpen ? null : funnel.id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </button>
                    )}
                  </div>
                </div>

                {/* Pages list (expanded) */}
                {isOpen && funnel.steps?.length > 0 && (
                  <div className="border-t border-gray-100 bg-gray-50 px-4 py-3 space-y-2">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{t.pages_heading}</p>
                    {funnel.steps.map((page, idx) => (
                      <div key={page.id ?? idx} className="flex items-center gap-3 py-2 px-3 bg-white rounded-lg border border-gray-100">
                        <div className="w-6 h-6 rounded-md bg-[#EDE9FE] flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-[#7C3AED]">{formatNumber(idx + 1, locale)}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{page.name}</p>
                          {page.pathUri && (
                            <p className="text-xs text-gray-400 font-mono truncate">/{page.pathUri}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {page.url && (
                            <a
                              href={page.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 text-gray-400 hover:text-[#7C3AED] transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <p className="text-xs text-gray-400 text-center">
        {t.footer_note} ·{' '}
        <a
          href={`https://app.gohighlevel.com/location/${locationId}/funnels`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#7C3AED] hover:underline"
        >
          {t.view_in_ghl}
        </a>
      </p>
    </div>
  )
}
