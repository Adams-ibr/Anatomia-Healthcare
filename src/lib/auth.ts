import { supabase } from './supabase'
import type { User, Session } from '@supabase/supabase-js'

export interface AuthUser {
  id: string
  email: string
  firstName?: string
  lastName?: string
  role: 'student' | 'instructor' | 'admin' | 'support'
  avatar?: string
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

// Get current session from Supabase
export async function getCurrentSession(): Promise<AuthSession | null> {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error || !session) return null
    
    return {
      user: mapSupabaseUser(session.user),
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
    throw new Error(error.message || 'Login failed')
  }
  
  if (!data.session || !data.user) {
    throw new Error('No session returned')
  }
  
  return {
    user: mapSupabaseUser(data.user),
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
  
  return {
    user: mapSupabaseUser(data.user),
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
  const { data, error } = await supabase.auth.updateUser({
    data: {
      first_name: updates.firstName,
      last_name: updates.lastName,
      avatar: updates.avatar
    }
  })
  
  if (error) {
    throw new Error(error.message || 'Profile update failed')
  }
  
  if (!data.user) {
    throw new Error('No user returned after update')
  }
  
  return mapSupabaseUser(data.user)
}

// Listen to auth state changes
export function onAuthStateChange(
  callback: (session: AuthSession | null) => void
) {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    if (session && session.user) {
      callback({
        user: mapSupabaseUser(session.user),
        token: session.access_token
      })
    } else {
      callback(null)
    }
  })
  
  return subscription
}

// Sign in with Google (OAuth)
export async function signInWithGoogle(): Promise<void> {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`
    }
  })
  
  if (error) {
    throw new Error(error.message || 'Google sign-in failed')
  }
}
