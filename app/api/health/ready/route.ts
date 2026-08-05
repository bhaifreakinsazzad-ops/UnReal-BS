import { NextResponse } from 'next/server'
import { environmentReadiness } from '@/lib/env'
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/client'

export const dynamic = 'force-dynamic'

async function databaseReady(): Promise<boolean> {
  if (!isSupabaseConfigured()) return false
  try {
    const query = getSupabaseAdmin().from('unreal_bs_users').select('id', { count: 'exact', head: true })
    const timeout = new Promise<{ error: Error }>((resolve) => setTimeout(() => resolve({ error: new Error('timeout') }), 2500))
    const result = await Promise.race([query, timeout])
    return !result.error
  } catch {
    return false
  }
}
export async function GET() {
  const environment = environmentReadiness()
  const database = await databaseReady()
  const ready = environment.ready && database
  return NextResponse.json(
    {
      status: ready ? 'ready' : 'not_ready',
      capabilities: {
        auth: environment.core.auth && environment.core.admin,
        database,
        ghl: environment.core.ghl,
        commerce: environment.flags.commerce && environment.payment.configured,
        publicStore: environment.flags.storePublic,
        marketplaceSellers: environment.flags.marketplaceSellers,
        metaPixel: environment.meta.pixel,
        metaCapi: environment.meta.capi,
        turnstile: environment.flags.turnstile && environment.turnstile.siteKey && environment.turnstile.secret,
        cspEnforced: environment.flags.cspEnforced,
      },
    },
    { status: ready ? 200 : 503, headers: { 'cache-control': 'no-store' } }
  )
}
