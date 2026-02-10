import { supabase } from './supabase.js'
import UserService from '../services/UserService.js'

const userService = new UserService()

export async function authenticateRequest(request) {
  try {
    const authHeader = request.headers.get('authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        success: false,
        error: 'Authorization header missing or invalid',
        status: 401
      }
    }

    const token = authHeader.replace('Bearer ', '')

    // Verify token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (error || !user) {
      return {
        success: false,
        error: 'Invalid or expired token',
        status: 401
      }
    }

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        createdAt: user.created_at,
        lastSignIn: user.last_sign_in_at
      }
    }
  } catch (error) {
    console.error('Authentication error:', error)
    return {
      success: false,
      error: 'Authentication failed',
      status: 500
    }
  }
}

export async function requireAuth(handler) {
  return async (request, context) => {
    const auth = await authenticateRequest(request)

    if (!auth.success) {
      return Response.json(
        { error: auth.error },
        { status: auth.status }
      )
    }

    // Add user to request object
    request.user = auth.user

    return handler(request, context)
  }
}

export { userService }
