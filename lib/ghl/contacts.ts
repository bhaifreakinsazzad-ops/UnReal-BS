import 'server-only'
import { ghlFetch } from './client'

export interface GHLContact {
  id: string
  locationId: string
  contactName: string
  firstName: string
  lastName: string
  companyName: string | null
  email: string
  phone: string
  dnd: boolean
  type: string
  source: string
  tags: string[]
  country: string
  dateAdded: string
  dateUpdated: string
  assignedTo: string | null
  city: string | null
  state: string | null
  profilePhoto: string | null
}

export interface ContactsMeta {
  total: number
  nextPageUrl: string | null
  startAfterId: string | null
  startAfter: number | null
  currentPage: number
  nextPage: number | null
  prevPage: number | null
}

export interface ContactsResponse {
  contacts: GHLContact[]
  meta: ContactsMeta
}

export async function getContacts(locationId: string, limit = 20, startAfterId?: string, startAfter?: number) {
  let path = `/contacts/?locationId=${locationId}&limit=${limit}`
  if (startAfterId && startAfter) {
    path += `&startAfterId=${startAfterId}&startAfter=${startAfter}`
  }
  return ghlFetch<ContactsResponse>(path, { locationId })
}

export async function getContact(contactId: string, locationId: string) {
  return ghlFetch<{ contact: GHLContact }>(`/contacts/${contactId}`, { locationId })
}

export async function createContact(locationId: string, data: {
  firstName?: string
  lastName?: string
  companyName?: string
  email?: string
  phone?: string
  tags?: string[]
  source?: string
}) {
  return ghlFetch<{ contact: GHLContact }>('/contacts/', {
    method: 'POST',
    locationId,
    body: { ...data, locationId },
  })
}

export async function upsertContact(locationId: string, data: {
  firstName?: string
  lastName?: string
  companyName?: string
  email?: string
  phone?: string
  source?: string
}) {
  return ghlFetch<{ contact: GHLContact }>('/contacts/upsert', {
    method: 'POST',
    locationId,
    version: 'v3',
    body: { ...data, locationId },
  })
}

export async function updateContact(contactId: string, locationId: string, data: Partial<GHLContact>) {
  return ghlFetch<{ contact: GHLContact }>(`/contacts/${contactId}`, {
    method: 'PUT',
    locationId,
    body: data,
  })
}

export async function deleteContact(contactId: string, locationId: string) {
  return ghlFetch(`/contacts/${contactId}`, { method: 'DELETE', locationId })
}

export async function addContactTags(contactId: string, locationId: string, tags: string[]) {
  return ghlFetch<{ contact: GHLContact }>(`/contacts/${contactId}/tags`, {
    method: 'POST',
    locationId,
    body: { tags },
  })
}
