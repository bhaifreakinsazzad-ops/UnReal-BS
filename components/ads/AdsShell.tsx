'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, ArrowUpRight, Loader2, Megaphone, Plus, Sparkles, Users } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Input, Textarea } from '@/components/ui/input'
import { useLocale } from '@/lib/i18n/context'

interface Campaign {
  id: string
  name: string
  objective: string
  platforms: string[]
  dailyBudgetBdt: number
  durationDays: number
  totalBudgetBdt: number
  status: string
  fulfilmentMode: string
  audienceLocation: string
  headline: string
  rejectionReason: string | null
  operatorNote: string | null
  reportedReach: number | null
  reportedImpressions: number | null
  reportedClicks: number | null
  reportedSpendBdt: number | null
  createdAt: string
}

const OBJECTIVES = [
  { value: 'messages', en: 'Get WhatsApp messages', bn: 'WhatsApp মেসেজ পান' },
  { value: 'leads', en: 'Collect customer details', bn: 'কাস্টমারের তথ্য সংগ্রহ করুন' },
  { value: 'traffic', en: 'Send people to my website', bn: 'ওয়েবসাইটে ভিজিটর আনুন' },
  { value: 'sales', en: 'Sell a product', bn: 'পণ্য বিক্রি করুন' },
  { value: 'engagement', en: 'Get likes and comments', bn: 'লাইক ও কমেন্ট পান' },
  { value: 'awareness', en: 'Let more people know my shop', bn: 'দোকানের পরিচিতি বাড়ান' },
]

const STATUS_LABEL: Record<string, { en: string; bn: string; tone: string }> = {
  draft: { en: 'Draft', bn: 'খসড়া', tone: 'bg-gray-100 text-gray-600' },
  submitted: { en: 'Submitted', bn: 'জমা হয়েছে', tone: 'bg-blue-50 text-blue-700' },
  in_review: { en: 'Being set up', bn: 'সেট আপ হচ্ছে', tone: 'bg-amber-50 text-amber-700' },
  scheduled: { en: 'Scheduled', bn: 'নির্ধারিত', tone: 'bg-violet-50 text-violet-700' },
  live: { en: 'Running', bn: 'চলছে', tone: 'bg-green-50 text-green-700' },
  paused: { en: 'Paused', bn: 'বন্ধ আছে', tone: 'bg-gray-100 text-gray-600' },
  completed: { en: 'Finished', bn: 'শেষ হয়েছে', tone: 'bg-gray-100 text-gray-600' },
  rejected: { en: 'Needs changes', bn: 'পরিবর্তন দরকার', tone: 'bg-red-50 text-red-700' },
  cancelled: { en: 'Cancelled', bn: 'বাতিল', tone: 'bg-gray-100 text-gray-500' },
}

