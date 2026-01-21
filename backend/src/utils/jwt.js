import jwt from 'jsonwebtoken'

// 强制使用环境变量设置JWT密钥
let SECRET = process.env.JWT_SECRET

function getSecret() {
  if (!SECRET) {
    SECRET = process.env.JWT_SECRET
    if (!SECRET) {
      console.error('ERROR: JWT_SECRET environment variable is required')
      process.exit(1)
    }
  }
  return SECRET
}

export function signToken(payload) {
  return jwt.sign(payload, getSecret(), { expiresIn: '24h' })
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, getSecret())
  } catch (e) {
    return null
  }
}
