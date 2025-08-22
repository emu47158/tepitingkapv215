import { Request, Response, NextFunction } from 'express'
import { supabase } from '../index'

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string
    email: string
    role?: string
  }
}

export async function authenticateUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No valid authorization token provided' })
    }

    const token = authHeader.substring(7) // Remove 'Bearer ' prefix

    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' })
    }

    req.user = {
      id: user.id,
      email: user.email || '',
      role: user.user_metadata?.role || 'user'
    }

    next()
  } catch (error) {
    console.error('Authentication error:', error)
    res.status(401).json({ error: 'Authentication failed' })
  }
}

export function optionalAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next() // Continue without user
  }

  authenticateUser(req, res, next)
}
