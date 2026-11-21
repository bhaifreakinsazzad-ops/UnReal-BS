import 'server-only'
import { getSupabaseAdmin } from '@/lib/supabase/client'
import { logError } from '@/lib/log-error'
import { addContactTags, upsertContact } from '@/lib/ghl/contacts'

// ─────────────────────────────────────────────────────────────────────────────
// What GoHighLevel actually does for a sale.
//
// GHL's public API cannot create a course — its Memberships API is a single
// bulk-import endpoint with no CRUD, so a course built through it could never
// be edited or deleted by us afterwards. The course engine is therefore ours.
//
// What GHL's API does do well is contacts, and that is the part a seller
// genuinely wants: every buyer lands in their own sub-account as a contact,
// tagged with the product they bought, so whatever follow-up workflow they
// have already built fires by itself — welcome message, drip, upsell.
//
// THIS MUST NEVER FAIL A SALE. The money has already moved by the time this
// runs. A GHL outage, a missing location, a revoked token: all of it results
// in a logged error and a null ghl_contact_id, never a failed order. The admin
// order row shows the unsynced state so it can be retried.
// ─────────────────────────────────────────────────────────────────────────────

/** The seller's OWN sub-account. Deliberately not getTenantLocationId(), which
 *  reads the current session — this runs when an ADMIN confirms a payment, so
 *  the session belongs to the operator, not to the seller being credited. */
async function locationIdForSeller(sellerId: string): Promise<string | null> {
  try {
    const supabase = getSupabaseAdmin()
    const { data } = await supabase
      .from('unreal_bs_users')
      .select('ghl_location_id')
      .eq('id', sellerId)
      .maybeSingle()
    return data?.ghl_location_id ?? null
  } catch {
    return null
  }
}

function splitName(full: string): { firstName: string; lastName: string } {
  const parts = full.trim().split(/\s+/)
  if (parts.length === 1) return { firstName: parts[0], lastName: '' }
  return { firstName: parts.slice(0, -1).join(' '), lastName: parts[parts.length - 1] }
}

/** Records a paid order's buyer as a tagged contact in the seller's GHL
 *  sub-account. Resolves quietly whether or not it worked. */
export async function syncOrderToGhl(orderId: string): Promise<void> {
  try {
    const supabase = getSupabaseAdmin()

    const { data: order } = await supabase
      .from('unreal_bs_orders')
      .select('id, seller_id, product_title, product_kind, buyer_name, buyer_phone, buyer_email, price_bdt, status, ghl_contact_id')
      .eq('id', orderId)
      .maybeSingle()

    if (!order) return
    // Only paid orders become contacts. An abandoned checkout is not a lead
    // the seller asked for, and importing one would make their contact list
    // untrustworthy.
    if (order.status !== 'paid') return
    if (order.ghl_contact_id) return

    const locationId = await locationIdForSeller(order.seller_id)
    if (!locationId) {
      // Not an error: plenty of sellers will never connect a GHL workspace,
      // and selling has never required one.
      return
    }

    if (!process.env.GHL_PRIVATE_TOKEN) return

    const { firstName, lastName } = splitName(order.buyer_name)

    const upserted = await upsertContact(locationId, {
      firstName,
      lastName,
      phone: order.buyer_phone,
      email: order.buyer_email ?? undefined,
      source: 'UnReal Systems digital product',
    })

    const contactId = upserted?.contact?.id
    if (!contactId) return

    // Additive tags only — never a replace, which would wipe tags the seller's
    // own automations depend on.
    const slugTag = order.product_title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40)

    await addContactTags(contactId, locationId, [
      'unrealbs-buyer',
      `kind-${order.product_kind}`,
      slugTag ? `bought-${slugTag}` : 'bought-digital-product',
    ])

    await supabase
      .from('unreal_bs_orders')
      .update({ ghl_contact_id: contactId, ghl_synced_at: new Date().toISOString() })
      .eq('id', orderId)
  } catch (err) {
    await logError('order-ghl-sync', err, { orderId })
  }
}
