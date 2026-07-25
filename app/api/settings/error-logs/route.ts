import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/client'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ message: 'Authentication required.' }, { status: 401 })
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ logs: [] })
  }

  try {
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('unreal_bs_error_logs')
      .select('id, source, message, created_at')
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) return NextResponse.json({ logs: [] })
    return NextResponse.json({ logs: data ?? [] })
  } catch {
    return NextResponse.json({ logs: [] })
  }
}
