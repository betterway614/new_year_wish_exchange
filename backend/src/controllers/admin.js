import Router from 'koa-router'
import bcrypt from 'bcryptjs'
import { 
  getAllCards, removeCard, batchRemoveCards, updateCardContent, 
  stats, getCardById, findAdminByUsername, updateAdminLoginTime,
  getConfig, setConfig, getAllDataForExport, getMatchTrend ,batchImportCards,clearDatabase,
  incrementFailedLoginAttempts, isAdminLocked, getLockedUntilMessage, logAdminAction
} from '../models/db.js'
import { signToken } from '../utils/jwt.js'
import { authMiddleware } from '../middleware/auth.js'
import { checkPermission } from '../middleware/rbac.js'

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

  // Check if admin is locked
  if (isAdminLocked(admin)) {
    ctx.status = 401
    ctx.body = { code: 1, message: getLockedUntilMessage(admin) }
    return
  }

  const valid = bcrypt.compareSync(password, admin.password_hash)
  if (!valid) {
    incrementFailedLoginAttempts(admin.id)
    const updatedAdmin = findAdminByUsername(username)
    if (isAdminLocked(updatedAdmin)) {
      ctx.status = 401
      ctx.body = { code: 1, message: getLockedUntilMessage(updatedAdmin) }
    } else {
      const attemptsLeft = 5 - updatedAdmin.failed_login_attempts
      ctx.status = 401
      ctx.body = { code: 1, message: `Invalid credentials, ${attemptsLeft} attempts left` }
    }
    return
  }

  updateAdminLoginTime(admin.id)
  
  // 记录登录事件
  logAdminAction(admin.id, admin.username, 'login', 'admin', { success: true })
  
  const token = signToken({ id: admin.id, username: admin.username, role: admin.role })
  
  ctx.body = { code: 0, data: { token, username: admin.username, role: admin.role } }
})

// Apply Auth Middleware for all routes below
router.use(authMiddleware)

router.get('/cards', checkPermission('cards', 'read'), async ctx => {
  const page = Number(ctx.query.page) || 1
  const limit = Number(ctx.query.limit) || 20
  const result = getAllCards(page, limit)
  ctx.body = { code: 0, data: result }
})

router.get('/stats', checkPermission('stats', 'read'), async ctx => {
  const s = stats()
  const trend = getMatchTrend()
  const matchingEnabled = getConfig('matching_enabled') === 'true'
  ctx.body = { code: 0, data: { ...s, trend, matchingEnabled } }
})

router.delete('/card/:id', checkPermission('cards', 'delete'), async ctx => {
  const id = Number(ctx.params.id)
  if (!id) { 
    ctx.status = 400
    ctx.body = { code: 1, message: 'Invalid ID' }
    return 
  }
  
  removeCard(id)
  
  // 记录删除操作
  logAdminAction(ctx.state.user.id, ctx.state.user.username, 'delete', 'card', { card_id: id })
  
  ctx.body = { code: 0, message: 'ok' }
})

router.post('/cards/delete', checkPermission('cards', 'delete'), async ctx => {
  const { ids, confirm } = ctx.request.body || {}
  if (!Array.isArray(ids)) {
    ctx.status = 400
    ctx.body = { code: 1, message: 'ids must be array' }
    return
  }
  
  // 二次确认机制
  if (confirm !== 'DELETE_CONFIRMED') {
    ctx.status = 400
    ctx.body = { code: 1, message: '请确认删除操作' }
    return
  }
  
  batchRemoveCards(ids)
  
  // 记录批量删除操作
  logAdminAction(ctx.state.user.id, ctx.state.user.username, 'batch_delete', 'cards', { count: ids.length, card_ids: ids })
  
  ctx.body = { code: 0, message: 'ok' }
})

router.put('/card/:id', checkPermission('cards', 'write'), async ctx => {
  const id = Number(ctx.params.id)
  const { content } = ctx.request.body || {}
  if (!id || !content) { 
    ctx.status = 400
    ctx.body = { code: 1, message: 'Invalid request' }
    return 
  }
  
  updateCardContent(id, content)
  
  // 记录更新操作
  logAdminAction(ctx.state.user.id, ctx.state.user.username, 'update', 'card', { card_id: id, action: 'content' })
  
  ctx.body = { code: 0, message: 'ok' }
})

router.get('/config', checkPermission('config', 'read'), async ctx => {
  const val = getConfig('matching_enabled')
  ctx.body = { code: 0, data: { matching_enabled: val === 'true' } }
})

router.post('/config', checkPermission('config', 'write'), async ctx => {
  const { matching_enabled } = ctx.request.body || {}
  setConfig('matching_enabled', String(matching_enabled))
  
  // 记录配置更新操作
  logAdminAction(ctx.state.user.id, ctx.state.user.username, 'update', 'config', { matching_enabled })
  
  ctx.body = { code: 0, message: 'ok' }
})

