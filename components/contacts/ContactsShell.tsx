'use client'

import { useState, useCallback } from 'react'
import { Search, Plus, Filter, Phone, Mail, X, MoreHorizontal } from 'lucide-react'
import { Avatar } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { formatRelativeTime } from '@/lib/utils'
import type { GHLContact } from '@/lib/ghl/contacts'
import { ContactCreateModal } from './ContactCreateModal'

const stageColors: Record<string, string> = {
  lead:     'bg-blue-100 text-blue-700',
  customer: 'bg-green-100 text-green-700',
  prospect: 'bg-yellow-100 text-yellow-700',
}

const typeLabel: Record<string, string> = {
  lead:     'লিড',
  customer: 'কাস্টমার',
  prospect: 'প্রসপেক্ট',
}

interface Props {
  contacts: GHLContact[]
  total: number
  locationId: string
}

export function ContactsShell({ contacts: initialContacts, total: initialTotal, locationId }: Props) {
  const [contactList, setContactList] = useState<GHLContact[]>(initialContacts)
  const [total, setTotal] = useState(initialTotal)
  const [selected, setSelected] = useState<string[]>([])
  const [activeContact, setActiveContact] = useState<GHLContact | null>(null)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)

  const handleCreated = useCallback(() => {
    setShowModal(false)
    // Re-fetch contacts to show the new one
    fetch(`/api/ghl/contacts?locationId=${locationId}&limit=100`, {
      headers: { 'x-location-id': locationId },
    })
      .then(r => r.json())
      .then(data => {
        if (data.contacts) {
          setContactList(data.contacts)
          setTotal(data.meta?.total ?? data.contacts.length)
        }
      })
      .catch(() => {})
  }, [locationId])


  const filtered = contactList.filter(c => {
    const q = search.toLowerCase()
    return (
      c.contactName?.toLowerCase().includes(q) ||
      c.phone?.includes(q) ||
      c.email?.toLowerCase().includes(q)
    )
  })

  function toggleSelect(id: string) {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  function displayName(c: GHLContact) {
    return c.contactName || `${c.firstName} ${c.lastName}`.trim() || c.email || c.phone
  }

  return (
    <>
      {showModal && (
        <ContactCreateModal
          locationId={locationId}
          onCreated={handleCreated}
          onClose={() => setShowModal(false)}
        />
      )}
    <div className="flex h-full overflow-hidden">
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 md:px-6 border-b border-gray-200 bg-white space-y-3 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-gray-900">কন্টাক্টস</h1>
              <p className="text-xs text-gray-400">মোট {total} কন্টাক্ট</p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-[#7C3AED] text-white text-sm font-medium rounded-lg hover:bg-[#6D28D9] transition-colors">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">নতুন কন্টাক্ট</span>
            </button>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="নাম, ফোন বা ইমেইল খুঁজুন..."
                className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED]"
              />
            </div>
            <button className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 text-gray-600 text-sm rounded-lg hover:bg-gray-50 transition-colors">
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline">ফিল্টার</span>
            </button>
          </div>
          {selected.length > 0 && (
            <div className="flex items-center gap-2 py-2 px-3 bg-[#EDE9FE] rounded-lg">
              <span className="text-sm font-medium text-[#7C3AED]">{selected.length}টি বাছাই</span>
              <div className="flex-1 flex gap-2">
                <button className="text-xs px-2 py-1 bg-[#7C3AED] text-white rounded-md">ট্যাগ লাগান</button>
                <button className="text-xs px-2 py-1 bg-white text-red-600 border border-red-200 rounded-md">মুছুন</button>
              </div>
              <button onClick={() => setSelected([])}><X className="w-4 h-4 text-gray-500" /></button>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <Search className="w-12 h-12 mb-3 text-gray-200" />
              <p className="font-medium">কোনো কন্টাক্ট পাওয়া যায়নি</p>
              <p className="text-sm">অনুসন্ধান পরিবর্তন করে চেষ্টা করুন</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="w-10 px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      onChange={e => setSelected(e.target.checked ? filtered.map(c => c.id) : [])}
                      checked={selected.length === filtered.length && filtered.length > 0}
                      className="rounded border-gray-300"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">নাম</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">ফোন</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">ট্যাগ</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">টাইপ</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">যোগ হয়েছে</th>
                  <th className="w-10 px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 bg-white">
                {filtered.map(contact => (
                  <tr
                    key={contact.id}
                    onClick={() => setActiveContact(contact)}
                    className={cn(
                      'hover:bg-gray-50/80 transition-colors cursor-pointer',
                      selected.includes(contact.id) && 'bg-[#EDE9FE]/30'
                    )}
                  >
                    <td className="px-4 py-3" onClick={e => { e.stopPropagation(); toggleSelect(contact.id) }}>
                      <input
                        type="checkbox"
                        checked={selected.includes(contact.id)}
                        onChange={() => toggleSelect(contact.id)}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={displayName(contact)} size="sm" />
                        <div>
                          <p className="font-medium text-gray-900 leading-tight">{displayName(contact)}</p>
                          {contact.source && (
                            <p className="text-[11px] text-gray-400 truncate max-w-[140px]">{contact.source}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 hidden md:table-cell font-mono text-xs">{contact.phone}</td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <div className="flex gap-1 flex-wrap">
                        {contact.tags?.slice(0, 3).map(tag => (
                          <span key={tag} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">{tag}</span>
                        ))}
                        {(contact.tags?.length || 0) > 3 && (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full">+{contact.tags.length - 3}</span>
                        )}
                        {(!contact.tags || contact.tags.length === 0) && (
                          <span className="text-gray-300 text-xs">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        'px-2 py-1 text-xs font-medium rounded-full',
                        stageColors[contact.type] || 'bg-gray-100 text-gray-600'
                      )}>
                        {typeLabel[contact.type] || contact.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs hidden md:table-cell">
                      {formatRelativeTime(new Date(contact.dateAdded))}
                    </td>
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Side Panel */}
      {activeContact && (
        <div className="w-72 lg:w-80 border-l border-gray-200 bg-white flex-shrink-0 flex flex-col overflow-y-auto">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">বিস্তারিত</h3>
            <button onClick={() => setActiveContact(null)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="p-4 space-y-4">
            <div className="text-center">
              <Avatar name={displayName(activeContact)} size="xl" className="mx-auto mb-3" />
              <h4 className="font-bold text-gray-900 leading-tight">{displayName(activeContact)}</h4>
              <span className={cn(
                'inline-block mt-1.5 px-2 py-0.5 text-xs font-medium rounded-full',
                stageColors[activeContact.type] || 'bg-gray-100 text-gray-600'
              )}>
                {typeLabel[activeContact.type] || activeContact.type}
              </span>
            </div>

            <div className="space-y-2">
              {activeContact.phone && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="text-sm text-gray-700 font-mono">{activeContact.phone}</span>
                </div>
              )}
              {activeContact.email && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="text-sm text-gray-700 truncate">{activeContact.email}</span>
                </div>
              )}
            </div>

            {activeContact.source && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">সোর্স</p>
                <p className="text-sm text-gray-600">{activeContact.source}</p>
              </div>
            )}

            {activeContact.tags && activeContact.tags.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">ট্যাগ</p>
                <div className="flex flex-wrap gap-1.5">
                  {activeContact.tags.map(tag => (
                    <span key={tag} className="px-2.5 py-1 bg-[#EDE9FE] text-[#7C3AED] text-xs font-medium rounded-full">{tag}</span>
                  ))}
                </div>
              </div>
            )}

            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">যোগ হয়েছে</p>
              <p className="text-sm text-gray-600">{formatRelativeTime(new Date(activeContact.dateAdded))}</p>
            </div>

            <div className="space-y-2">
              <button className="w-full py-2.5 bg-[#7C3AED] text-white text-sm font-medium rounded-lg hover:bg-[#6D28D9] transition-colors">
                মেসেজ পাঠান
              </button>
              <a
                href={`https://app.gohighlevel.com/location/${locationId}/contacts/detail/${activeContact.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full py-2.5 bg-gray-100 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors text-center"
              >
                GHL-এ দেখুন ↗
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  )
}
