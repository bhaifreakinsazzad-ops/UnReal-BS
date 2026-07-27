import { getContacts, type GHLContact } from '@/lib/ghl/contacts'
import { ContactsShell } from '@/components/contacts/ContactsShell'
import { getTenantLocationId } from '@/lib/tenant'
import { WorkspaceNotConnected } from '@/components/shared/WorkspaceNotConnected'

export const dynamic = 'force-dynamic'

export default async function ContactsPage() {
  const locationId = await getTenantLocationId()
  if (!locationId) return <WorkspaceNotConnected feature="Customers" />

  let contacts: GHLContact[] = []
  let total = 0

  try {
    const res = await getContacts(locationId, 50)
    contacts = res.contacts
    total = res.meta.total
  } catch {
    // Falls back to empty state — component handles gracefully
  }

  return <ContactsShell contacts={contacts} total={total} locationId={locationId} />
}