router.get('/export', checkPermission('cards', 'export'), async ctx => {
  const data = getAllDataForExport()
  // Generate CSV
  const header = ['ID', 'UUID', 'Nickname', 'Content', 'Status', 'Created At']
  const rows = data.map(r => [
    r.id, r.uuid, r.nickname, `"${r.content.replace(/"/g, '""')}"`, 
    r.status === 1 ? 'Matched' : 'Waiting', r.created_at
  ])
  
  const csvContent = '\uFEFF' + [header.join(','), ...rows.map(r => r.join(','))].join('\n')
  
  ctx.set('Content-Type', 'text/csv; charset=utf-8')
  ctx.set('Content-Disposition', 'attachment; filename=wishes_export.csv')
  ctx.body = csvContent
})
// 简易 CSV 解析器 (支持双引号包裹)
function parseCSV(text) {
  // 移除 UTF-8 BOM (如果存在)
  text = text.replace(/^\uFEFF/, '')
  const lines = text.split(/\r?\n/).filter(line => line.trim() !== '')
  if (lines.length < 2) return [] // 至少要有 header 和一行数据

  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, '').toLowerCase())
  const result = []

  // 正则用于匹配 CSV 字段：匹配不在引号内的逗号，或者引号内的内容
  // 这是一个简化的 CSV 正则，能处理大部分标准 CSV
  const regex = /(?:,|\n|^)("(?:(?:"")*|[^"]*)*"|[^",\n]*|(?:\n|$))/g

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]
    // 简单的 split 无法处理带逗号的内容，这里使用简易回退策略：
    // 如果不包含引号，直接 split，否则尝试简单解析（生产环境建议前端解析传 JSON）
    let values = []
    
    if (line.includes('"')) {
       // 简易处理带引号的情况
       let current = ''
       let inQuote = false
       for(let char of line) {
         if(char === '"') { inQuote = !inQuote; continue; }
         if(char === ',' && !inQuote) { values.push(current); current = ''; continue; }
         current += char
       }
       values.push(current)
    } else {
       values = line.split(',')
    }

    const obj = {}
    headers.forEach((header, index) => {
      let val = values[index] ? values[index].trim() : ''
      // 清理 CSV 转义的引号
      val = val.replace(/^"|"$/g, '').replace(/""/g, '"')
      
      // 映射字段名
      if (header === 'id' || header === 'uuid') obj.uuid = val
      else if (header === 'nickname' || header === 'name') obj.nickname = val
      else if (header === 'content' || header === 'wish') obj.content = val
      else if (header === 'style_id' || header === 'style') obj.style_id = val
      else if (header === 'created_at' || header === 'time') obj.created_at = val
    })

    if (obj.content) {
      result.push(obj)
    }
  }
  return result
}

router.post('/import', checkPermission('cards', 'import'), async ctx => {
  const { csv } = ctx.request.body || {}
  
  if (!csv) {
    ctx.status = 400
    ctx.body = { code: 1, message: 'CSV content is required' }
    return
  }

  try {
    const cards = parseCSV(csv)
    if (cards.length === 0) {
      ctx.body = { code: 1, message: 'No valid data parsed from CSV' }
      return
    }

    const result = batchImportCards(cards)
    if (result.success) {
      // 记录导入操作
      logAdminAction(ctx.state.user.id, ctx.state.user.username, 'import', 'cards', { count: result.count })
      ctx.body = { code: 0, data: { count: result.count }, message: `Successfully imported ${result.count} cards` }
    } else {
      ctx.status = 500
      ctx.body = { code: 1, message: result.message || 'Import failed' }
    }
  } catch (e) {
    console.error(e)
    ctx.status = 500
    ctx.body = { code: 1, message: 'Server error during import' }
  }
})

router.post('/reset', checkPermission('system', 'reset'), async ctx => {
  const { confirm, reason } = ctx.request.body || {}
  
  // 严格的二次确认机制
  if (confirm !== 'CONFIRM_RESET_DATABASE' || !reason) {
    ctx.status = 400
    ctx.body = { code: 1, message: '请提供重置原因并确认操作' }
    return
  }
  
  const result = clearDatabase()
  if (result.success) {
    // 记录数据库重置操作
    logAdminAction(ctx.state.user.id, ctx.state.user.username, 'reset', 'database', { reason })
    ctx.body = { code: 0, message: 'Database cleared successfully' }
  } else {
    ctx.status = 500
    ctx.body = { code: 1, message: result.message || 'Failed to clear database' }
  }
})

export default router