function bdt(v: number) {
  return `৳${v.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
}

export function AdsShell() {
  const locale = useLocale()
  const isBn = locale === 'bn'
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [directPublishing, setDirectPublishing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    name: '',
    objective: 'messages',
    platforms: ['facebook'] as string[],
    dailyBudgetBdt: '200',
    durationDays: '7',
    audienceLocation: 'Dhaka, Bangladesh',
    audienceAgeMin: '18',
    audienceAgeMax: '55',
    audienceGender: 'all',
    audienceInterests: '',
    headline: '',
    primaryText: '',
    whatsappNumber: '',
    destinationUrl: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [writing, setWriting] = useState(false)

  function load() {
    fetch('/api/ads/campaigns')
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('failed'))))
      .then((json: { campaigns: Campaign[]; directPublishing: boolean }) => {
        setCampaigns(json.campaigns ?? [])
        setDirectPublishing(Boolean(json.directPublishing))
      })
      .catch(() => setError(isBn ? 'বিজ্ঞাপন লোড করা যায়নি।' : 'Could not load campaigns.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Ad copy is written by the SAME metered AI endpoint the chat feature uses —
  // so it is billed, capped and free-tier aware with no separate money path.
  async function writeWithAI() {
    if (!form.name.trim()) {
      setError(isBn ? 'আগে ব্যবসা বা পণ্যের নাম লিখুন।' : 'Enter your business or product name first.')
      return
    }
    setWriting(true)
    setError(null)
    try {
      const objective = OBJECTIVES.find((o) => o.value === form.objective)
      const prompt = isBn
        ? `তুমি বাংলাদেশের ছোট ব্যবসার জন্য Facebook বিজ্ঞাপনের কপিরাইটার। "${form.name}" এর জন্য একটি বিজ্ঞাপন লেখো। লক্ষ্য: ${objective?.bn}. এলাকা: ${form.audienceLocation}.
ঠিক এই ফরম্যাটে উত্তর দাও, অন্য কিছু লিখবে না:
HEADLINE: <সর্বোচ্চ ৪০ অক্ষরের আকর্ষণীয় শিরোনাম>
BODY: <২-৩ বাক্যের বিজ্ঞাপন, সহজ বাংলায়, দাম বা অফার থাকলে উল্লেখ করো>`
        : `You are a Facebook ad copywriter for small businesses in Bangladesh. Write an ad for "${form.name}". Goal: ${objective?.en}. Area: ${form.audienceLocation}.
Reply in exactly this format and nothing else:
HEADLINE: <catchy headline, max 40 characters>
BODY: <2-3 sentence ad, simple language, mention price or offer if relevant>`

      const res = await fetch('/api/ai-subscriptions/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modelId: 'gpt-4o-mini', messages: [{ role: 'user', content: prompt }] }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json?.message ?? 'Could not write the ad.')

      const reply: string = json.reply ?? ''
      const headline = reply.match(/HEADLINE:\s*(.+)/i)?.[1]?.trim()
      const bodyText = reply.match(/BODY:\s*([\s\S]+)/i)?.[1]?.trim()
      setForm((f) => ({
        ...f,
        headline: headline?.slice(0, 120) ?? f.headline,
        primaryText: bodyText?.slice(0, 2000) ?? f.primaryText,
      }))
    } catch (err) {
      setError(err instanceof Error ? err.message : isBn ? 'লেখা যায়নি।' : 'Could not write the ad.')
    } finally {
      setWriting(false)
    }
  }

  async function save(submit: boolean) {
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/ads/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          objective: form.objective,
          platforms: form.platforms,
          dailyBudgetBdt: Number(form.dailyBudgetBdt),
          durationDays: Number(form.durationDays),
          audienceLocation: form.audienceLocation.trim(),
          audienceAgeMin: Number(form.audienceAgeMin),
          audienceAgeMax: Number(form.audienceAgeMax),
          audienceGender: form.audienceGender,
          audienceInterests: form.audienceInterests.trim() || undefined,
          headline: form.headline.trim(),
          primaryText: form.primaryText.trim(),
          whatsappNumber: form.whatsappNumber.trim() || undefined,
          destinationUrl: form.destinationUrl.trim() || undefined,
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json?.message ?? 'Could not save this campaign.')

      if (submit) {
        await fetch(`/api/ads/campaigns/${json.campaign.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'submit' }),
        })
      }

      setCreating(false)
      setForm((f) => ({ ...f, name: '', headline: '', primaryText: '' }))
      setLoading(true)
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : isBn ? 'সেভ করা যায়নি।' : 'Could not save this campaign.')
    } finally {
      setSubmitting(false)
    }
  }

  const total = Number(form.dailyBudgetBdt || 0) * Number(form.durationDays || 0)

  return (
    <div className="mx-auto max-w-[1100px] space-y-5 p-4 md:p-6">
      <div className="rounded-2xl bg-[#07101F] p-5 text-white md:p-7">
        <Badge variant="accent" dot>{isBn ? 'ফেসবুক বিজ্ঞাপন' : 'Facebook Ads'}</Badge>
        <h1 className="mt-4 text-2xl font-black md:text-4xl">
          {isBn ? 'বিজ্ঞাপন দিন' : 'Advertise your business'}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-white/65">
          {isBn
            ? 'Facebook ও Instagram-এ বিজ্ঞাপন চালান। কাকে দেখাতে চান আর কত টাকা খরচ করবেন — শুধু সেটুকু বলুন, বাকিটা আমরা দেখব।'
            : 'Run ads on Facebook and Instagram. Tell us who you want to reach and what you want to spend — we handle the rest.'}
        </p>
      </div>

      {/* Says plainly who presses the final button. Nothing here pretends the
          campaign goes live by itself while it does not. */}
      {!directPublishing && (
        <div className="flex items-start gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2.5 text-xs leading-relaxed text-blue-800">
          <Users className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span>
            {isBn
              ? 'আপনার বিজ্ঞাপন আমাদের টিম Meta Ads Manager-এ সেট আপ করে দেবে। জমা দেওয়ার পর আমরা যোগাযোগ করে বাজেট ও পেমেন্ট ঠিক করব, তারপর চালু হবে।'
              : 'Our team sets your ad up in Meta Ads Manager for you. After you submit, we will contact you to confirm the budget and payment, then it goes live.'}
          </span>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-600">
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {!creating && (
        <Button onClick={() => setCreating(true)}>
          <Plus className="mr-1.5 h-4 w-4" />
          {isBn ? 'নতুন বিজ্ঞাপন' : 'New ad'}
        </Button>
      )}

      {creating && (
        <Card className="border-gray-200">
          <CardHeader className="mb-4">
            <div className="flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-[#7C3AED]" />
              <CardTitle>{isBn ? 'নতুন বিজ্ঞাপন' : 'New ad'}</CardTitle>
            </div>
          </CardHeader>

          <div className="space-y-4">
            <Input
              label={isBn ? 'আপনার ব্যবসা বা পণ্যের নাম' : 'Your business or product'}
              placeholder={isBn ? 'করিম ট্রেডার্স — শীতের কম্বল' : 'Karim Traders — winter blankets'}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />

            <div>
              <label className="mb-1.5 block text-xs font-bold text-gray-600">
                {isBn ? 'আপনি কী চান?' : 'What do you want?'}
              </label>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {OBJECTIVES.map((o) => (
                  <button
                    key={o.value}
                    onClick={() => setForm({ ...form, objective: o.value })}
                    className={`rounded-xl border px-3 py-2.5 text-left text-sm transition ${
                      form.objective === o.value
                        ? 'border-[#7C3AED] bg-[#F5F3FF] font-bold text-gray-900'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-[#7C3AED]/40'
                    }`}
                  >
                    {isBn ? o.bn : o.en}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-gray-600">
                {isBn ? 'কোথায় দেখাবেন' : 'Where to show it'}
              </label>
              <div className="flex gap-2">
                {[
                  { id: 'facebook', label: 'Facebook' },
                  { id: 'instagram', label: 'Instagram' },
                ].map((pf) => {
                  const on = form.platforms.includes(pf.id)
                  return (
                    <button
                      key={pf.id}
                      onClick={() =>
                        setForm({
                          ...form,
                          platforms: on
                            ? form.platforms.filter((x) => x !== pf.id)
                            : [...form.platforms, pf.id],
                        })
                      }
                      className={`rounded-xl border px-4 py-2 text-sm font-medium transition ${
                        on ? 'border-[#7C3AED] bg-[#F5F3FF] text-gray-900' : 'border-gray-200 bg-white text-gray-600'
                      }`}
                    >
                      {pf.label}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Input
                label={isBn ? 'প্রতিদিন কত টাকা (৳)' : 'Daily budget (৳)'}
                type="number"
                min={50}
                value={form.dailyBudgetBdt}
                onChange={(e) => setForm({ ...form, dailyBudgetBdt: e.target.value })}
              />
              <Input
                label={isBn ? 'কত দিন' : 'How many days'}
                type="number"
                min={1}
                value={form.durationDays}
                onChange={(e) => setForm({ ...form, durationDays: e.target.value })}
              />
              <div className="flex items-end">
                <div className="w-full rounded-xl bg-[#F5F3FF] px-3 py-2.5">
                  <p className="text-[11px] font-medium text-gray-500">{isBn ? 'সর্বমোট' : 'Total'}</p>
                  <p className="text-lg font-black text-[#7C3AED]">{bdt(total)}</p>
                </div>
              </div>
            </div>

            <Input
              label={isBn ? 'কোন এলাকার মানুষকে' : 'Which area'}
              placeholder={isBn ? 'ঢাকা, বাংলাদেশ' : 'Dhaka, Bangladesh'}
              value={form.audienceLocation}
              onChange={(e) => setForm({ ...form, audienceLocation: e.target.value })}
            />

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Input
                label={isBn ? 'সর্বনিম্ন বয়স' : 'Min age'}
                type="number"
                min={13}
                max={65}
                value={form.audienceAgeMin}
                onChange={(e) => setForm({ ...form, audienceAgeMin: e.target.value })}
              />
              <Input
                label={isBn ? 'সর্বোচ্চ বয়স' : 'Max age'}
                type="number"
                min={13}
                max={65}
                value={form.audienceAgeMax}
                onChange={(e) => setForm({ ...form, audienceAgeMax: e.target.value })}
              />
              <div>
                <label className="mb-1.5 block text-xs font-bold text-gray-600">
                  {isBn ? 'কাদের' : 'Gender'}
                </label>
                <select
                  value={form.audienceGender}
                  onChange={(e) => setForm({ ...form, audienceGender: e.target.value })}
                  className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:border-[#7C3AED] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20"
                >
                  <option value="all">{isBn ? 'সবাই' : 'Everyone'}</option>
                  <option value="male">{isBn ? 'পুরুষ' : 'Men'}</option>
                  <option value="female">{isBn ? 'নারী' : 'Women'}</option>
                </select>
              </div>
            </div>

            <div className="rounded-xl border border-[#7C3AED]/25 bg-[#F5F3FF]/60 p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-xs font-bold text-gray-700">
                  {isBn ? 'বিজ্ঞাপনের লেখা' : 'Ad text'}
                </p>
                <Button variant="outline" size="sm" onClick={writeWithAI} loading={writing} disabled={writing}>
                  <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                  {isBn ? 'AI দিয়ে লিখুন' : 'Write with AI'}
                </Button>
              </div>
              <p className="mb-3 text-[11px] text-gray-500">
                {isBn
                  ? 'AI দিয়ে লিখলে আপনার ওয়ালেট থেকে সামান্য খরচ হবে (প্রায় ৳০.০৬), অথবা ফ্রি মেসেজ থেকে কাটবে।'
                  : 'Writing with AI costs a few paisa from your wallet (about ৳0.06), or uses a free message.'}
              </p>
              <div className="space-y-3">
                <Input
                  label={isBn ? 'শিরোনাম' : 'Headline'}
                  placeholder={isBn ? 'শীতের কম্বল ৫০% ছাড়ে' : '50% off winter blankets'}
                  value={form.headline}
                  onChange={(e) => setForm({ ...form, headline: e.target.value })}
                />
                <Textarea
                  label={isBn ? 'বিজ্ঞাপনের মূল লেখা' : 'Ad body'}
                  rows={4}
                  value={form.primaryText}
                  onChange={(e) => setForm({ ...form, primaryText: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Input
                label={isBn ? 'WhatsApp নম্বর' : 'WhatsApp number'}
                placeholder="01XXXXXXXXX"
                value={form.whatsappNumber}
                onChange={(e) => setForm({ ...form, whatsappNumber: e.target.value })}
              />
              <Input
                label={isBn ? 'ওয়েবসাইট লিংক (থাকলে)' : 'Website link (if any)'}
                placeholder="https://"
                value={form.destinationUrl}
                onChange={(e) => setForm({ ...form, destinationUrl: e.target.value })}
              />
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              <Button onClick={() => save(true)} loading={submitting} disabled={submitting}>
                {isBn ? 'জমা দিন' : 'Submit for setup'}
              </Button>
              <Button variant="outline" onClick={() => save(false)} disabled={submitting}>
                {isBn ? 'খসড়া সেভ করুন' : 'Save draft'}
              </Button>
              <Button variant="outline" onClick={() => setCreating(false)} disabled={submitting}>
                {isBn ? 'বাতিল' : 'Cancel'}
              </Button>
            </div>
          </div>
        </Card>
      )}

      <Card padding="none" className="overflow-hidden border-gray-200">
        <CardHeader className="border-b border-gray-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-[#7C3AED]" />
            <CardTitle>{isBn ? 'আপনার বিজ্ঞাপন' : 'Your campaigns'}</CardTitle>
          </div>
          <Badge variant="gray">{campaigns.length}</Badge>
        </CardHeader>

        <div className="p-5">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              {isBn ? 'লোড হচ্ছে...' : 'Loading...'}
            </div>
          ) : campaigns.length === 0 ? (
            <p className="text-sm text-gray-500">
              {isBn ? 'এখনো কোনো বিজ্ঞাপন নেই।' : 'No campaigns yet.'}
            </p>
          ) : (
            <div className="space-y-3">
              {campaigns.map((c) => {
                const st = STATUS_LABEL[c.status] ?? STATUS_LABEL.draft
                return (
                  <div key={c.id} className="rounded-xl border border-gray-200 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-900">{c.name}</p>
                        <p className="mt-0.5 text-xs text-gray-500">
                          {bdt(c.dailyBudgetBdt)}/{isBn ? 'দিন' : 'day'} · {c.durationDays}{' '}
                          {isBn ? 'দিন' : 'days'} · {bdt(c.totalBudgetBdt)} {isBn ? 'মোট' : 'total'} ·{' '}
                          {c.audienceLocation}
                        </p>
                      </div>
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${st.tone}`}>
                        {isBn ? st.bn : st.en}
                      </span>
                    </div>

                    {c.rejectionReason && (
                      <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
                        {c.rejectionReason}
                      </p>
                    )}
                    {c.operatorNote && !c.rejectionReason && (
                      <p className="mt-2 rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600">
                        {c.operatorNote}
                      </p>
                    )}

                    {/* Results render as a dash until actually reported — a 0
                        would read as "my ad reached nobody". */}
                    {(c.status === 'live' || c.status === 'completed' || c.status === 'paused') && (
                      <div className="mt-3 grid grid-cols-3 gap-2 rounded-lg bg-gray-50 px-3 py-2.5 text-center">
                        {[
                          { label: isBn ? 'পৌঁছেছে' : 'Reach', value: c.reportedReach },
                          { label: isBn ? 'ক্লিক' : 'Clicks', value: c.reportedClicks },
                          { label: isBn ? 'খরচ' : 'Spent', value: c.reportedSpendBdt },
                        ].map((m) => (
                          <div key={m.label}>
                            <p className="text-sm font-black text-gray-900">
                              {m.value == null ? '—' : m.value.toLocaleString('en-US')}
                            </p>
                            <p className="text-[10px] text-gray-500">{m.label}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </Card>

      <a
        href="https://adsmanager.facebook.com/adsmanager/manage/campaigns"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#7C3AED] hover:underline"
      >
        {isBn ? 'নিজে Meta Ads Manager-এ চালাতে চান?' : 'Prefer to run it yourself in Meta Ads Manager?'}
        <ArrowUpRight className="h-3.5 w-3.5" />
      </a>
    </div>
  )
}
