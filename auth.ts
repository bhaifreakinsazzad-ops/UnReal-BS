import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/client'
import { checkRateLimit } from '@/lib/rate-limit'

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const email = typeof credentials?.email === 'string' ? credentials.email : undefined
        const password = typeof credentials?.password === 'string' ? credentials.password : undefined

        if (!email || !password) return null

        // Rate-limit login attempts per email before touching the DB. On a
        // hit we return null just like a bad password would — NextAuth shows
        // a generic "invalid credentials" message either way, so this never
        // leaks that the limiter (rather than a wrong password) is why the
        // attempt failed, which would itself be an information-disclosure /
        // account-enumeration risk.
        const { allowed } = await checkRateLimit('login', email, { max: 10, windowSeconds: 900 })
        if (!allowed) return null

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
            console.error('Supabase auth lookup failed, falling back to admin login:', err)
          }
        }

        const adminEmail = process.env.ADMIN_EMAIL
        const adminPassword = process.env.ADMIN_PASSWORD

        if (!adminEmail || !adminPassword) {
          console.error('ADMIN_EMAIL / ADMIN_PASSWORD are not configured - rejecting all logins')
          return null
        }

        if (email === adminEmail && password === adminPassword) {
          return { id: '1', name: 'Admin', email: adminEmail }
        }
        return null
      },
    }),
  ],
  pages: {
    signIn: '/login',
  },
  session: { strategy: 'jwt' },
  trustHost: true,
})
