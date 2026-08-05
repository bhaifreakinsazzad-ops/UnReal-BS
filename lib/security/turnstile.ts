import 'server-only'

export async function verifyTurnstile(token: string, remoteIp?: string, expectedHostname?: string): Promise<boolean> {
  if (process.env.TURNSTILE_ENABLED !== 'true') return true
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim()
  if (!secret || !token) return false

  const body = new URLSearchParams({ secret, response: token })
  if (remoteIp && remoteIp !== 'unknown') body.set('remoteip', remoteIp)
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 4000)
  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body,
      signal: controller.signal,
      cache: 'no-store',
    })
    if (!response.ok) return false
    const result = (await response.json()) as { success?: boolean; hostname?: string; action?: string }
    return result.success === true && result.action === 'apply' && (!expectedHostname || result.hostname === expectedHostname)
  } catch {
    return false
  } finally {
    clearTimeout(timeout)
  }
}
