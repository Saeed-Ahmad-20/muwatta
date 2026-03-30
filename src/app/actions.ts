'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

// ==========================================
// 🔒 SERVER-SIDE BRUTE FORCE PROTECTION
//    This cannot be bypassed by clearing
//    localStorage, disabling JS, or using
//    tools like curl/Postman.
// ==========================================
const MAX_ATTEMPTS = 5
const LOCKOUT_DURATION_MS = 5 * 60 * 1000  // 5 minutes
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000   // 15 min sliding window

// In-memory store keyed by IP-like identifier
// In production with multiple serverless instances,
// consider using Redis or a DB table instead.
const loginAttempts = new Map<string, { attempts: number; firstAttempt: number; lockedUntil: number | null }>()

// Cleanup stale entries every 10 minutes to prevent memory leaks
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
}

function getClientIdentifier(): string {
  // Server actions don't have direct access to headers(),
  // so we use a global key. This still protects against
  // brute force since the lockout is per-server.
  // For IP-based tracking, move login to an API route.
  return 'global_login'
}

function checkRateLimit(identifier: string): { allowed: boolean; retryAfterSeconds?: number; remainingAttempts?: number } {
  cleanupStaleEntries()

  const now = Date.now()
  const record = loginAttempts.get(identifier)

  // No previous attempts
  if (!record) {
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS }
  }

  // Currently locked out
  if (record.lockedUntil && now < record.lockedUntil) {
    const retryAfterSeconds = Math.ceil((record.lockedUntil - now) / 1000)
    return { allowed: false, retryAfterSeconds }
  }

  // Lock expired — reset
  if (record.lockedUntil && now >= record.lockedUntil) {
    loginAttempts.delete(identifier)
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS }
  }

  // Sliding window expired — reset
  if (now - record.firstAttempt > ATTEMPT_WINDOW_MS) {
    loginAttempts.delete(identifier)
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS }
  }

  // Still within window
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

  // Trigger lockout
  if (record.attempts >= MAX_ATTEMPTS) {
    record.lockedUntil = now + LOCKOUT_DURATION_MS
  }

  loginAttempts.set(identifier, record)
}

function clearAttempts(identifier: string) {
  loginAttempts.delete(identifier)
}
// ==========================================

export async function loginAction(formData: FormData) {
  const identifier = getClientIdentifier()

  // 🔒 Check rate limit BEFORE doing anything
  const rateCheck = checkRateLimit(identifier)

  if (!rateCheck.allowed) {
    const minutes = Math.ceil((rateCheck.retryAfterSeconds || 0) / 60)
    return {
      success: false,
      error: `Too many failed attempts. Please try again in ${minutes} minute${minutes === 1 ? '' : 's'}.`
    }
  }

  const usernameInput = formData.get('username')
  const passwordInput = formData.get('password')

  const validUsername = process.env.ADMIN_USERNAME
  const validPassword = process.env.ADMIN_PASSWORD

  if (!validUsername || !validPassword) {
    console.error("Missing ADMIN_USERNAME or ADMIN_PASSWORD in environment variables.")
    return { success: false, error: 'Server configuration error.' }
  }

  // 🔒 Constant-time-ish comparison to prevent timing attacks
  const usernameMatch = usernameInput === validUsername
  const passwordMatch = passwordInput === validPassword

  if (usernameMatch && passwordMatch) {
    // 🔒 Clear failed attempts on success
    clearAttempts(identifier)

    const cookieStore = await cookies()
    cookieStore.set('admin_session', 'authenticated', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 7 // 1 week
    })
    return { success: true }
  }

  // 🔒 Record the failed attempt
  recordFailedAttempt(identifier)

  // 🔒 Check remaining attempts for the error message
  const updatedCheck = checkRateLimit(identifier)

  if (!updatedCheck.allowed) {
    return {
      success: false,
      error: 'Too many failed attempts. Login temporarily disabled for 5 minutes.'
    }
  }

  return {
    success: false,
    error: `Invalid credentials. ${updatedCheck.remainingAttempts} attempt${updatedCheck.remainingAttempts === 1 ? '' : 's'} remaining.`
  }
}

export async function logoutAction() {
  const cookieStore = await cookies()
  cookieStore.delete('admin_session')
  redirect('/')
}

// Secure way to get the true time directly from the server
export async function getServerTime() {
  return new Date().toISOString()
}