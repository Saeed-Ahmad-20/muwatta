'use server'

import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { randomBytes, timingSafeEqual, createHash } from 'crypto'

// ==========================================
// 🔒 SERVER-SIDE BRUTE FORCE PROTECTION
// ==========================================
const MAX_ATTEMPTS = 5
const LOCKOUT_DURATION_MS = 5 * 60 * 1000    // 5 minutes
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000     // 15 min sliding window
const SESSION_MAX_AGE = 60 * 60 * 24 * 7     // 1 week in seconds
const SESSION_IDLE_TIMEOUT = 60 * 60 * 2     // 2 hours idle timeout

// ==========================================
// 📦 IN-MEMORY STORES
//    ⚠️ In production with serverless (Vercel),
//    replace with Redis or DB for persistence
//    across cold starts.
// ==========================================
const loginAttempts = new Map<string, {
  attempts: number
  firstAttempt: number
  lockedUntil: number | null
}>()

const activeSessions = new Map<string, {
  createdAt: number
  lastActivity: number
}>()

// ==========================================
// 🧹 CLEANUP — Prevents memory leaks
// ==========================================
let lastCleanup = Date.now()

function cleanupStaleEntries() {
  const now = Date.now()
  if (now - lastCleanup < 10 * 60 * 1000) return
  lastCleanup = now

  for (const [key, data] of loginAttempts.entries()) {
    const lockExpired = !data.lockedUntil || now > data.lockedUntil
    const windowExpired = now - data.firstAttempt > ATTEMPT_WINDOW_MS
    if (lockExpired && windowExpired) {
      loginAttempts.delete(key)
    }
  }

  for (const [token, session] of activeSessions.entries()) {
    const absoluteExpired = now - session.createdAt > SESSION_MAX_AGE * 1000
    const idleExpired = now - session.lastActivity > SESSION_IDLE_TIMEOUT * 1000
    if (absoluteExpired || idleExpired) {
      activeSessions.delete(token)
    }
  }
}

// ==========================================
// 🔒 TIMING-SAFE STRING COMPARISON
// ==========================================
function safeCompare(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') return false

  const maxLen = Math.max(a.length, b.length)
  const bufA = Buffer.alloc(maxLen, 0)
  const bufB = Buffer.alloc(maxLen, 0)
  Buffer.from(a).copy(bufA)
  Buffer.from(b).copy(bufB)

  return timingSafeEqual(bufA, bufB) && a.length === b.length
}

// ==========================================
// 🌐 CLIENT IDENTIFICATION (Per-IP)
// ==========================================
async function getClientIdentifier(): Promise<string> {
  try {
    const headersList = await headers()
    const forwarded = headersList.get('x-forwarded-for')
    const realIp = headersList.get('x-real-ip')
    const ip = forwarded?.split(',')[0]?.trim() || realIp || 'unknown'

    // Hash the IP so we don't store raw IPs in memory
    return createHash('sha256').update(ip).digest('hex').substring(0, 16)
  } catch {
    return 'fallback_global'
  }
}

// ==========================================
// 🔒 RATE LIMITING
// ==========================================
function checkRateLimit(identifier: string): {
  allowed: boolean
  retryAfterSeconds?: number
  remainingAttempts?: number
} {
  cleanupStaleEntries()

  const now = Date.now()
  const record = loginAttempts.get(identifier)

  if (!record) {
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS }
  }

  if (record.lockedUntil && now < record.lockedUntil) {
    const retryAfterSeconds = Math.ceil((record.lockedUntil - now) / 1000)
    return { allowed: false, retryAfterSeconds }
  }

  if (record.lockedUntil && now >= record.lockedUntil) {
    loginAttempts.delete(identifier)
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS }
  }

  if (now - record.firstAttempt > ATTEMPT_WINDOW_MS) {
    loginAttempts.delete(identifier)
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS }
  }

  const remaining = MAX_ATTEMPTS - record.attempts
  return { allowed: remaining > 0, remainingAttempts: Math.max(0, remaining) }
}

function recordFailedAttempt(identifier: string) {
  const now = Date.now()
  const record = loginAttempts.get(identifier)

  if (!record || now - record.firstAttempt > ATTEMPT_WINDOW_MS) {
    loginAttempts.set(identifier, {
      attempts: 1,
      firstAttempt: now,
      lockedUntil: null
    })
    return
  }

  record.attempts++

  if (record.attempts >= MAX_ATTEMPTS) {
    record.lockedUntil = now + LOCKOUT_DURATION_MS
  }

  loginAttempts.set(identifier, record)
}

