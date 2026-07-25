import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/auth'
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/client'
import { resolveUserIdByEmail } from '@/lib/supabase/user'
import { logError } from '@/lib/log-error'

export const dynamic = 'force-dynamic'

const DB_NOT_READY_MESSAGE =
  'Database not yet configured. Run the migration in supabase/migrations/0001_unreal_bs_core.sql.'

const contactSchema = z.object({
  name: z.string().trim().min(1),
  phone: z.string().trim().optional().or(z.literal('')),
  area: z.string().trim().optional().or(z.literal('')),
})

const entrySchema = z.object({
  contactId: z.string().trim().min(1),
  amount: z.number().positive(),
  description: z.string().trim().optional().or(z.literal('')),
  entryDate: z.string().trim().min(1),
  dueDate: z.string().trim().optional().or(z.literal('')),
})

const paymentSchema = z.object({
  contactId: z.string().trim().min(1),
  amount: z.number().positive(),
  paidAt: z.string().trim().optional(),
})

const postSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('contact'), data: contactSchema }),
  z.object({ type: z.literal('entry'), data: entrySchema }),
  z.object({ type: z.literal('payment'), data: paymentSchema }),
])

async function requireUserId() {
  const session = await auth()
  const email = session?.user?.email
  if (!email) return { error: NextResponse.json({ message: 'Authentication required.' }, { status: 401 }) }

  if (!isSupabaseConfigured()) {
    return { error: NextResponse.json({ message: DB_NOT_READY_MESSAGE }, { status: 502 }) }
  }

  try {
    const userId = await resolveUserIdByEmail(email)
    if (!userId) {
      return { error: NextResponse.json({ message: DB_NOT_READY_MESSAGE }, { status: 502 }) }
    }
    return { userId }
  } catch {
    return { error: NextResponse.json({ message: DB_NOT_READY_MESSAGE }, { status: 502 }) }
  }
}

export async function GET() {
  const resolved = await requireUserId()
  if (resolved.error) return resolved.error
  const { userId } = resolved

  try {
    const supabase = getSupabaseAdmin()
    const [contacts, entries, payments] = await Promise.all([
      supabase.from('unreal_bs_udhar_contacts').select('*').eq('user_id', userId).order('created_at', { ascending: true }),
      supabase.from('unreal_bs_udhar_entries').select('*').eq('user_id', userId).order('created_at', { ascending: true }),
      supabase.from('unreal_bs_udhar_payments').select('*').eq('user_id', userId).order('paid_at', { ascending: true }),
    ])

    if (contacts.error || entries.error || payments.error) {
      return NextResponse.json({ message: DB_NOT_READY_MESSAGE }, { status: 502 })
    }

    return NextResponse.json({
      contacts: contacts.data ?? [],
      entries: entries.data ?? [],
      payments: payments.data ?? [],
    })
  } catch (err) {
    await logError('udhar-khata-route-get', err, { userId })
    return NextResponse.json({ message: DB_NOT_READY_MESSAGE }, { status: 502 })
  }
}

export async function POST(request: Request) {
  const resolved = await requireUserId()
  if (resolved.error) return resolved.error
  const { userId } = resolved

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ message: 'Invalid request payload.' }, { status: 400 })
  }

  const parsed = postSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { message: 'Invalid request payload.', errors: parsed.error.flatten() },
      { status: 400 }
    )
  }

  try {
    const supabase = getSupabaseAdmin()

    if (parsed.data.type === 'contact') {
      const { data, error } = await supabase
        .from('unreal_bs_udhar_contacts')
        .insert({ user_id: userId, ...parsed.data.data })
        .select()
        .single()
      if (error) return NextResponse.json({ message: DB_NOT_READY_MESSAGE }, { status: 502 })
      return NextResponse.json({ contact: data })
    }

    if (parsed.data.type === 'entry') {
      const { contactId, amount, description, entryDate, dueDate } = parsed.data.data
      const { data, error } = await supabase
        .from('unreal_bs_udhar_entries')
        .insert({
          user_id: userId,
          contact_id: contactId,
          amount,
          description,
          entry_date: entryDate,
          due_date: dueDate || null,
        })
        .select()
        .single()
      if (error) return NextResponse.json({ message: DB_NOT_READY_MESSAGE }, { status: 502 })
      return NextResponse.json({ entry: data })
    }

    const { contactId, amount, paidAt } = parsed.data.data
    const { data, error } = await supabase
      .from('unreal_bs_udhar_payments')
      .insert({
        user_id: userId,
        contact_id: contactId,
        amount,
        paid_at: paidAt || new Date().toISOString(),
      })
      .select()
      .single()
    if (error) return NextResponse.json({ message: DB_NOT_READY_MESSAGE }, { status: 502 })
    return NextResponse.json({ payment: data })
  } catch (err) {
    await logError('udhar-khata-route-post', err, { userId })
    return NextResponse.json({ message: DB_NOT_READY_MESSAGE }, { status: 502 })
  }
}
