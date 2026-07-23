'use client'

import { useState } from 'react'
import { Plus, Zap, ArrowDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLocale } from '@/lib/i18n/context'
import type { GHLWorkflow } from '@/lib/ghl/workflows'

const triggerOptions = [
  { labelEn: 'New Contact', labelBn: 'নতুন কন্টাক্ট' },
  { labelEn: 'Message Received', labelBn: 'মেসেজ আসলে' },
  { labelEn: 'Tag Added', labelBn: 'ট্যাগ যোগ হলে' },
  { labelEn: 'Payment Received', labelBn: 'পেমেন্ট হলে' },
  { labelEn: 'Scheduled Time', labelBn: 'নির্দিষ্ট সময়ে' },
  { labelEn: 'Form Submitted', labelBn: 'ফর্ম সাবমিট' },
]

const actionOptions = [
  { labelEn: 'Send WhatsApp', labelBn: 'WhatsApp পাঠাও' },
  { labelEn: 'Send SMS', labelBn: 'SMS পাঠাও' },
  { labelEn: 'Send Email', labelBn: 'ইমেইল পাঠাও' },
  { labelEn: 'Apply Tag', labelBn: 'ট্যাগ লাগাও' },
  { labelEn: 'Wait', labelBn: 'অপেক্ষা করো' },
  { labelEn: 'Run Agent', labelBn: 'এজেন্ট চালাও' },
]

interface WorkflowToggle {
  id: string
  active: boolean
}

interface Step {
  labelEn: string
  labelBn: string
}

interface Props {
  workflows: GHLWorkflow[]
}

type View = 'list' | 'builder'

