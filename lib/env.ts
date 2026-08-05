import 'server-only'
import { z } from 'zod'

const optionalText = z.string().trim().min(1).optional()
const optionalUrl = z.string().trim().url().optional()
const optionalFlag = z.enum(['true', 'false']).optional()

const serverEnvironmentSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).optional(),
  NEXT_PUBLIC_APP_URL: optionalUrl,
  AUTH_SECRET: optionalText,
  NEXTAUTH_SECRET: optionalText,
  ADMIN_EMAIL: z.string().trim().email().optional(),
  ADMIN_PASSWORD: optionalText,
  SUPABASE_URL: optionalUrl,
  SUPABASE_SERVICE_ROLE_KEY: optionalText,
  GHL_PRIVATE_TOKEN: optionalText,
  GHL_LOCATION_ID: optionalText,
  PLATFORM_BKASH_NUMBER: optionalText,
  PLATFORM_NAGAD_NUMBER: optionalText,
  PLATFORM_ROCKET_NUMBER: optionalText,
  NEXT_PUBLIC_META_PIXEL_ID: optionalText,
  META_DATASET_ID: optionalText,
  META_CAPI_ACCESS_TOKEN: optionalText,
  META_TEST_EVENT_CODE: optionalText,
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: optionalText,
  TURNSTILE_SECRET_KEY: optionalText,
  NEXT_PUBLIC_CONSENT_VERSION: optionalText,
  COMMERCE_ENABLED: optionalFlag,
  STORE_PUBLIC_ENABLED: optionalFlag,
  MARKETPLACE_SELLERS_ENABLED: optionalFlag,
  TURNSTILE_ENABLED: optionalFlag,
  CSP_ENFORCE: optionalFlag,
}).passthrough()

export type ServerEnvironment = z.infer<typeof serverEnvironmentSchema>
export type EnvironmentIssueCode =
  | 'invalid_value'
  | 'missing_auth'
  | 'missing_admin'
  | 'missing_supabase'
  | 'missing_ghl'
  | 'missing_payment_destination'
  | 'store_requires_commerce'
  | 'marketplace_requires_commerce'
  | 'turnstile_incomplete'
  | 'meta_incomplete'

function enabled(name: keyof ServerEnvironment): boolean {
  return process.env[name] === 'true'
}

function present(name: keyof ServerEnvironment): boolean {
  return Boolean(process.env[name]?.trim())
}

export const serverFlags = {
  commerceEnabled: () => enabled('COMMERCE_ENABLED'),
  storePublicEnabled: () => enabled('STORE_PUBLIC_ENABLED'),
  marketplaceSellersEnabled: () => enabled('COMMERCE_ENABLED') && enabled('MARKETPLACE_SELLERS_ENABLED'),
  turnstileEnabled: () => enabled('TURNSTILE_ENABLED'),
  cspEnforced: () => enabled('CSP_ENFORCE'),
}

export function validateServerEnvironment(): { valid: boolean; issueCodes: EnvironmentIssueCode[] } {
  const issueCodes = new Set<EnvironmentIssueCode>()
  if (!serverEnvironmentSchema.safeParse(process.env).success) issueCodes.add('invalid_value')

  if (!present('AUTH_SECRET') && !present('NEXTAUTH_SECRET')) issueCodes.add('missing_auth')
  if (!present('ADMIN_EMAIL') || !present('ADMIN_PASSWORD')) issueCodes.add('missing_admin')
  if (!present('SUPABASE_URL') || !present('SUPABASE_SERVICE_ROLE_KEY')) issueCodes.add('missing_supabase')
  if (!present('GHL_PRIVATE_TOKEN') || !present('GHL_LOCATION_ID')) issueCodes.add('missing_ghl')

  const hasPayment = present('PLATFORM_BKASH_NUMBER') || present('PLATFORM_NAGAD_NUMBER') || present('PLATFORM_ROCKET_NUMBER')
  if (serverFlags.commerceEnabled() && !hasPayment) issueCodes.add('missing_payment_destination')
  if (serverFlags.storePublicEnabled() && !serverFlags.commerceEnabled()) issueCodes.add('store_requires_commerce')
  if (enabled('MARKETPLACE_SELLERS_ENABLED') && !serverFlags.commerceEnabled()) issueCodes.add('marketplace_requires_commerce')
  if (serverFlags.turnstileEnabled() && (!present('NEXT_PUBLIC_TURNSTILE_SITE_KEY') || !present('TURNSTILE_SECRET_KEY'))) {
    issueCodes.add('turnstile_incomplete')
  }
  // Browser Pixel is a valid consent-gated baseline. CAPI is an optional
  // server-side enhancement, but it can never be configured without a Pixel
  // ID because Meta needs that ID as the event destination.
  if (present('META_CAPI_ACCESS_TOKEN') && !present('NEXT_PUBLIC_META_PIXEL_ID')) issueCodes.add('meta_incomplete')

  return { valid: issueCodes.size === 0, issueCodes: [...issueCodes] }
}

export function environmentReadiness() {
  const core = {
    auth: present('AUTH_SECRET') || present('NEXTAUTH_SECRET'),
    admin: present('ADMIN_EMAIL') && present('ADMIN_PASSWORD'),
    supabase: present('SUPABASE_URL') && present('SUPABASE_SERVICE_ROLE_KEY'),
    ghl: present('GHL_PRIVATE_TOKEN') && present('GHL_LOCATION_ID'),
  }
  const payment = {
    configured: present('PLATFORM_BKASH_NUMBER') || present('PLATFORM_NAGAD_NUMBER') || present('PLATFORM_ROCKET_NUMBER'),
  }
  const meta = {
    pixel: present('NEXT_PUBLIC_META_PIXEL_ID'),
    dataset: present('META_DATASET_ID') || present('NEXT_PUBLIC_META_PIXEL_ID'),
    capi: present('META_CAPI_ACCESS_TOKEN') && (present('META_DATASET_ID') || present('NEXT_PUBLIC_META_PIXEL_ID')),
    testEvents: present('META_TEST_EVENT_CODE'),
  }
  const turnstile = {
    siteKey: present('NEXT_PUBLIC_TURNSTILE_SITE_KEY'),
    secret: present('TURNSTILE_SECRET_KEY'),
  }
  const flags = {
    commerce: serverFlags.commerceEnabled(),
    storePublic: serverFlags.storePublicEnabled(),
    marketplaceSellers: serverFlags.marketplaceSellersEnabled(),
    turnstile: serverFlags.turnstileEnabled(),
    cspEnforced: serverFlags.cspEnforced(),
  }
  const ready = validateServerEnvironment().valid
  return { ready, core, payment, meta, turnstile, flags }
}
