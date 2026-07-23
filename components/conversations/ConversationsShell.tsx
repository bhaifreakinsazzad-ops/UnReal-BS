'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, Plus, Phone, StickyNote, Tag, Send, Paperclip, Smile, ArrowLeft, MessageSquare } from 'lucide-react'
import { Avatar } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { useLocale } from '@/lib/i18n/context'
import type { GHLConversation, GHLMessage } from '@/lib/ghl/conversations'

const channelMap: Record<string, string> = {
  TYPE_SMS: 'SMS',
  TYPE_EMAIL: 'Email',
  TYPE_WHATSAPP: 'WhatsApp',
  TYPE_FB: 'Facebook',
  TYPE_INSTAGRAM: 'Instagram',
  TYPE_PHONE: 'Phone',
  TYPE_GMB: 'Google',
  TYPE_WEBCHAT: 'Webchat',
}

function channelInfo(type: string) {
  return channelMap[type] || type.replace('TYPE_', '')
}

function formatConvTime(ts: number, locale: 'bn' | 'en') {
  const d = new Date(ts)
  const now = Date.now()
  const diff = now - ts
  if (diff < 60000) return locale === 'bn' ? 'এখনই' : 'now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`
  return d.toLocaleDateString(locale === 'bn' ? 'bn-BD' : 'en-US', { day: '2-digit', month: '2-digit' })
}

const channels = [
  { value: 'all', labelEn: 'All', labelBn: 'সব' },
  { value: 'TYPE_SMS', labelEn: 'SMS', labelBn: 'SMS' },
  { value: 'TYPE_WHATSAPP', labelEn: 'WhatsApp', labelBn: 'WhatsApp' },
  { value: 'TYPE_FB', labelEn: 'Facebook', labelBn: 'Facebook' },
  { value: 'TYPE_EMAIL', labelEn: 'Email', labelBn: 'ইমেইল' },
  { value: 'TYPE_INSTAGRAM', labelEn: 'Instagram', labelBn: 'Instagram' },
]

interface Props {
  conversations: GHLConversation[]
  total: number
  locationId: string
}

