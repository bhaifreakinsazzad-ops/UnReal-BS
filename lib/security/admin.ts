import 'server-only'
import { randomBytes, timingSafeEqual } from 'node:crypto'
import bcrypt from 'bcryptjs'
import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/client'

export function normalizedAdminEmail(): string | null {
  return process.env.ADMIN_EMAIL?.trim().toLowerCase() || null
}

export function isAdminEmail(email: string | null | undefined): boolean {
  const adminEmail = normalizedAdminEmail()
  return Boolean(adminEmail && email?.trim().toLowerCase() === adminEmail)
}

export function secureStringEqual(left: string | undefined, right: string): boolean {
  if (!left) return false
  const leftBytes = Buffer.from(left)
  const rightBytes = Buffer.from(right)
  return leftBytes.length === rightBytes.length && timingSafeEqual(leftBytes, rightBytes)
}

export async function requireAdminSession(options: { hide?: boolean } = {}) {
  const session = await auth()
  if (!isAdminEmail(session?.user?.email)) {
    return {
      error: NextResponse.json(
        { message: options.hide === false ? 'Administrator access required.' : 'Not found.' },
        { status: options.hide === false ? 403 : 404 }
      ),
    } as const
  }
  return { session, email: session!.user!.email!.trim().toLowerCase() } as const
}

export async function verifyPasswordForEmail(email: string, password: string): Promise<boolean> {
  const normalized = email.trim().toLowerCase()
  if (isAdminEmail(normalized)) {
    const configured = process.env.ADMIN_PASSWORD
    return secureStringEqual(configured, password)
  }
  if (!isSupabaseConfigured()) return false
  const { data, error } = await getSupabaseAdmin()
    .from('unreal_bs_users')
    .select('password_hash')
    .eq('email', normalized)
    .maybeSingle()
  return Boolean(!error && data?.password_hash && (await bcrypt.compare(password, data.password_hash)))
}

export async function ensurePlatformOwnerUserId(): Promise<string | null> {
  const adminEmail = normalizedAdminEmail()
  if (!adminEmail || !isSupabaseConfigured()) return null
  const supabase = getSupabaseAdmin()
  const { data: existing } = await supabase
    .from('unreal_bs_users')
    .select('id')
    .eq('email', adminEmail)
    .maybeSingle()
  if (existing?.id) return existing.id as string

  const unusablePassword = await bcrypt.hash(randomBytes(48).toString('base64url'), 12)
  const { data, error } = await supabase
    .from('unreal_bs_users')
    .insert({
      email: adminEmail,
      password_hash: unusablePassword,
      business_name: 'UnReal BS',
      role: 'platform_admin',
      ghl_location_id: process.env.GHL_LOCATION_ID ?? null,
    })
    .select('id')
    .single()
  return error ? null : (data?.id as string | undefined) ?? null
}
