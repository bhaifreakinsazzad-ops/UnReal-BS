import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/auth'
import { isSupabaseConfigured } from '@/lib/supabase/client'
import { resolveUserIdByEmail } from '@/lib/supabase/user'
import { createDepositRequest, getLatestDepositRequest } from '@/lib/wallet/deposit-requests'
import { logError } from '@/lib/log-error'

export const dynamic = 'force-dynamic'

const DB_NOT_READY_MESSAGE =
  'Database not yet configured. Run the migration in supabase/migrations/0004_shared_wallet_and_virtual_cards.sql.'

const METHODS = ['bkash', 'nagad', 'rocket', 'upay', 'bank', 'cash', 'other'] as const

const postSchema = z.object({
  amountBdt: z.number().positive().max(1_000_000),
  method: z.enum(METHODS).optional(),
  note: z.string().trim().max(2000).optional().or(z.literal('')),
})

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
    return { userId, email }
  } catch {
    return { error: NextResponse.json({ message: DB_NOT_READY_MESSAGE }, { status: 502 }) }
  }
}

export async function GET() {
  const resolved = await requireUserId()
  if (resolved.error) return resolved.error
  const { userId } = resolved

  try {
    const { data, error } = await getLatestDepositRequest(userId)
    if (error) return NextResponse.json({ message: DB_NOT_READY_MESSAGE }, { status: 502 })
    return NextResponse.json({ request: data ?? null })
  } catch (err) {
    await logError('wallet-deposit-request-route-get', err, { userId })
    return NextResponse.json({ message: DB_NOT_READY_MESSAGE }, { status: 502 })
  }
}

export async function POST(request: Request) {
  const resolved = await requireUserId()
  if (resolved.error) return resolved.error
  const { userId, email } = resolved

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
    const result = await createDepositRequest(userId, email, parsed.data, {
      tag: 'WALLET-DEPOSIT-REQUEST',
      source: 'UnReal Systems Wallet — Deposit Request',
    })

    if ('error' in result && result.error) {
      return NextResponse.json({ message: DB_NOT_READY_MESSAGE }, { status: 502 })
    }
    if ('pendingConflict' in result && result.pendingConflict) {
      return NextResponse.json({ message: 'You already have a pending deposit request.' }, { status: 409 })
    }

    return NextResponse.json({ request: result.data })
  } catch (err) {
    await logError('wallet-deposit-request-route-post', err, { userId })
    return NextResponse.json({ message: DB_NOT_READY_MESSAGE }, { status: 502 })
  }
}
