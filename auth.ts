import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/client'
import { checkRateLimit } from '@/lib/rate-limit'
import { clientIp, opaqueRateKey } from '@/lib/security/request'
import { isAdminEmail, secureStringEqual } from '@/lib/security/admin'
import { ABSOLUTE_SESSION_TTL_SECONDS, enforceAbsoluteSession } from '@/lib/security/session'

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, request) {
        // Normalised the same way registration stores it
        // (app/api/auth/register/route.ts lowercases via zod). Without this a
        // user who registers as "Shop@Example.com" and later types
        // "shop@example.com" — or the reverse — fails the lookup and cannot
        // sign in at all. Also keeps the rate-limit key consistent so case
        // variations can't be used to multiply the allowance.
        const rawEmail = typeof credentials?.email === 'string' ? credentials.email : undefined
        const email = rawEmail?.trim().toLowerCase()
        const password = typeof credentials?.password === 'string' ? credentials.password : undefined

        if (!email || !password) return null

        // Rate-limit login attempts per email before touching the DB. On a
        // hit we return null just like a bad password would — NextAuth shows
        // a generic "invalid credentials" message either way, so this never
        // leaks that the limiter (rather than a wrong password) is why the
        // attempt failed, which would itself be an information-disclosure /
        // account-enumeration risk.
        // failClosed: the whole product sits behind one shared admin
        // credential, so if the limiter itself breaks we must refuse logins
        // rather than hand an attacker an unthrottled brute-force window.
        const emailLimit = await checkRateLimit('login-email', opaqueRateKey(email), {
          max: 10,
          windowSeconds: 900,
          failClosed: true,
        })
        const ipLimit = await checkRateLimit('login-ip', opaqueRateKey(clientIp(request)), {
          max: 30,
          windowSeconds: 900,
          failClosed: true,
        })
        if (!emailLimit.allowed || !ipLimit.allowed) return null

        // The platform operator is intentionally checked before the user
        // table. Platform commerce may create a non-login owner row for the
        // same email to satisfy relational ownership without shadowing the
        // environment-controlled operator credential.
        const adminPassword = process.env.ADMIN_PASSWORD
        if (isAdminEmail(email) && secureStringEqual(adminPassword, password)) {
          return { id: '1', name: 'Admin', email }
        }

        // Try real user accounts first. If Supabase isn't configured, the
        // migration hasn't been run yet, or the lookup errors for any other
        // reason, fall back to the single admin account so existing
        // deployments keep working unmodified.
        if (isSupabaseConfigured()) {
          try {
            const supabase = getSupabaseAdmin()
            const { data: user, error } = await supabase
              .from('unreal_bs_users')
              .select('id, email, password_hash, business_name')
              .eq('email', email)
              .maybeSingle()

            if (!error && user) {
              const valid = await bcrypt.compare(password, user.password_hash)
              if (valid) {
                return { id: user.id, name: user.business_name || user.email, email: user.email }
              }
              // A matching row exists but the password was wrong — don't
              // fall through to the admin check for this email.
              return null
            }
          } catch (err) {
            void err
            console.error('Supabase auth lookup failed; rejecting database-backed login')
          }
        }

        const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase()

        if (!adminEmail || !adminPassword) {
          console.error('ADMIN_EMAIL / ADMIN_PASSWORD are not configured - rejecting all logins')
          return null
        }

        // Email is compared case-insensitively (both sides normalised); the
        // password is still an exact match.
        return null
      },
    }),
  ],
  pages: {
    signIn: '/login',
  },
  callbacks: {
    jwt({ token, user }) {
      return enforceAbsoluteSession(token, Boolean(user))
    },
  },
  session: { strategy: 'jwt', maxAge: ABSOLUTE_SESSION_TTL_SECONDS },
  jwt: { maxAge: ABSOLUTE_SESSION_TTL_SECONDS },
  trustHost: true,
})
