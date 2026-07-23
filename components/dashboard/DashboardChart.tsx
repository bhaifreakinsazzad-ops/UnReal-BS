'use client'

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useLocale } from '@/lib/i18n/context'

const data = [
  { dayEn: 'Sat', dayBn: 'শনি', leads: 12, revenue: 28000 },
  { dayEn: 'Sun', dayBn: 'রবি', leads: 8, revenue: 21000 },
  { dayEn: 'Mon', dayBn: 'সোম', leads: 19, revenue: 34500 },
  { dayEn: 'Tue', dayBn: 'মঙ্গল', leads: 15, revenue: 29000 },
  { dayEn: 'Wed', dayBn: 'বুধ', leads: 22, revenue: 41000 },
  { dayEn: 'Thu', dayBn: 'বৃহ', leads: 17, revenue: 38000 },
  { dayEn: 'Fri', dayBn: 'শুক্র', leads: 23, revenue: 45000 },
]

export function DashboardChart() {
  const locale = useLocale()
  const localizedData = data.map((row) => ({
    ...row,
    day: locale === 'bn' ? row.dayBn : row.dayEn,
  }))

  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={localizedData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="gradLeads" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.22} />
              <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#D8B86A" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#D8B86A" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#EEF2F7" />
          <XAxis
            dataKey="day"
            tick={{ fontSize: 11, fill: '#9CA3AF', fontFamily: locale === 'bn' ? 'Hind Siliguri, sans-serif' : 'Inter, sans-serif' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#9CA3AF' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              background: '#fff',
              border: '1px solid #E5E7EB',
              borderRadius: 14,
              boxShadow: '0 16px 40px rgba(15,23,42,0.10)',
              fontSize: 12,
            }}
            labelStyle={{ fontFamily: locale === 'bn' ? 'Hind Siliguri, sans-serif' : 'Inter, sans-serif', color: '#374151' }}
          />
          <Area
            type="monotone"
            dataKey="leads"
            stroke="#7C3AED"
            strokeWidth={2}
            fill="url(#gradLeads)"
            name={locale === 'bn' ? 'লিড' : 'Leads'}
          />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="#D8B86A"
            strokeWidth={2}
            fill="url(#gradRevenue)"
            name={locale === 'bn' ? 'আয় ($)' : 'Revenue ($)'}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
