import { apiFetch } from './client'
import type { AuthUser, Role } from '../types'

export interface AuthSession {
  user: AuthUser
  token: string
}

const TOKEN_KEY = 'dha:token'

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function storeToken(token: string) {
  try {
    localStorage.setItem(TOKEN_KEY, token)
  } catch {
    /* ignore */
  }
}

export function clearStoredToken() {
  try {
    localStorage.removeItem(TOKEN_KEY)
  } catch {
    /* ignore */
  }
}

export type RegisterRole = Extract<Role, 'student' | 'instructor'>

export const authApi = {
  register(input: { name: string; email: string; password: string; role: RegisterRole }): Promise<AuthSession> {
    return apiFetch<AuthSession>('/api/auth/register', { method: 'POST', body: input })
  },

  login(input: { email: string; password: string }): Promise<AuthSession> {
    return apiFetch<AuthSession>('/api/auth/login', { method: 'POST', body: input })
  },

  logout(token: string | null): Promise<unknown> {
    return apiFetch<unknown>('/api/auth/logout', { method: 'POST', token })
  },

  forgotPassword(email: string): Promise<{ message?: string }> {
    return apiFetch<{ message?: string }>('/api/auth/forgot-password', { method: 'POST', body: { email } })
  },

  resetPassword(input: { token: string; password: string }): Promise<{ message?: string }> {
    return apiFetch<{ message?: string }>('/api/auth/reset-password', { method: 'POST', body: input })
  },

  verifyEmail(token: string): Promise<{ message?: string }> {
    return apiFetch<{ message?: string }>('/api/auth/verify-email', { method: 'POST', body: { token } })
  },

  me(token: string): Promise<{ user: AuthUser }> {
    return apiFetch<{ user: AuthUser }>('/api/auth/me', { token })
  },

  updateProfile(token: string, patch: Partial<AuthUser>): Promise<{ user: AuthUser }> {
    return apiFetch<{ user: AuthUser }>('/api/auth/profile', { method: 'PATCH', body: patch, token })
  },

  changePassword(token: string, input: { currentPassword: string; newPassword: string }): Promise<{ message?: string }> {
    return apiFetch<{ message?: string }>('/api/auth/change-password', { method: 'POST', body: input, token })
  },

  deleteAccount(token: string): Promise<unknown> {
    return apiFetch<unknown>('/api/auth/account', { method: 'DELETE', token })
  }
}