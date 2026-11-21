import 'server-only'
import { auth } from '@/auth'
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/client'

// ─────────────────────────────────────────────────────────────────────────────
// Tenant resolution.
//
// Every GHL-backed screen used to read `process.env.GHL_LOCATION_ID` directly,
// which meant every signed-in account rendered data from ONE shared GHL
// sub-account. That is fine while the product has a single operator; it is a
// cross-tenant data leak the moment a second person can sign up.
//
// The rule enforced here:
//
//   • The operator (ADMIN_EMAIL) works in the workspace configured by
//     GHL_LOCATION_ID — that is their own account.
//   • Every other user gets ONLY the location recorded on their own
//     unreal_bs_users row.
//   • A user with no location assigned gets `null`. They never silently
//     inherit the environment default. Callers must render a
//     "workspace not connected yet" state instead of somebody else's CRM.
//
// Money features (wallet, virtual cards, AI billing) do not go
// through here — they are already scoped by user_id in their own tables and
// are safe for public signup today.
// ─────────────────────────────────────────────────────────────────────────────

export interface Tenant {
  email: string
  /** unreal_bs_users.id — null for the env-configured admin with no DB row. */
  userId: string | null
  /** The GHL sub-account this user may read/write. Null = not provisioned. */
  ghlLocationId: string | null
  isAdmin: boolean
}

export async function getTenant(): Promise<Tenant | null> {
  const session = await auth()
  const email = session?.user?.email
  if (!email) return null

  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase()
  const normalisedEmail = email.trim().toLowerCase()
  const isAdmin = Boolean(adminEmail && normalisedEmail === adminEmail)

  if (!isSupabaseConfigured()) {
    // No database: only the env-configured operator can exist, so it is safe
    // to hand them the env location. Nobody else can sign in in this state.
    return {
      email,
      userId: null,
      ghlLocationId: isAdmin ? process.env.GHL_LOCATION_ID ?? null : null,
      isAdmin,
    }
  }

  try {
    const supabase = getSupabaseAdmin()
    const { data } = await supabase
      .from('unreal_bs_users')
      .select('id, ghl_location_id')
      .eq('email', normalisedEmail)
      .maybeSingle()

    return {
      email,
      userId: data?.id ?? null,
      // Admin falls back to the env location (their own workspace). A real
      // user gets strictly what is on their row — never the env default.
      ghlLocationId: data?.ghl_location_id ?? (isAdmin ? process.env.GHL_LOCATION_ID ?? null : null),
      isAdmin,
    }
  } catch {
    return {
      email,
      userId: null,
      ghlLocationId: isAdmin ? process.env.GHL_LOCATION_ID ?? null : null,
      isAdmin,
    }
  }
}

/**
 * Convenience for GHL-backed pages: returns the caller's location id, or null
 * when they have no workspace provisioned yet. Callers MUST handle null by
 * rendering an honest not-connected state — never by substituting a default.
 */
export async function getTenantLocationId(): Promise<string | null> {
  const tenant = await getTenant()
  return tenant?.ghlLocationId ?? null
}