function clearAttempts(identifier: string) {
  loginAttempts.delete(identifier)
}

// ==========================================
// 🔑 SESSION MANAGEMENT
// ==========================================
function createSession(): string {
  const token = randomBytes(32).toString('hex')
  const now = Date.now()

  activeSessions.set(token, {
    createdAt: now,
    lastActivity: now
  })

  return token
}

function validateSession(token: string): boolean {
  if (!token || typeof token !== 'string') return false

  const session = activeSessions.get(token)
  if (!session) return false

  const now = Date.now()

  if (now - session.createdAt > SESSION_MAX_AGE * 1000) {
    activeSessions.delete(token)
    return false
  }

  if (now - session.lastActivity > SESSION_IDLE_TIMEOUT * 1000) {
    activeSessions.delete(token)
    return false
  }

  // Sliding activity window
  session.lastActivity = now
  activeSessions.set(token, session)

  return true
}

function destroySession(token: string) {
  activeSessions.delete(token)
}

// ==========================================
// 📤 EXPORTED ACTIONS
// ==========================================

export async function loginAction(formData: FormData) {
  const identifier = await getClientIdentifier()

  // 🔒 Check rate limit BEFORE doing anything
  const rateCheck = checkRateLimit(identifier)

  if (!rateCheck.allowed) {
    const minutes = Math.ceil((rateCheck.retryAfterSeconds || 0) / 60)
    return {
      success: false,
      error: `Too many failed attempts. Please try again in ${minutes} minute${minutes === 1 ? '' : 's'}.`,
      locked: true,
      retryAfterSeconds: rateCheck.retryAfterSeconds
    }
  }

  const usernameInput = formData.get('username')
  const passwordInput = formData.get('password')

  // 🔒 Validate inputs exist and are strings
  if (
    !usernameInput ||
    !passwordInput ||
    typeof usernameInput !== 'string' ||
    typeof passwordInput !== 'string'
  ) {
    recordFailedAttempt(identifier)
    return { success: false, error: 'Invalid input.' }
  }

  // 🔒 Enforce reasonable input length limits
  if (usernameInput.length > 200 || passwordInput.length > 200) {
    recordFailedAttempt(identifier)
    return { success: false, error: 'Invalid input.' }
  }

  const validUsername = process.env.ADMIN_USERNAME
  const validPassword = process.env.ADMIN_PASSWORD

  if (!validUsername || !validPassword) {
    console.error('Missing ADMIN_USERNAME or ADMIN_PASSWORD in environment variables.')
    return { success: false, error: 'Server configuration error.' }
  }

  // 🔒 Timing-safe comparisons (prevents timing attacks)
  const usernameMatch = safeCompare(usernameInput, validUsername)
  const passwordMatch = safeCompare(passwordInput, validPassword)

  if (usernameMatch && passwordMatch) {
    // 🔒 Clear failed attempts on success
    clearAttempts(identifier)

    // 🔒 Generate cryptographically random session token
    const sessionToken = createSession()

    const cookieStore = await cookies()
    cookieStore.set('admin_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: SESSION_MAX_AGE
    })

    return { success: true }
  }

  // 🔒 Record the failed attempt
  recordFailedAttempt(identifier)

  // 🔒 Generic error — don't reveal which field was wrong
  const updatedCheck = checkRateLimit(identifier)

  if (!updatedCheck.allowed) {
    return {
      success: false,
      error: 'Too many failed attempts. Login temporarily disabled for 5 minutes.',
      locked: true,
      retryAfterSeconds: updatedCheck.retryAfterSeconds
    }
  }

  return {
    success: false,
    error: `Invalid credentials. ${updatedCheck.remainingAttempts} attempt${updatedCheck.remainingAttempts === 1 ? '' : 's'} remaining.`
  }
}

export async function logoutAction() {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get('admin_session')?.value

  // 🔒 Destroy the session server-side before clearing the cookie
  if (sessionToken) {
    destroySession(sessionToken)
  }

  cookieStore.delete('admin_session')
  redirect('/')
}

export async function validateSessionAction(): Promise<boolean> {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get('admin_session')?.value

  if (!sessionToken) return false

  const isValid = validateSession(sessionToken)

  // 🔒 If session expired or invalid, clean up the cookie too
  if (!isValid) {
    cookieStore.delete('admin_session')
    return false
  }

  return true
}

// Secure way to get the true time directly from the server
export async function getServerTime() {
  return new Date().toISOString()
}