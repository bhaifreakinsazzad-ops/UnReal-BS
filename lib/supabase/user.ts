import { getSupabaseAdmin } from '@/lib/supabase/client'

// The NextAuth JWT's `id` may be the hardcoded admin id ('1') rather than a
// real unreal_bs_users.id, so every server lookup resolves the Supabase user
// row by email instead of trusting the session id directly.
export async function resolveUserIdByEmail(email: string): Promise<string | null> {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('unreal_bs_users')
    .select('id')
    .eq('email', email)
    .maybeSingle()

  if (error || !data) return null
  return data.id as string
}
