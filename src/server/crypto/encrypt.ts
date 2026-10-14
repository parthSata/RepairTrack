import 'server-only'
import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from 'node:crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_BYTES = 12
const KEY_BYTES = 32
const SEPARATOR = '.'

let cachedKey: Buffer | null = null

function getKey(): Buffer {
  if (cachedKey) return cachedKey
  const key = Buffer.from(
    process.env.GMAIL_TOKEN_ENCRYPTION_KEY ?? '',
    'base64',
  )
  if (key.length !== KEY_BYTES) {
    throw new Error(
      `GMAIL_TOKEN_ENCRYPTION_KEY must be ${KEY_BYTES} bytes encoded as base64`,
    )
  }

  cachedKey = key
  return key
}

function getPendingRegistrationKey(): Buffer {
  const configuredKey = process.env.PENDING_REGISTRATION_ENCRYPTION_KEY
  if (configuredKey) {
    const key = Buffer.from(configuredKey, 'base64')
    if (key.length !== KEY_BYTES) {
      throw new Error(
        `PENDING_REGISTRATION_ENCRYPTION_KEY must be ${KEY_BYTES} bytes encoded as base64`,
      )
    }
    return key
  }

  const secret = process.env.BETTER_AUTH_SECRET
  if (!secret)
    throw new Error('BETTER_AUTH_SECRET is required for pending registrations')
  return createHash('sha256').update(`pending-registration:${secret}`).digest()
}

/** Encrypts with AES-256-GCM; returns `iv.tag.ciphertext` in base64url. */
export function encrypt(plainText: string): string {
  const iv = randomBytes(IV_BYTES)
  const cipher = createCipheriv(ALGORITHM, getKey(), iv)
  const cipherText = Buffer.concat([
    cipher.update(plainText, 'utf8'),
    cipher.final(),
  ])
  return [iv, cipher.getAuthTag(), cipherText]
    .map((part) => part.toString('base64url'))
    .join(SEPARATOR)
}

/** Throws when the payload is malformed, tampered with, or was encrypted with another key. */
export function decrypt(payload: string): string {
  const [iv, tag, cipherText] = payload
    .split(SEPARATOR)
    .map((part) => Buffer.from(part, 'base64url'))
  if (!iv || !tag || !cipherText) throw new Error('Malformed encrypted payload')
  const decipher = createDecipheriv(ALGORITHM, getKey(), iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([
    decipher.update(cipherText),
    decipher.final(),
  ]).toString('utf8')
}

export function encryptPendingRegistrationPassword(plainText: string): string {
  const iv = randomBytes(IV_BYTES)
  const cipher = createCipheriv(ALGORITHM, getPendingRegistrationKey(), iv)
  const cipherText = Buffer.concat([
    cipher.update(plainText, 'utf8'),
    cipher.final(),
  ])
  return [iv, cipher.getAuthTag(), cipherText]
    .map((part) => part.toString('base64url'))
    .join(SEPARATOR)
}

export function decryptPendingRegistrationPassword(payload: string): string {
  const [iv, tag, cipherText] = payload
    .split(SEPARATOR)
    .map((part) => Buffer.from(part, 'base64url'))
  if (!iv || !tag || !cipherText)
    throw new Error('Malformed pending registration payload')
  const decipher = createDecipheriv(ALGORITHM, getPendingRegistrationKey(), iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([
    decipher.update(cipherText),
    decipher.final(),
  ]).toString('utf8')
}
