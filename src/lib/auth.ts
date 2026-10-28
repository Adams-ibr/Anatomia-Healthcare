import { supabase } from './supabase'
import { apiFetch } from './api/client'
import type { User, Session } from '@supabase/supabase-js'

export interface AuthUser {
  id: string
  email: string
  firstName?: string
  lastName?: string
  role: 'student' | 'instructor' | 'admin' | 'support'
  avatar?: string
  permissions?: string[]
  customRoleName?: string
}

export interface AuthSession {
  user: AuthUser
  token: string
}

// Convert Supabase user to our AuthUser format
function mapSupabaseUser(user: User, metadata?: any): AuthUser {
  return {
    id: user.id,
    email: user.email || '',
    firstName: metadata?.first_name || user.user_metadata?.first_name || '',
    lastName: metadata?.last_name || user.user_metadata?.last_name || '',
    role: (metadata?.role || user.user_metadata?.role || 'student') as AuthUser['role'],
    avatar: metadata?.avatar || user.user_metadata?.avatar || ''
  }
}

async function withAccess(user: AuthUser, token: string): Promise<AuthUser> {
  const [accessResult, profileResult] = await Promise.allSettled([
    apiFetch<{ role?: AuthUser['role']; customRoleName?: string; permissions?: string[] }>('/api/auth/me/access', { token }),
    apiFetch<{ user: { name?: string; avatar?: string } }>('/api/auth/me', { token })
  ])
  const access = accessResult.status === 'fulfilled' ? accessResult.value : undefined
  const profile = profileResult.status === 'fulfilled' ? profileResult.value.user : undefined
  const [firstName = '', ...lastName] = (profile?.name ?? '').split(' ')
  return {
    ...user,
    firstName: firstName || user.firstName,
    lastName: lastName.join(' ') || user.lastName,
    avatar: profile?.avatar || user.avatar,
    role: access?.role ?? user.role,
    customRoleName: access?.customRoleName,
    permissions: access?.permissions ?? []
  }
}

// Get current session from Supabase
export async function getCurrentSession(): Promise<AuthSession | null> {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error || !session) return null
    const user = await withAccess(mapSupabaseUser(session.user), session.access_token)
    return {
      user,
      token: session.access_token
    }
  } catch (error) {
    console.error('Error getting session:', error)
    return null
  }
}

// Login with email and password
export async function login(email: string, password: string): Promise<AuthSession> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })
  
  if (error) {
    // Provide more helpful error messages
    if (error.message.includes('Email not confirmed')) {
      throw new Error('Please confirm your email address before signing in. Check your inbox for a verification link.')
    }
    if (error.message.includes('Invalid login credentials')) {
      throw new Error('Invalid email or password. Please try again.')
    }
    throw new Error(error.message || 'Login failed')
  }
  
  if (!data.session || !data.user) {
    throw new Error('No session returned. Please try again.')
  }
  const user = await withAccess(mapSupabaseUser(data.user), data.session.access_token)
  return {
    user,
    token: data.session.access_token
  }
}

// Register new user
export async function register(
  email: string, 
  password: string, 
  options?: {
    firstName?: string
    lastName?: string
    role?: 'student' | 'instructor'
  }
): Promise<AuthSession> {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        first_name: options?.firstName || '',
        last_name: options?.lastName || '',
        role: options?.role || 'student'
      }
    }
  })
  
  if (error) {
    throw new Error(error.message || 'Registration failed')
  }
  
  if (!data.session || !data.user) {
    throw new Error('Registration succeeded but no session was created. Please check your email for confirmation.')
  }
  const user = await withAccess(mapSupabaseUser(data.user), data.session.access_token)
  return {
    user,
    token: data.session.access_token
  }
}

// Logout
export async function logout(): Promise<void> {
  const { error } = await supabase.auth.signOut()
  
  if (error) {
    throw new Error(error.message || 'Logout failed')
  }
}

// Reset password request
export async function requestPasswordReset(email: string): Promise<void> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`
  })
  
  if (error) {
    throw new Error(error.message || 'Password reset request failed')
  }
}

// Update password
export async function updatePassword(newPassword: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({
    password: newPassword
  })
  
  if (error) {
    throw new Error(error.message || 'Password update failed')
  }
}

// Update user profile
export async function updateProfile(updates: {
  firstName?: string
  lastName?: string
  avatar?: string
}): Promise<AuthUser> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Please sign in before updating your profile.')
  if (updates.avatar?.startsWith('data:image/')) {
    throw new Error('Upload profile photos through the avatar upload endpoint.')
  }

  const name = [updates.firstName, updates.lastName].filter(Boolean).join(' ')
  const { user } = await apiFetch<{ user: { name?: string; avatar?: string } }>('/api/auth/profile', {
    method: 'PATCH',
    body: {
      ...(name ? { name } : {}),
      ...(updates.avatar !== undefined ? { avatar: updates.avatar } : {})
    },
    token: session.access_token
  })
  const mapped = mapSupabaseUser(session.user)
  const [firstName = '', ...lastName] = (user.name ?? '').split(' ')
  return {
    ...mapped,
    firstName: firstName || mapped.firstName,
    lastName: lastName.join(' ') || mapped.lastName,
    avatar: user.avatar || mapped.avatar
  }
}

// Listen to auth state changes
export function onAuthStateChange(
  callback: (session: AuthSession | null) => void
) {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    if (session && session.user) {
      void withAccess(mapSupabaseUser(session.user), session.access_token).then((user) => callback({ user, token: session.access_token }))
    } else {
      callback(null)
    }
  })
  
  return subscription
}

// Sign in with Google (OAuth)
export async function signInWithGoogle(next?: string): Promise<void> {
  const callbackUrl = new URL('/auth/callback', window.location.origin)
  if (next?.startsWith('/') && !next.startsWith('//')) {
    callbackUrl.searchParams.set('next', next)
  }

  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: callbackUrl.toString()
    }
  })
  
  if (error) {
    throw new Error(error.message || 'Google sign-in failed')
  }
}
