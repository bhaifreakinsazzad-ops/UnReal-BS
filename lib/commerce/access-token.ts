import 'server-only'
import { createHash, randomBytes } from 'node:crypto'

export function generateAccessToken(): { raw: string; hash: string } {
  const raw = randomBytes(32).toString('base64url')
  return { raw, hash: hashAccessToken(raw) }
}
export function hashAccessToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex')
}