export function ConversationsShell({ conversations, total, locationId }: Props) {
  const locale = useLocale()
  const isBn = locale === 'bn'
  const [convList, setConvList] = useState<GHLConversation[]>(conversations)
  const [activeConv, setActiveConv] = useState<GHLConversation | null>(conversations[0] ?? null)
  const [activeChannel, setActiveChannel] = useState('all')
  const [search, setSearch] = useState('')
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState<GHLMessage[]>([])
  const [loadingMessages, setLoadingMessages] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const poll = () => {
      fetch(`/api/ghl/conversations/search?locationId=${locationId}&limit=50`, {
        headers: { 'x-location-id': locationId },
      })
        .then(r => r.json())
        .then(data => { if (data.conversations) setConvList(data.conversations) })
        .catch(() => {})
    }
    const interval = setInterval(poll, 30000)
    return () => clearInterval(interval)
  }, [locationId])

  const filtered = convList.filter(c => {
    const matchChannel = activeChannel === 'all' || c.type === activeChannel
    const matchSearch = !search ||
      c.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      c.lastMessageBody?.toLowerCase().includes(search.toLowerCase())
    return matchChannel && matchSearch
  })

  useEffect(() => {
    if (!activeConv) return
    // Reset the visible thread immediately so switching conversations never shows stale messages.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoadingMessages(true)
    setMessages([])
    fetch(`/api/ghl/conversations/${activeConv.id}/messages?limit=20`, {
      headers: { 'x-location-id': locationId }
    })
      .then(r => r.json())
      .then(data => {
        if (data.messages) setMessages(data.messages.reverse())
      })
      .catch(() => {})
      .finally(() => setLoadingMessages(false))
  }, [activeConv, locationId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend() {
    if (!message.trim() || !activeConv) return
    const body = message
    setMessage('')
    try {
      await fetch(`/api/ghl/conversations/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-location-id': locationId },
        body: JSON.stringify({ conversationId: activeConv.id, body, type: activeConv.type }),
      })
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        conversationId: activeConv.id,
        body,
        direction: 'outbound',
        dateAdded: new Date().toISOString(),
        type: activeConv.type,
        status: 'sent',
      }])
    } catch {}
  }

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden">
      <div className={cn('flex flex-col border-r border-gray-200 bg-white flex-shrink-0 w-full md:w-80 lg:w-96', activeConv && 'hidden md:flex')}>
        <div className="p-4 border-b border-gray-100 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">{isBn ? 'কনভার্সেশন' : 'Conversations'}</h2>
              <p className="text-xs text-gray-400">{isBn ? `মোট ${total}টি` : `${total} total threads`}</p>
            </div>
            <button className="w-8 h-8 rounded-lg bg-[#7C3AED] text-white flex items-center justify-center hover:bg-[#6D28D9] transition-colors" aria-label="New conversation">
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={isBn ? 'কনভার্সেশন খুঁজুন...' : 'Search conversations...'}
              className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED]"
            />
          </div>
        </div>

        <div className="px-3 pt-2 pb-1 overflow-x-auto flex-shrink-0">
          <div className="flex gap-1 min-w-max">
            {channels.map(ch => (
              <button
                key={ch.value}
                onClick={() => setActiveChannel(ch.value)}
                className={cn('px-3 py-1.5 text-xs font-medium rounded-full transition-colors whitespace-nowrap', activeChannel === ch.value ? 'bg-[#7C3AED] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')}
              >
                {isBn ? ch.labelBn : ch.labelEn}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
          {filtered.length === 0 && (
            <p className="text-center text-sm text-gray-400 py-10">{isBn ? 'কোনো কনভার্সেশন নেই' : 'No conversations found'}</p>
          )}
          {filtered.map(conv => (
            <button
              key={conv.id}
              onClick={() => setActiveConv(conv)}
              className={cn('w-full flex items-start gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors text-left', activeConv?.id === conv.id && 'bg-[#EDE9FE]/50')}
            >
              <Avatar name={conv.fullName || conv.contactName} size="md" online={conv.unreadCount > 0} className="flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-sm font-semibold text-gray-900 truncate">{conv.fullName || conv.contactName || conv.email}</span>
                  <span className="text-[11px] text-gray-400 flex-shrink-0 ml-2">{formatConvTime(conv.lastMessageDate, locale)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-500 truncate flex items-center gap-1">
                    <span className="font-semibold">{channelInfo(conv.type)}</span>
                    {conv.lastMessageBody?.replace(/\[https?:\/\/[^\]]+\]/g, '').slice(0, 60) || '-'}
                  </p>
                  {conv.unreadCount > 0 && (
                    <span className="ml-2 min-w-5 h-5 px-1 rounded-full bg-[#7C3AED] text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">{conv.unreadCount}</span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className={cn('flex-1 flex flex-col bg-[#F9FAFB] min-w-0', !activeConv && 'hidden md:flex')}>
        {activeConv ? (
          <>
            <div className="flex items-center gap-3 px-4 py-3.5 bg-white border-b border-gray-200 flex-shrink-0">
              <button className="md:hidden p-1.5 rounded-lg text-gray-500 hover:bg-gray-100" onClick={() => setActiveConv(null)} aria-label="Back to conversations">
                <ArrowLeft className="w-4 h-4" />
              </button>
              <Avatar name={activeConv.fullName || activeConv.contactName} size="md" online />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{activeConv.fullName || activeConv.contactName || activeConv.email}</p>
                <p className="text-xs text-gray-400 flex items-center gap-1">
                  {channelInfo(activeConv.type)}
                  {activeConv.email && ` · ${activeConv.email}`}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors" aria-label="Call"><Phone className="w-4 h-4" /></button>
                <button className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors" aria-label="Add note"><StickyNote className="w-4 h-4" /></button>
                <button className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors" aria-label="Add tag"><Tag className="w-4 h-4" /></button>
                <a href={`https://app.gohighlevel.com/location/${locationId}/conversations/${activeConv.id}`} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors text-xs font-medium hidden sm:flex items-center">GHL →</a>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {loadingMessages && <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-[#7C3AED] border-t-transparent rounded-full animate-spin" /></div>}
              {!loadingMessages && messages.length === 0 && <div className="text-center py-8 text-gray-400 text-sm">{isBn ? 'কোনো বার্তা নেই' : 'No messages yet'}</div>}
              {messages.map(msg => (
                <div key={msg.id} className={cn('flex', msg.direction === 'outbound' ? 'justify-end' : 'justify-start')}>
                  {msg.direction === 'inbound' && <Avatar name={activeConv.fullName || activeConv.contactName} size="sm" className="mr-2 mt-1 flex-shrink-0" />}
                  <div className={cn('max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed', msg.direction === 'outbound' ? 'bg-[#7C3AED] text-white rounded-tr-sm' : 'bg-white text-gray-800 rounded-tl-sm border border-gray-100 shadow-sm')}>
                    {msg.body}
                    <p className={cn('text-[10px] mt-1.5 text-right', msg.direction === 'outbound' ? 'text-purple-200' : 'text-gray-400')}>
                      {new Date(msg.dateAdded).toLocaleTimeString(isBn ? 'bn-BD' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div className="px-4 py-3 bg-white border-t border-gray-200 flex-shrink-0">
              <div className="flex items-end gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                  placeholder={isBn ? 'মেসেজ লিখুন...' : 'Type a message...'}
                  rows={1}
                  className="flex-1 bg-transparent text-sm text-gray-800 placeholder:text-gray-400 resize-none focus:outline-none min-h-[36px] max-h-28 py-1.5"
                />
                <div className="flex items-center gap-1 flex-shrink-0 pb-0.5">
                  <button className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors" aria-label="Attach file"><Paperclip className="w-4 h-4" /></button>
                  <button className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors" aria-label="Emoji"><Smile className="w-4 h-4" /></button>
                  <button onClick={handleSend} disabled={!message.trim()} className="w-9 h-9 rounded-xl bg-[#7C3AED] text-white flex items-center justify-center hover:bg-[#6D28D9] disabled:opacity-40 transition-colors" aria-label="Send message">
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-[#EDE9FE] flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-8 h-8 text-[#7C3AED]" />
              </div>
              <p className="text-gray-500 text-sm">{isBn ? 'একটি কনভার্সেশন বেছে নিন' : 'Select a conversation'}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
