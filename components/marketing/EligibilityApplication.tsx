'use client'

import { useCallback, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2, Loader2, Send } from 'lucide-react'
import { Input, Textarea } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { TurnstileWidget } from '@/components/privacy/TurnstileWidget'
import { captureAttribution, createMetaEventId, trackMetaEvent } from '@/lib/meta/client-events'
import { brand } from '@/lib/brand'

interface EligibilityApplicationProps {
  intent?: string
  service?: string
}

const businessTypes = ['Agency', 'Clinic', 'Restaurant', 'Education', 'Real Estate', 'E-commerce', 'Local Service', 'Other']
const preferredContacts = ['WhatsApp', 'Phone', 'Email']

export function EligibilityApplication({ intent, service }: EligibilityApplicationProps) {
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const [turnstileToken, setTurnstileToken] = useState('')
  const handleTurnstileToken = useCallback((token: string) => setTurnstileToken(token), [])

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatus('submitting')
    setMessage('')

    const formData = new FormData(event.currentTarget)
    const eventId = createMetaEventId()
    const attribution = { ...captureAttribution(), eventId }
    const payload = Object.fromEntries(formData.entries())

    try {
      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, intent, service, turnstileToken, ...attribution }),
      })
      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(data?.message ?? 'Application could not be submitted right now.')
      }

      setStatus('success')
      setMessage('Application received. Our team will verify eligibility.')
      trackMetaEvent('Lead', {}, eventId)
      event.currentTarget.reset()
    } catch (error) {
      setStatus('error')
      setMessage(error instanceof Error ? error.message : 'Application could not be submitted right now.')
    }
  }

  return (
    <main className="min-h-screen bg-[#070B12] px-4 py-8 text-white sm:px-6">
      <div className="mx-auto max-w-5xl">
        <Link href="/unreal-bs" className="mb-8 inline-flex items-center gap-2 text-sm font-bold text-white/60 hover:text-white">
          <ArrowLeft className="h-4 w-4" />
          Back to {brand.name}
        </Link>

        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-2xl border border-white/10 bg-white/[0.05] p-6">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#00C875]">Agency takeover eligibility</p>
            <h1 className="mt-4 text-4xl font-black leading-tight">
              Build my SaaS IT agency system
            </h1>
            <p className="mt-4 text-base leading-7 text-white/70">
              Tell us about your agency or business. We will verify fit, portal setup needs, and the first managed delivery sprint.
            </p>
            <div className="mt-8 space-y-4">
              {[
                'Agency OS activation ৳4,999 and managed monthly ৳6,999 founding offer.',
                'Scope CRM, funnel, AI, ads, wallet, and service delivery before activation.',
                'No official HighLevel endorsement is claimed.',
              ].map((item) => (
                <div key={item} className="flex gap-3 text-sm text-white/70">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#D8B86A]" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl bg-white p-5 text-gray-950 shadow-2xl shadow-black/30 sm:p-6">
            {status === 'success' ? (
              <div className="flex min-h-[520px] flex-col items-center justify-center text-center">
                <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#D1FAE5] text-[#059669]">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <h2 className="text-2xl font-black">Application received.</h2>
                <p className="mt-3 max-w-md text-sm leading-6 text-gray-500">
                  Our team will verify eligibility and contact you through your preferred channel.
                </p>
                <Button className="mt-8" onClick={() => setStatus('idle')}>
                  Submit another application
                </Button>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input name="businessName" label="Business Name" required />
                  <Input name="ownerName" label="Owner Name" required />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input name="phone" label="Phone / WhatsApp" required />
                  <Input name="email" label="Email" type="email" />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <SelectField name="businessType" label="Business Type" required options={businessTypes} />
                  <Input name="serviceCategory" label="Service Category" placeholder="Website, ads, clinic, etc." />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input name="serviceArea" label="Service Area" required placeholder="Dhaka, Chattogram, Bangladesh..." />
                  <Input name="averageOrderValue" label="Average Order Value" placeholder="৳25,000" />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input name="monthlyInquiries" label="Monthly Inquiries" placeholder="50-100" />
                  <Input name="teamSize" label="Team Size" placeholder="5" />
                </div>
                <Textarea
                  name="mainProblem"
                  label="Main Problem"
                  required
                  rows={4}
                  placeholder="Lead follow-up, staff control, missed messages, sales reporting..."
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <SelectField
                    name="wantsOpportunityCredit"
                    label="Wants Opportunity Credit?"
                    options={['yes', 'no']}
                    defaultValue={intent === 'credit' ? 'yes' : 'yes'}
                  />
                  <SelectField name="preferredContact" label="Preferred Contact" options={preferredContacts} defaultValue="WhatsApp" />
                </div>
                <input type="hidden" name="campaignKeyword" value="HIGH LEVEL" />
                <TurnstileWidget onToken={handleTurnstileToken} />
                {/* Honeypot: hidden off-screen (not display:none) so simple
                    bots that fill every visible-in-DOM field still trip it,
                    while real users never see or reach it. */}
                <input
                  type="text"
                  name="website"
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                  style={{ position: 'absolute', left: '-9999px', top: '-9999px', width: 1, height: 1, opacity: 0 }}
                />

                {message && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {message}
                  </div>
                )}

                <p className="text-xs text-neutral-500">
                  By submitting, you agree to our{' '}
                  <a href="/terms" className="underline hover:text-neutral-700">Terms</a>
                  {' '}and{' '}
                  <a href="/privacy" className="underline hover:text-neutral-700">Privacy Policy</a>.
                </p>

                <Button type="submit" size="lg" className="w-full" disabled={status === 'submitting'}>
                  {status === 'submitting' ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Submitting
                    </>
                  ) : (
                    <>
                      Submit Eligibility Application
                      <Send className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
            )}
          </section>
        </div>
      </div>
    </main>
  )
}

function SelectField({
  label,
  name,
  options,
  required,
  defaultValue,
}: {
  label: string
  name: string
  options: string[]
  required?: boolean
  defaultValue?: string
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>
      <select
        name={name}
        required={required}
        defaultValue={defaultValue ?? ''}
        className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 transition-all focus:border-[#7C3AED] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20"
      >
        <option value="" disabled>Select one</option>
        {options.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    </div>
  )
}
