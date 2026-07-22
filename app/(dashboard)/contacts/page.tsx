import { getContacts, type GHLContact } from '@/lib/ghl/contacts'
import { ContactsShell } from '@/components/contacts/ContactsShell'

const LOCATION_ID = process.env.GHL_LOCATION_ID!

export default async function ContactsPage() {
  let contacts: GHLContact[] = []
  let total = 0

  try {
    const res = await getContacts(LOCATION_ID, 50)
    contacts = res.contacts
    total = res.meta.total
  } catch {
    // Falls back to empty state — component handles gracefully
  }

  return <ContactsShell contacts={contacts} total={total} locationId={LOCATION_ID} />
}
