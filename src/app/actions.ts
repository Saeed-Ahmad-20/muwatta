'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function loginAction(formData: FormData) {
  const usernameInput = formData.get('username')
  const passwordInput = formData.get('password')

  const validUsername = process.env.ADMIN_USERNAME
  const validPassword = process.env.ADMIN_PASSWORD

  if (!validUsername || !validPassword) {
    console.error("Missing ADMIN_USERNAME or ADMIN_PASSWORD in environment variables.");
    return { success: false, error: 'Server configuration error' }
  }

  if (usernameInput === validUsername && passwordInput === validPassword) {
    const cookieStore = await cookies()
    cookieStore.set('admin_session', 'authenticated', { 
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 7 // 1 week
    })
    return { success: true }
  }
  
  return { success: false, error: 'Invalid credentials' }
}

export async function logoutAction() {
  const cookieStore = await cookies()
  cookieStore.delete('admin_session')
  redirect('/')
}

// NEW: A secure way to get the true time directly from the server
export async function getServerTime() {
  return new Date().toISOString()
}