'use client'

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const data = [
  { day: 'শনি', leads: 12, revenue: 28000 },
  { day: 'রবি', leads: 8, revenue: 21000 },
  { day: 'সোম', leads: 19, revenue: 34500 },
  { day: 'মঙ্গল', leads: 15, revenue: 29000 },
  { day: 'বুধ', leads: 22, revenue: 41000 },
  { day: 'বৃহ', leads: 17, revenue: 38000 },
  { day: 'শুক্র', leads: 23, revenue: 45000 },
]

export function DashboardChart() {
  return (
    <div className="h-52">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="gradLeads" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#00C875" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#00C875" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
          <XAxis
            dataKey="day"
            tick={{ fontSize: 11, fill: '#9CA3AF', fontFamily: 'Hind Siliguri, sans-serif' }}
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
              borderRadius: 12,
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              fontSize: 12,
            }}
            labelStyle={{ fontFamily: 'Hind Siliguri, sans-serif', color: '#374151' }}
          />
          <Area
            type="monotone"
            dataKey="leads"
            stroke="#7C3AED"
            strokeWidth={2}
            fill="url(#gradLeads)"
            name="লিড"
          />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="#00C875"
            strokeWidth={2}
            fill="url(#gradRevenue)"
            name="আয় (৳)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