export function WorkflowsShell({ workflows: initialWorkflows }: Props) {
  const locale = useLocale()
  const isBn = locale === 'bn'
  const [view, setView] = useState<View>('list')
  const [toggles, setToggles] = useState<WorkflowToggle[]>(
    initialWorkflows.map(w => ({ id: w.id, active: w.status === 'published' }))
  )
  const [showTrigger, setShowTrigger] = useState(false)
  const [steps, setSteps] = useState<Step[]>([])
  const [trigger, setTrigger] = useState<Step | null>(null)

  function toggleWorkflow(id: string) {
    setToggles(prev => prev.map(t => t.id === id ? { ...t, active: !t.active } : t))
  }

  function isActive(id: string) {
    return toggles.find(t => t.id === id)?.active ?? false
  }

  function label(step: Step) {
    return isBn ? step.labelBn : step.labelEn
  }

  function formatDate(dateStr: string) {
    try {
      return new Date(dateStr).toLocaleDateString(isBn ? 'bn-BD' : 'en-US', { day: '2-digit', month: 'short', year: 'numeric' })
    } catch {
      return dateStr
    }
  }

  if (view === 'builder') {
    return (
      <div className="flex flex-col h-full bg-gray-50">
        <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200 flex-shrink-0">
          <button onClick={() => setView('list')} className="text-sm text-[#7C3AED] font-medium hover:underline">
            ← {isBn ? 'ফিরে যান' : 'Back'}
          </button>
          <h2 className="text-sm font-bold text-gray-900">{isBn ? 'নতুন ওয়ার্কফ্লো' : 'New Workflow'}</h2>
          <button onClick={() => setView('list')} className="text-sm px-3 py-1.5 bg-[#7C3AED] text-white rounded-lg font-medium hover:bg-[#6D28D9] transition-colors">
            {isBn ? 'সেভ করুন' : 'Save'}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 max-w-lg mx-auto w-full">
          <div
            onClick={() => setShowTrigger(true)}
            className={cn('rounded-2xl border-2 border-dashed p-4 text-center cursor-pointer transition-colors', trigger ? 'bg-green-50 border-green-300 text-green-700' : 'bg-gray-50 border-gray-300 text-gray-400 hover:border-[#7C3AED] hover:bg-[#EDE9FE]/30')}
          >
            <div className="flex items-center justify-center gap-2 mb-1">
              <Zap className="w-5 h-5" />
              <span className="font-semibold text-sm">{isBn ? 'যখন...' : 'When...'}</span>
            </div>
            {trigger ? <p className="text-sm font-medium">{label(trigger)}</p> : <p className="text-xs">{isBn ? 'ট্রিগার বাছুন - কখন এটি চালু হবে' : 'Choose the trigger that starts this workflow'}</p>}
          </div>

          {showTrigger && (
            <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-md">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">{isBn ? 'ট্রিগার বাছুন' : 'Choose Trigger'}</p>
              <div className="grid grid-cols-2 gap-2">
                {triggerOptions.map(opt => (
                  <button key={opt.labelEn} onClick={() => { setTrigger(opt); setShowTrigger(false) }} className="p-3 rounded-xl bg-gray-50 hover:bg-[#EDE9FE] hover:text-[#7C3AED] transition-colors text-left text-sm font-medium">
                    {label(opt)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {steps.map((step, i) => (
            <div key={`${step.labelEn}-${i}`}>
              <div className="flex justify-center my-2"><ArrowDown className="w-5 h-5 text-gray-300" /></div>
              <div className="rounded-2xl bg-[#EDE9FE] border border-[#7C3AED]/20 p-4">
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <p className="text-xs text-gray-500">{isBn ? 'তাহলে...' : 'Then...'}</p>
                    <p className="text-sm font-semibold text-[#7C3AED]">{label(step)}</p>
                  </div>
                  <button onClick={() => setSteps(prev => prev.filter((_, idx) => idx !== i))} className="text-gray-400 hover:text-red-500 text-lg leading-none">×</button>
                </div>
              </div>
            </div>
          ))}

          <div className="flex justify-center my-2"><ArrowDown className="w-5 h-5 text-gray-300" /></div>
          <div className="bg-white rounded-2xl border border-gray-200 p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">{isBn ? 'কাজ যোগ করুন' : 'Add Action'}</p>
            <div className="grid grid-cols-2 gap-2">
              {actionOptions.map(opt => (
                <button key={opt.labelEn} onClick={() => setSteps(prev => [...prev, opt])} className="p-3 rounded-xl bg-gray-50 hover:bg-[#EDE9FE] hover:text-[#7C3AED] transition-colors text-left text-xs font-medium">
                  {label(opt)}
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
          <h1 className="text-xl font-bold text-gray-900">{isBn ? 'ওয়ার্কফ্লো' : 'Workflows'}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{isBn ? 'স্বয়ংক্রিয় কাজগুলো পরিচালনা করুন' : 'Manage automated business processes.'}</p>
        </div>
        <button onClick={() => setView('builder')} className="flex items-center gap-1.5 px-3 py-2 bg-[#7C3AED] text-white text-sm font-medium rounded-lg hover:bg-[#6D28D9] transition-colors">
          <Plus className="w-4 h-4" />
          {isBn ? 'নতুন' : 'New'}
        </button>
      </div>

      {initialWorkflows.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Zap className="w-12 h-12 mx-auto mb-3 text-gray-200" />
          <p className="font-medium text-gray-500">{isBn ? 'এখনো কোনো ওয়ার্কফ্লো নেই' : 'No workflows yet'}</p>
          <p className="text-sm mt-1">{isBn ? 'GHL-এ ওয়ার্কফ্লো তৈরি করলে এখানে দেখাবে, অথবা নতুন বানান।' : 'Workflows created in GHL will appear here, or build a local draft.'}</p>
          <button onClick={() => setView('builder')} className="mt-4 px-4 py-2 bg-[#7C3AED] text-white text-sm font-medium rounded-lg hover:bg-[#6D28D9] transition-colors">
            {isBn ? 'প্রথম ওয়ার্কফ্লো তৈরি করুন' : 'Create first workflow'}
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
                    <button onClick={() => toggleWorkflow(wf.id)} className={cn('relative w-11 h-6 rounded-full transition-colors flex-shrink-0', isActive(wf.id) ? 'bg-[#7C3AED]' : 'bg-gray-200')} aria-label="Toggle workflow">
                      <span className={cn('absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform', isActive(wf.id) ? 'translate-x-6' : 'translate-x-1')} />
                    </button>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-400 mt-2">
                    <span className={cn('px-2 py-0.5 rounded-full font-medium', isActive(wf.id) ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500')}>
                      {isActive(wf.id) ? (isBn ? '● প্রকাশিত' : '● Published') : (isBn ? '⏸ ড্রাফট' : '⏸ Draft')}
                    </span>
                    <span>{isBn ? 'ভার্সন' : 'Version'} {wf.version}</span>
                    <span>•</span>
                    <span>{isBn ? 'তৈরি:' : 'Created:'} {formatDate(wf.createdAt)}</span>
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
