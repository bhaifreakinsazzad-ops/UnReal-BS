'use client'

import { ArrowUpRight, Bot, ExternalLink, MessageSquare, Mic, PenLine } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { useLocale } from '@/lib/i18n/context'

// This page used to render a fabricated operations dashboard: "1,248 calls
// handled +12%", "94% success rate", and a timestamped activity log claiming an
// agent had qualified a WhatsApp lead from a named company minutes earlier.
// None of it existed — the page made no network call at all, and the on/off
// toggles only set local React state, so "pausing" an agent did nothing while
// telling the user it had worked.
//
// What IS real is that AI agents are configured inside the connected GoHighLevel
// workspace. So this is now an honest guide plus working deep links into that
// workspace — no invented metrics, and no controls that pretend to act.

interface Props {
  locationId: string
}

interface AgentGuide {
  id: string
  icon: React.ReactNode
  titleEn: string
  titleBn: string
  descEn: string
  descBn: string
  capabilitiesEn: string[]
  capabilitiesBn: string[]
  ghlPath: string
  accent: string
}

const AGENTS: AgentGuide[] = [
  {
    id: 'voice',
    icon: <Mic className="h-5 w-5" />,
    titleEn: 'Voice AI',
    titleBn: 'ভয়েস AI',
    descEn: 'Answers your business phone when you cannot, and books callers in.',
    descBn: 'আপনি ধরতে না পারলে ব্যবসার ফোন ধরে এবং কলারের সময় ঠিক করে দেয়।',
    capabilitiesEn: ['Answers inbound calls', 'Books appointments', 'Passes details to your CRM'],
    capabilitiesBn: ['ইনবাউন্ড কল ধরে', 'অ্যাপয়েন্টমেন্ট বুক করে', 'তথ্য আপনার CRM-এ পাঠায়'],
    ghlPath: 'voice-ai',
    accent: 'bg-[#EDE9FE] text-[#6D28D9]',
  },
  {
    id: 'chat',
    icon: <MessageSquare className="h-5 w-5" />,
    titleEn: 'Conversation AI',
    titleBn: 'কনভারসেশন AI',
    descEn: 'Replies to WhatsApp and Messenger enquiries and qualifies leads.',
    descBn: 'WhatsApp ও Messenger-এর প্রশ্নের উত্তর দেয় এবং লিড যাচাই করে।',
    capabilitiesEn: ['Replies to messages', 'Qualifies enquiries', 'Hands over to you when needed'],
    capabilitiesBn: ['মেসেজের উত্তর দেয়', 'প্রশ্ন যাচাই করে', 'দরকার হলে আপনার কাছে দেয়'],
    ghlPath: 'conversation-ai',
    accent: 'bg-[#E8FFF4] text-[#059669]',
  },
  {
    id: 'content',
    icon: <PenLine className="h-5 w-5" />,
    titleEn: 'Content AI',
    titleBn: 'কন্টেন্ট AI',
    descEn: 'Drafts posts, emails and product descriptions for your business.',
    descBn: 'আপনার ব্যবসার জন্য পোস্ট, ইমেইল ও পণ্যের বর্ণনা লিখে দেয়।',
    capabilitiesEn: ['Writes social posts', 'Drafts customer emails', 'Writes product copy'],
    capabilitiesBn: ['সোশ্যাল পোস্ট লেখে', 'কাস্টমার ইমেইল লেখে', 'পণ্যের বর্ণনা লেখে'],
    ghlPath: 'content-ai',
    accent: 'bg-[#EAF2FF] text-[#2563EB]',
  },
]

export function AIAgentsShell({ locationId }: Props) {
  const locale = useLocale()
  const isBn = locale === 'bn'
  const base = `https://app.gohighlevel.com/location/${locationId}`

  return (
    <div className="mx-auto max-w-[1100px] space-y-5 p-4 md:p-6">
      <div className="rounded-2xl bg-[#07101F] p-5 text-white md:p-7">
        <Badge variant="accent" dot>{isBn ? 'AI এজেন্ট' : 'AI Agents'}</Badge>
        <h1 className="mt-4 text-2xl font-black md:text-4xl">{isBn ? 'AI এজেন্ট' : 'AI Agents'}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-white/65">
          {isBn
            ? 'AI এজেন্ট আপনার সংযুক্ত ওয়ার্কস্পেসে সেট আপ করতে হয়। নিচের লিংকগুলো সরাসরি সেখানে নিয়ে যাবে।'
            : 'AI agents are set up inside your connected workspace. The links below take you straight there.'}
        </p>
      </div>

      {/* Availability is genuinely plan-dependent and we do not verify the
          connected location's scopes here, so it is stated plainly rather than
          implied by a green checkmark — which is what the old page did. */}
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs leading-relaxed text-amber-800">
        {isBn
          ? 'কোন এজেন্ট আপনি ব্যবহার করতে পারবেন তা আপনার HighLevel প্ল্যান ও অনুমতির উপর নির্ভর করে। কোনো এজেন্ট চালু আছে কিনা তা এখান থেকে যাচাই করা হয় না — লিংকে গিয়ে দেখে নিন।'
          : 'Which agents you can use depends on your HighLevel plan and permissions. This page does not verify what is enabled on your account — open a link to check.'}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {AGENTS.map((a) => (
          <Card key={a.id} className="flex flex-col border-gray-200">
            <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${a.accent}`}>{a.icon}</div>
            <p className="mt-3 text-sm font-bold text-gray-900">{isBn ? a.titleBn : a.titleEn}</p>
            <p className="mt-1 text-xs leading-relaxed text-gray-500">{isBn ? a.descBn : a.descEn}</p>

            <ul className="mt-3 space-y-1.5">
              {(isBn ? a.capabilitiesBn : a.capabilitiesEn).map((c) => (
                <li key={c} className="flex items-start gap-2 text-[11px] text-gray-600">
                  <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-gray-300" />
                  <span>{c}</span>
                </li>
              ))}
            </ul>

            <a
              href={`${base}/${a.ghlPath}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-[#7C3AED] hover:underline"
            >
              {isBn ? 'সেট আপ করুন' : 'Set this up'}
              <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
          </Card>
        ))}
      </div>

      <Card padding="none" className="overflow-hidden border-gray-200">
        <CardHeader className="border-b border-gray-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-[#7C3AED]" />
            <CardTitle>{isBn ? 'ওয়ার্কস্পেসে খুলুন' : 'Open in your workspace'}</CardTitle>
          </div>
        </CardHeader>
        <div className="divide-y divide-gray-50">
          {[
            { path: 'ai-tools', en: 'All AI tools', bn: 'সব AI টুল' },
            { path: 'knowledge-base', en: 'Knowledge base — teach it about your business', bn: 'নলেজ বেস — আপনার ব্যবসা সম্পর্কে শেখান' },
            { path: 'agent-templates', en: 'Agent templates', bn: 'এজেন্ট টেমপ্লেট' },
            { path: 'agent-logs', en: 'Agent activity logs', bn: 'এজেন্টের কার্যক্রমের রেকর্ড' },
          ].map((l) => (
            <a
              key={l.path}
              href={`${base}/${l.path}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-5 py-3.5 transition hover:bg-gray-50"
            >
              <ExternalLink className="h-4 w-4 flex-shrink-0 text-gray-400" />
              <span className="flex-1 text-sm text-gray-800">{isBn ? l.bn : l.en}</span>
              <ArrowUpRight className="h-4 w-4 text-gray-300" />
            </a>
          ))}
        </div>
      </Card>
    </div>
  )
}
