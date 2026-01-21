import { verifyToken } from '../utils/jwt.js'

export async function authMiddleware(ctx, next) {
  const authHeader = ctx.headers['authorization']
  const token = authHeader && authHeader.startsWith('Bearer ') 
    ? authHeader.substring(7) 
    : ctx.headers['x-admin-token']

  if (!token) {
    ctx.status = 401
    ctx.body = { code: 401, message: 'Unauthorized: No token provided' }
    return
  }

  const decoded = verifyToken(token)
  if (!decoded) {
    ctx.status = 401
    ctx.body = { code: 401, message: 'Unauthorized: Invalid token' }
    return
  }

  ctx.state.user = decoded
  await next()
}
