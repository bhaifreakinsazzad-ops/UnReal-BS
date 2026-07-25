import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/auth'
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/client'
import { resolveUserIdByEmail } from '@/lib/supabase/user'
import { checkRateLimit } from '@/lib/rate-limit'
import { addContactTags, upsertContact } from '@/lib/ghl/contacts'
import { logError } from '@/lib/log-error'

export const dynamic = 'force-dynamic'

const LOCATION_ID = process.env.GHL_LOCATION_ID

const FEATURE_TAGS: Record<string, string> = {
  opportunities: 'OPPORTUNITIES-WAITLIST',
  credit_center: 'CREDIT-CENTER-WAITLIST',
  meetally: 'MEETALLY-WAITLIST',
}

const postSchema = z.object({
  feature: z.enum(['opportunities', 'credit_center', 'meetally']),
  email: z.string().trim().email(),
})

// Persists real interest from the "Coming Soon" pages — every dashboard
// route here already sits behind the login gate in proxy.ts, so this is
// only ever reached by an authenticated session, but it doesn't require
// one itself (a signed-out direct hit still just records an email).
export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ message: 'Not available right now.' }, { status: 503 })
  }

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const { allowed } = await checkRateLimit('coming-soon-notify', ip, { max: 10, windowSeconds: 3600 })
  if (!allowed) {
    return NextResponse.json({ message: 'Too many requests. Please try again later.' }, { status: 429 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ message: 'Invalid request payload.' }, { status: 400 })
  }

  const parsed = postSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ message: 'Please enter a valid email.' }, { status: 400 })
  }

  const { feature, email } = parsed.data

  try {
    const supabase = getSupabaseAdmin()
    const session = await auth()
    const userId = session?.user?.email ? await resolveUserIdByEmail(session.user.email).catch(() => null) : null

    const { error } = await supabase
      .from('unreal_bs_coming_soon_interest')
      .insert({ feature, email, user_id: userId })

    if (error) {
      await logError('coming-soon-notify-insert', error, { feature })
      return NextResponse.json({ message: 'Could not save your interest right now.' }, { status: 502 })
    }

    if (LOCATION_ID) {
      try {
        const response = await upsertContact(LOCATION_ID, {
          email,
          source: `UnReal BS Coming Soon — ${feature}`,
        })
        const contactId = response.contact?.id
        if (contactId) {
          await addContactTags(contactId, LOCATION_ID, [FEATURE_TAGS[feature]])
        }
      } catch (ghlErr) {
        await logError('coming-soon-notify-ghl', ghlErr, { feature })
      }
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    await logError('coming-soon-notify-route-post', err, { feature })
    return NextResponse.json({ message: 'Could not save your interest right now.' }, { status: 502 })
  }
}
