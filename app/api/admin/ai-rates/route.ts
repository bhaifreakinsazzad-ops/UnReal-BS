import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/auth'
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/client'
import { logError } from '@/lib/log-error'

export const dynamic = 'force-dynamic'

const DB_NOT_READY_MESSAGE =
  'Database not yet configured. Run the migration in supabase/migrations/0003_ai_subscriptions.sql.'

// Admin-only AI rate card management.
//
// These rates were seeded ONCE in 0003_ai_subscriptions.sql under the comment
// "STARTING VALUES TO REVIEW — NOT VERIFIED CURRENT PRICING" and there was no
// way to change them without hand-written SQL. Provider prices change without
// notice, so the business kept charging the old number until someone
// remembered to edit the database. This is the control surface for that.

async function requireAdmin() {
  const session = await auth()
  const email = session?.user?.email
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase()
  if (!email || !adminEmail || email.trim().toLowerCase() !== adminEmail) {
    return { error: NextResponse.json({ message: 'Not found.' }, { status: 404 }) }
  }
  if (!isSupabaseConfigured()) {
    return { error: NextResponse.json({ message: DB_NOT_READY_MESSAGE }, { status: 502 }) }
  }
  return {}
}

const patchSchema = z.object({
  id: z.string().uuid(),
  // Rates are BDT per 1,000 tokens. numeric(12,6) in the DB, so 6dp is the
  // practical limit. Bounded to catch a fat-fingered extra zero, which on a
  // metered product would either bankrupt the customer or the business.
  inputRateBdtPer1k: z.number().min(0).max(1000).optional(),
  outputRateBdtPer1k: z.number().min(0).max(1000).optional(),
  markupMultiplier: z.number().min(1).max(10).optional(),
  displayName: z.string().trim().min(1).max(100).optional(),
  isActive: z.boolean().optional(),
})

const postSchema = z.object({
  provider: z.string().trim().min(1).max(50),
  modelId: z.string().trim().min(1).max(120),
  displayName: z.string().trim().min(1).max(100),
  inputRateBdtPer1k: z.number().min(0).max(1000),
  outputRateBdtPer1k: z.number().min(0).max(1000),
  markupMultiplier: z.number().min(1).max(10).default(1.3),
})

export async function GET() {
  const resolved = await requireAdmin()
  if (resolved.error) return resolved.error

  try {
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('unreal_bs_ai_model_rates')
      .select('id, provider, model_id, display_name, input_rate_bdt_per_1k, output_rate_bdt_per_1k, markup_multiplier, is_active')
      .order('provider', { ascending: true })

    if (error) {
      await logError('admin-ai-rates-get', error)
      return NextResponse.json({ message: DB_NOT_READY_MESSAGE }, { status: 502 })
    }

    return NextResponse.json({
      rates: (data ?? []).map((r) => ({
        id: r.id,
        provider: r.provider,
        modelId: r.model_id,
        displayName: r.display_name,
        inputRateBdtPer1k: Number(r.input_rate_bdt_per_1k),
        outputRateBdtPer1k: Number(r.output_rate_bdt_per_1k),
        markupMultiplier: Number(r.markup_multiplier),
        isActive: r.is_active,
      })),
    })
  } catch (err) {
    await logError('admin-ai-rates-get', err)
    return NextResponse.json({ message: DB_NOT_READY_MESSAGE }, { status: 502 })
  }
}

export async function PATCH(request: Request) {
  const resolved = await requireAdmin()
  if (resolved.error) return resolved.error

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ message: 'Invalid request payload.' }, { status: 400 })
  }

  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { message: 'Invalid values. Rates must be 0–1000 BDT per 1k tokens and markup 1–10.', errors: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { id, inputRateBdtPer1k, outputRateBdtPer1k, markupMultiplier, displayName, isActive } = parsed.data

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (inputRateBdtPer1k !== undefined) update.input_rate_bdt_per_1k = inputRateBdtPer1k
  if (outputRateBdtPer1k !== undefined) update.output_rate_bdt_per_1k = outputRateBdtPer1k
  if (markupMultiplier !== undefined) update.markup_multiplier = markupMultiplier
  if (displayName !== undefined) update.display_name = displayName
  if (isActive !== undefined) update.is_active = isActive

  try {
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('unreal_bs_ai_model_rates')
      .update(update)
      .eq('id', id)
      .select('id')
      .single()

    if (error || !data) {
      await logError('admin-ai-rates-patch', error ?? new Error('no row'), { id })
      return NextResponse.json({ message: 'Could not update this rate.' }, { status: 502 })
    }
    return NextResponse.json({ ok: true })
  } catch (err) {
    await logError('admin-ai-rates-patch', err, { id })
    return NextResponse.json({ message: 'Could not update this rate.' }, { status: 502 })
  }
}

export async function POST(request: Request) {
  const resolved = await requireAdmin()
  if (resolved.error) return resolved.error

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ message: 'Invalid request payload.' }, { status: 400 })
  }

  const parsed = postSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ message: 'Invalid values.', errors: parsed.error.flatten() }, { status: 400 })
  }

  const p = parsed.data

  try {
    const supabase = getSupabaseAdmin()
    const { error } = await supabase.from('unreal_bs_ai_model_rates').insert({
      provider: p.provider,
      model_id: p.modelId,
      display_name: p.displayName,
      input_rate_bdt_per_1k: p.inputRateBdtPer1k,
      output_rate_bdt_per_1k: p.outputRateBdtPer1k,
      markup_multiplier: p.markupMultiplier,
      is_active: true,
    })

    // unique(provider, model_id)
    if (error?.code === '23505') {
      return NextResponse.json(
        { message: 'That provider + model is already on the rate card. Edit it instead.' },
        { status: 409 }
      )
    }
    if (error) {
      await logError('admin-ai-rates-post', error, { modelId: p.modelId })
      return NextResponse.json({ message: 'Could not add this model.' }, { status: 502 })
    }

    return NextResponse.json({ ok: true }, { status: 201 })
  } catch (err) {
    await logError('admin-ai-rates-post', err, { modelId: p.modelId })
    return NextResponse.json({ message: 'Could not add this model.' }, { status: 502 })
  }
}
