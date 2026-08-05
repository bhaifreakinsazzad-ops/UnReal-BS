import 'server-only'
import { serverFlags } from '@/lib/env'
import { isAdminEmail } from '@/lib/security/admin'
import { auth } from '@/auth'

function canaryEmails(): Set<string> {
  return new Set((process.env.COMMERCE_CANARY_EMAILS ?? '').split(',').map((email) => email.trim().toLowerCase()).filter(Boolean))
}

export function commerceEnabledFor(email?: string | null): boolean {
  if (!serverFlags.commerceEnabled()) return false
  if (!email) return false
  return isAdminEmail(email) || canaryEmails().has(email.trim().toLowerCase())
}

export function publicStoreEnabled(): boolean {
  return serverFlags.commerceEnabled() && serverFlags.storePublicEnabled()
}

export function marketplaceSellersEnabled(): boolean {
  return serverFlags.marketplaceSellersEnabled()
}

export async function storefrontEnabledForRequest(): Promise<boolean> {
  if (publicStoreEnabled()) return true
  const session = await auth()
  return commerceEnabledFor(session?.user?.email)
}
