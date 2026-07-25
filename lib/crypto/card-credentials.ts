import 'server-only'
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

// AES-256-GCM encrypt-at-rest for virtual card credentials (full number,
// expiry, CVV). CARD_CREDENTIAL_ENC_KEY must be a 32-byte key, base64
// encoded, set server-only in Vercel env vars — never in the DB. Plaintext
// only ever exists in memory, for the duration of an admin-assign or
// customer-reveal request; it is never logged.

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12

function getKey(): Buffer {
  const raw = process.env.CARD_CREDENTIAL_ENC_KEY
  if (!raw) throw new Error('CARD_CREDENTIAL_ENC_KEY is not configured')
  const key = Buffer.from(raw, 'base64')
  if (key.length !== 32) throw new Error('CARD_CREDENTIAL_ENC_KEY must decode to exactly 32 bytes')
  return key
}

// Encoded as base64(iv):base64(authTag):base64(ciphertext) — stored verbatim
// in unreal_bs_virtual_cards.credential_secret_encrypted.
export function encryptCardCredential(plaintext: string): string {
  const key = getKey()
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, key, iv)
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()
  return [iv.toString('base64'), authTag.toString('base64'), ciphertext.toString('base64')].join(':')
}

export function decryptCardCredential(encoded: string): string {
  const key = getKey()
  const [ivB64, authTagB64, ciphertextB64] = encoded.split(':')
  if (!ivB64 || !authTagB64 || !ciphertextB64) {
    throw new Error('Malformed encrypted card credential')
  }
  const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(ivB64, 'base64'))
  decipher.setAuthTag(Buffer.from(authTagB64, 'base64'))
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(ciphertextB64, 'base64')),
    decipher.final(),
  ])
  return plaintext.toString('utf8')
}
