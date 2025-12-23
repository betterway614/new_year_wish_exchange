import Router from 'koa-router'
import bcrypt from 'bcryptjs'
import { 
  getAllCards, removeCard, batchRemoveCards, updateCardContent, 
  stats, getCardById, findAdminByUsername, updateAdminLoginTime,
  getConfig, setConfig, getAllDataForExport, getMatchTrend 
} from '../models/db.js'
import { signToken } from '../utils/jwt.js'
import { authMiddleware } from '../middleware/auth.js'

const router = new Router({ prefix: '/api/v1/admin' })

// Login
router.post('/login', async ctx => {
  const { username, password } = ctx.request.body || {}
  if (!username || !password) {
    ctx.status = 400
    ctx.body = { code: 1, message: 'Missing credentials' }
    return
  }

  const admin = findAdminByUsername(username)
  if (!admin) {
    ctx.status = 401
    ctx.body = { code: 1, message: 'Invalid credentials' }
    return
  }

  const valid = bcrypt.compareSync(password, admin.password_hash)
  if (!valid) {
    ctx.status = 401
    ctx.body = { code: 1, message: 'Invalid credentials' }
    return
  }

  updateAdminLoginTime(admin.id)
  const token = signToken({ id: admin.id, username: admin.username, role: admin.role })
  
  ctx.body = { code: 0, data: { token, username: admin.username, role: admin.role } }
})

// Apply Auth Middleware for all routes below
router.use(authMiddleware)

router.get('/cards', async ctx => {
  const page = Number(ctx.query.page) || 1
  const limit = Number(ctx.query.limit) || 20
  const result = getAllCards(page, limit)
  ctx.body = { code: 0, data: result }
})

router.get('/stats', async ctx => {
  const s = stats()
  const trend = getMatchTrend()
  const matchingEnabled = getConfig('matching_enabled') === 'true'
  ctx.body = { code: 0, data: { ...s, trend, matchingEnabled } }
})

router.delete('/card/:id', async ctx => {
  const id = Number(ctx.params.id)
  if (!id) { 
    ctx.status = 400
    ctx.body = { code: 1, message: 'Invalid ID' }
    return 
  }
  removeCard(id)
  ctx.body = { code: 0, message: 'ok' }
})

router.post('/cards/delete', async ctx => {
  const { ids } = ctx.request.body || {}
  if (!Array.isArray(ids)) {
    ctx.status = 400
    ctx.body = { code: 1, message: 'ids must be array' }
    return
  }
  batchRemoveCards(ids)
  ctx.body = { code: 0, message: 'ok' }
})

router.put('/card/:id', async ctx => {
  const id = Number(ctx.params.id)
  const { content } = ctx.request.body || {}
  if (!id || !content) { 
    ctx.status = 400
    ctx.body = { code: 1, message: 'Invalid request' }
    return 
  }
  updateCardContent(id, content)
  ctx.body = { code: 0, message: 'ok' }
})

router.get('/config', async ctx => {
  const val = getConfig('matching_enabled')
  ctx.body = { code: 0, data: { matching_enabled: val === 'true' } }
})

router.post('/config', async ctx => {
  const { matching_enabled } = ctx.request.body || {}
  setConfig('matching_enabled', String(matching_enabled))
  ctx.body = { code: 0, message: 'ok' }
})

router.get('/export', async ctx => {
  const data = getAllDataForExport()
  // Generate CSV
  const header = ['ID', 'UUID', 'Nickname', 'Content', 'Status', 'Created At']
  const rows = data.map(r => [
    r.id, r.uuid, r.nickname, `"${r.content.replace(/"/g, '""')}"`, 
    r.status === 1 ? 'Matched' : 'Waiting', r.created_at
  ])
  
  const csvContent = [header.join(','), ...rows.map(r => r.join(','))].join('\n')
  
  ctx.set('Content-Type', 'text/csv; charset=utf-8')
  ctx.set('Content-Disposition', 'attachment; filename=wishes_export.csv')
  ctx.body = csvContent
})

export default router
