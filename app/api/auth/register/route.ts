import { after, NextResponse } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/client'
import { checkRateLimit } from '@/lib/rate-limit'
import { logError } from '@/lib/log-error'
import { clientIp, opaqueRateKey, readJson } from '@/lib/security/request'
import { attributionSchema } from '@/lib/meta/attribution'
import { sendMetaEvent } from '@/lib/meta/capi'

export const dynamic = 'force-dynamic'

// Public self-registration.
//
// A new account gets its own unreal_bs_users row and its own wallet. It does
// NOT get a GHL workspace — ghl_location_id stays null until an operator
// provisions one, and lib/tenant.ts refuses to fall back to the shared
// environment location. That means a brand-new user can immediately use every
// feature that lives in our own per-user tables (Wallet, AI
// Subscriptions, Virtual Cards) and sees an honest "workspace being set up"
// state on the CRM screens, rather than another merchant's contacts.

const registerSchema = attributionSchema.extend({
  email: z.string().trim().toLowerCase().email().max(200),
  // 10 chars minimum rather than 8: this is the only credential protecting a
  // wallet with real money in it, and there is no MFA yet.
  password: z.string().min(10).max(200),
  businessName: z.string().trim().min(1).max(200),
})

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { message: 'Registration is temporarily unavailable. Please try again shortly.' },
      { status: 503 }
    )
  }

  const parsed = await readJson(request, registerSchema, { maxBytes: 8192 })
  if (parsed.error) return parsed.error

  const { email, password, businessName, ...attribution } = parsed.data

  // Fail closed: signup creates real money-holding accounts, so if the limiter
  // itself is broken we would rather refuse than allow bulk registration.
  const [emailLimit, ipLimit] = await Promise.all([
    checkRateLimit('register-email', opaqueRateKey(email), { max: 5, windowSeconds: 3600, failClosed: true }),
    checkRateLimit('register-ip', opaqueRateKey(clientIp(request)), { max: 15, windowSeconds: 3600, failClosed: true }),
  ])
  if (!emailLimit.allowed || !ipLimit.allowed) {
    return NextResponse.json(
      { message: 'Too many attempts. Please try again later.' },
      { status: 429 }
    )
  }

  try {
    const supabase = getSupabaseAdmin()

    // Never let self-registration mint the operator account.
    const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase()
    if (adminEmail && email === adminEmail) {
      return NextResponse.json({ message: 'This email cannot be registered.' }, { status: 409 })
    }

    const passwordHash = await bcrypt.hash(password, 12)

    const { data: created, error: insertError } = await supabase
      .from('unreal_bs_users')
      .insert({
        email,
        password_hash: passwordHash,
        business_name: businessName,
        role: 'owner',
        // Explicitly null — provisioned later by an operator. See lib/tenant.ts.
        ghl_location_id: null,
      })
      .select('id, email')
      .single()

    // 23505 = unique_violation on the email column. Returned as a plain 409
    // with the same wording regardless, so this endpoint cannot be used to
    // enumerate which emails already have accounts.
    if (insertError?.code === '23505') {
      return NextResponse.json(
        { message: 'That email cannot be registered. Try signing in instead.' },
        { status: 409 }
      )
    }
    if (insertError || !created) {
      await logError('auth-register-insert', insertError ?? new Error('no row returned'))
      return NextResponse.json({ message: 'Could not create your account.' }, { status: 502 })
    }

    // Give the account a wallet up front so the money screens have something
    // real to read on first load rather than erroring.
    const { error: walletError } = await supabase
      .from('unreal_bs_wallets')
      .insert({ user_id: created.id, balance_bdt: 0 })

    if (walletError && walletError.code !== '23505') {
      // Non-fatal: /api/wallet creates the row on demand if it is missing.
      await logError('auth-register-wallet-init', walletError, { userId: created.id })
    }

    // Registration is the ad conversion, not the submit click. Send it after
    // the response so Meta latency/failure never delays or breaks account
    // creation. Browser and server share eventId for deduplication.
    if (attribution.marketingConsent && attribution.eventId) {
      const eventSourceUrl = attribution.landingPage || new URL('/signup', request.url).toString()
      const requestIp = clientIp(request)
      const userAgent = request.headers.get('user-agent')
      after(() => sendMetaEvent({
        eventName: 'CompleteRegistration',
        eventId: attribution.eventId!,
        eventSourceUrl,
        attribution,
        email: created.email,
        externalId: created.id,
        clientIp: requestIp,
        userAgent,
      }))
    }

    return NextResponse.json({ ok: true, email: created.email }, { status: 201 })
  } catch (err) {
    await logError('auth-register', err)
    return NextResponse.json({ message: 'Could not create your account.' }, { status: 502 })
  }
}
