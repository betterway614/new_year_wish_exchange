import jwt from 'jsonwebtoken'

const SECRET = process.env.JWT_SECRET || 'best_wish_secret_2025_secure'

export function signToken(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: '24h' })
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, SECRET)
  } catch (e) {
    return null
  }
}
