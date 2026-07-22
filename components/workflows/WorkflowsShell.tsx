'use client'

import { useState } from 'react'
import { Plus, Zap, ArrowDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { GHLWorkflow } from '@/lib/ghl/workflows'

const triggerOptions = [
  { icon: '👤', label: 'নতুন কন্টাক্ট' },
  { icon: '💬', label: 'মেসেজ আসলে' },
  { icon: '🏷️', label: 'ট্যাগ যোগ হলে' },
  { icon: '💳', label: 'পেমেন্ট হলে' },
  { icon: '📅', label: 'নির্দিষ্ট সময়ে' },
  { icon: '📋', label: 'ফর্ম সাবমিট' },
]

const actionOptions = [
  { icon: '📱', label: 'WhatsApp পাঠাও' },
  { icon: '💬', label: 'SMS পাঠাও' },
  { icon: '📧', label: 'ইমেইল পাঠাও' },
  { icon: '🏷️', label: 'ট্যাগ লাগাও' },
  { icon: '⏰', label: 'অপেক্ষা করো' },
  { icon: '🤖', label: 'এজেন্ট চালাও' },
]

interface WorkflowToggle {
  id: string
  active: boolean
}

interface Props {
  workflows: GHLWorkflow[]
}

type View = 'list' | 'builder'

export function WorkflowsShell({ workflows: initialWorkflows }: Props) {
  const [view, setView] = useState<View>('list')
  const [toggles, setToggles] = useState<WorkflowToggle[]>(
    initialWorkflows.map(w => ({ id: w.id, active: w.status === 'published' }))
  )
  const [showTrigger, setShowTrigger] = useState(false)
  const [steps, setSteps] = useState<{ icon: string; label: string }[]>([])
  const [trigger, setTrigger] = useState<{ icon: string; label: string } | null>(null)

  function toggleWorkflow(id: string) {
    setToggles(prev => prev.map(t => t.id === id ? { ...t, active: !t.active } : t))
  }

  function isActive(id: string) {
    return toggles.find(t => t.id === id)?.active ?? false
  }

  function formatDate(dateStr: string) {
    try {
      return new Date(dateStr).toLocaleDateString('bn-BD', { day: '2-digit', month: 'short', year: 'numeric' })
    } catch {
      return dateStr
    }
  }

  if (view === 'builder') {
    return (
      <div className="flex flex-col h-full bg-gray-50">
        <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200 flex-shrink-0">
          <button onClick={() => setView('list')} className="text-sm text-[#7C3AED] font-medium hover:underline">
            ← ফিরে যান
          </button>
          <h2 className="text-sm font-bold text-gray-900">নতুন ওয়ার্কফ্লো</h2>
          <button
            onClick={() => setView('list')}
            className="text-sm px-3 py-1.5 bg-[#7C3AED] text-white rounded-lg font-medium hover:bg-[#6D28D9] transition-colors"
          >
            সেভ করুন
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 max-w-lg mx-auto w-full">
          <div
            onClick={() => setShowTrigger(true)}
            className={cn(
              'rounded-2xl border-2 border-dashed p-4 text-center cursor-pointer transition-colors',
              trigger
                ? 'bg-green-50 border-green-300 text-green-700'
                : 'bg-gray-50 border-gray-300 text-gray-400 hover:border-[#7C3AED] hover:bg-[#EDE9FE]/30'
            )}
          >
            <div className="flex items-center justify-center gap-2 mb-1">
              <Zap className="w-5 h-5" />
              <span className="font-semibold text-sm">যখন...</span>
            </div>
            {trigger ? (
              <p className="text-sm font-medium">{trigger.icon} {trigger.label}</p>
            ) : (
              <p className="text-xs">ট্রিগার বাছুন — কখন এটি চালু হবে</p>
            )}
          </div>

          {showTrigger && (
            <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-md">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">ট্রিগার বাছুন</p>
              <div className="grid grid-cols-2 gap-2">
                {triggerOptions.map(opt => (
                  <button key={opt.label}
                    onClick={() => { setTrigger(opt); setShowTrigger(false) }}
                    className="flex items-center gap-2 p-3 rounded-xl bg-gray-50 hover:bg-[#EDE9FE] hover:text-[#7C3AED] transition-colors text-left text-sm">
                    <span>{opt.icon}</span>
                    <span className="font-medium text-gray-700">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {steps.map((step, i) => (
            <div key={i}>
              <div className="flex justify-center my-2"><ArrowDown className="w-5 h-5 text-gray-300" /></div>
              <div className="rounded-2xl bg-[#EDE9FE] border border-[#7C3AED]/20 p-4">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{step.icon}</span>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500">তাহলে...</p>
                    <p className="text-sm font-semibold text-[#7C3AED]">{step.label}</p>
                  </div>
                  <button onClick={() => setSteps(prev => prev.filter((_, idx) => idx !== i))}
                    className="text-gray-400 hover:text-red-500 text-lg leading-none">×</button>
                </div>
              </div>
            </div>
          ))}

          <div className="flex justify-center my-2"><ArrowDown className="w-5 h-5 text-gray-300" /></div>
          <div className="bg-white rounded-2xl border border-gray-200 p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">কাজ যোগ করুন</p>
            <div className="grid grid-cols-2 gap-2">
              {actionOptions.map(opt => (
                <button key={opt.label}
                  onClick={() => setSteps(prev => [...prev, opt])}
                  className="flex items-center gap-2 p-3 rounded-xl bg-gray-50 hover:bg-[#EDE9FE] hover:text-[#7C3AED] transition-colors text-left text-sm">
                  <span>{opt.icon}</span>
                  <span className="font-medium text-gray-700 text-xs">{opt.label}</span>
                </button>
              ))}
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
          <h1 className="text-xl font-bold text-gray-900">ওয়ার্কফ্লো</h1>
          <p className="text-sm text-gray-500 mt-0.5">স্বয়ংক্রিয় কাজগুলো পরিচালনা করুন</p>
        </div>
        <button
          onClick={() => setView('builder')}
          className="flex items-center gap-1.5 px-3 py-2 bg-[#7C3AED] text-white text-sm font-medium rounded-lg hover:bg-[#6D28D9] transition-colors"
        >
          <Plus className="w-4 h-4" />
          নতুন
        </button>
      </div>

      {initialWorkflows.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Zap className="w-12 h-12 mx-auto mb-3 text-gray-200" />
          <p className="font-medium text-gray-500">এখনো কোনো ওয়ার্কফ্লো নেই</p>
          <p className="text-sm mt-1">GHL-এ ওয়ার্কফ্লো তৈরি করলে এখানে দেখাবে, অথবা নতুন বানান।</p>
          <button
            onClick={() => setView('builder')}
            className="mt-4 px-4 py-2 bg-[#7C3AED] text-white text-sm font-medium rounded-lg hover:bg-[#6D28D9] transition-colors"
          >
            প্রথম ওয়ার্কফ্লো তৈরি করুন
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {initialWorkflows.map(wf => (
            <div key={wf.id} className="bg-white rounded-xl border border-gray-200 p-4 hover:border-[#7C3AED]/30 transition-colors">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#EDE9FE] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Zap className="w-5 h-5 text-[#7C3AED]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-gray-900">{wf.name}</h3>
                    <button
                      onClick={() => toggleWorkflow(wf.id)}
                      className={cn(
                        'relative w-11 h-6 rounded-full transition-colors flex-shrink-0',
                        isActive(wf.id) ? 'bg-[#7C3AED]' : 'bg-gray-200'
                      )}
                    >
                      <span className={cn(
                        'absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform',
                        isActive(wf.id) ? 'translate-x-6' : 'translate-x-1'
                      )} />
                    </button>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-400 mt-2">
                    <span className={cn(
                      'px-2 py-0.5 rounded-full font-medium',
                      isActive(wf.id) ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    )}>
                      {isActive(wf.id) ? '● প্রকাশিত' : '⏸ ড্রাফট'}
                    </span>
                    <span>ভার্সন {wf.version}</span>
                    <span>•</span>
                    <span>তৈরি: {formatDate(wf.createdAt)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
