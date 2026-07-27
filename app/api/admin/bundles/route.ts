import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/auth'
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/client'
import { logError } from '@/lib/log-error'

export const dynamic = 'force-dynamic'

const DB_NOT_READY_MESSAGE =
  'Bundles are not available yet. Run supabase/migrations/0009_ai_bundles_and_repriced_rate_card.sql.'

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
  code: z.string().trim().min(1).max(50),
  priceBdt: z.number().positive().max(1_000_000).optional(),
  creditBdt: z.number().positive().max(1_000_000).optional(),
  isActive: z.boolean().optional(),
})

export async function GET() {
  const resolved = await requireAdmin()
  if (resolved.error) return resolved.error

  try {
    const supabase = getSupabaseAdmin()

    // The uniform markup is what makes each bundle's cost ceiling exact, so it
    // is read back here to recompute the ceiling rather than trusting the
    // stored cost_cap_bdt blindly. If someone changes a model's markup, the
    // admin UI will show the ceiling drifting from what was stored.
    const [{ data: bundles, error }, { data: rates }] = await Promise.all([
      supabase
        .from('unreal_bs_ai_bundles')
        .select('code, name_en, name_bn, price_bdt, credit_bdt, cost_cap_bdt, is_active, sort_order')
        .order('sort_order', { ascending: true }),
      supabase.from('unreal_bs_ai_model_rates').select('markup_multiplier').eq('is_active', true),
    ])

    if (error) {
      await logError('admin-bundles-get', error)
      return NextResponse.json({ message: DB_NOT_READY_MESSAGE }, { status: 502 })
    }

    const markups = Array.from(new Set((rates ?? []).map((r) => Number(r.markup_multiplier))))
    const uniformMarkup = markups.length === 1 ? markups[0] : null

    return NextResponse.json({
      // null when models disagree — the UI warns, because a non-uniform markup
      // breaks the "cost ceiling is credit/markup" guarantee.
      uniformMarkup,
      markupsInUse: markups,
      bundles: (bundles ?? []).map((b) => ({
        code: b.code,
        nameEn: b.name_en,
        nameBn: b.name_bn,
        priceBdt: Number(b.price_bdt),
        creditBdt: Number(b.credit_bdt),
        storedCostCapBdt: Number(b.cost_cap_bdt),
        derivedCostCapBdt: uniformMarkup ? Number(b.credit_bdt) / uniformMarkup : null,
        isActive: b.is_active,
      })),
    })
  } catch (err) {
    await logError('admin-bundles-get', err)
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
    return NextResponse.json({ message: 'Invalid values.' }, { status: 400 })
  }

  const { code, priceBdt, creditBdt, isActive } = parsed.data

  try {
    const supabase = getSupabaseAdmin()

    const { data: existing } = await supabase
      .from('unreal_bs_ai_bundles')
      .select('price_bdt, credit_bdt')
      .eq('code', code)
      .maybeSingle()

    if (!existing) return NextResponse.json({ message: 'Package not found.' }, { status: 404 })

    const nextPrice = priceBdt ?? Number(existing.price_bdt)
    const nextCredit = creditBdt ?? Number(existing.credit_bdt)

    // Recompute the ceiling from the live uniform markup so it can never drift
    // out of sync with what the chat route will actually charge.
    const { data: rates } = await supabase
      .from('unreal_bs_ai_model_rates')
      .select('markup_multiplier')
      .eq('is_active', true)

    const markups = Array.from(new Set((rates ?? []).map((r) => Number(r.markup_multiplier))))
    if (markups.length !== 1) {
      return NextResponse.json(
        {
          message:
            'Active models do not all share one markup, so a package cost ceiling cannot be guaranteed. Make every active model use the same markup on the AI Rate Card first.',
        },
        { status: 409 }
      )
    }

    const costCap = nextCredit / markups[0]
    if (costCap >= nextPrice) {
      return NextResponse.json(
        {
          message: `At a ${markups[0]}x markup, ৳${nextCredit} of credit can cost up to ৳${costCap.toFixed(0)} — that is not less than the ৳${nextPrice} price. Lower the credit or raise the price.`,
        },
        { status: 400 }
      )
    }

    const update: Record<string, unknown> = { cost_cap_bdt: costCap, updated_at: new Date().toISOString() }
    if (priceBdt !== undefined) update.price_bdt = priceBdt
    if (creditBdt !== undefined) update.credit_bdt = creditBdt
    if (isActive !== undefined) update.is_active = isActive

    const { error } = await supabase.from('unreal_bs_ai_bundles').update(update).eq('code', code)

    if (error) {
      await logError('admin-bundles-patch', error, { code })
      return NextResponse.json({ message: 'Could not update this package.' }, { status: 502 })
    }

    return NextResponse.json({ ok: true, costCapBdt: costCap })
  } catch (err) {
    await logError('admin-bundles-patch', err, { code })
    return NextResponse.json({ message: 'Could not update this package.' }, { status: 502 })
  }
}
