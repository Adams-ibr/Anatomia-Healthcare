import { Request, Response, NextFunction } from 'express'
import type { User } from '@supabase/supabase-js'
import { supabase } from './supabase'

/**
 * Extract Bearer token from Authorization header
 */
export function bearerToken(req: Request): string | null {
  const header = req.headers.authorization ?? ''
  const match = /^Bearer\s+(.+)$/i.exec(header)
  return match ? match[1] : null
}

/**
 * Get authenticated user from request
 */
export async function authUser(req: Request): Promise<User | null> {
  const token = bearerToken(req)
  if (!token) return null
  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data.user) return null
  return data.user
}

/**
 * Async error handler wrapper
 */
export function handle(
  fn: (req: Request, res: Response) => Promise<unknown>
): (req: Request, res: Response, next: NextFunction) => void {
  return (req, res, next) => {
    fn(req, res).catch(next)
  }
}

/**
 * Send error response
 */
export function err(res: Response, status: number, message: string) {
  return res.status(status).json({ error: message })
}

/**
 * Validate email format
 */
export function isEmail(v: unknown): v is string {
  return typeof v === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
}
