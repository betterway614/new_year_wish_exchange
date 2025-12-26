import Router from 'koa-router'
import bcrypt from 'bcryptjs'
import { 
  getAllCards, removeCard, batchRemoveCards, updateCardContent, 
  stats, getCardById, findAdminByUsername, updateAdminLoginTime,
  getConfig, setConfig, getAllDataForExport, getMatchTrend ,batchImportCards,clearDatabase
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
// 简易 CSV 解析器 (支持双引号包裹)
function parseCSV(text) {
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

router.post('/import', async ctx => {
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

router.post('/reset', async ctx => {
  // 增加一个简单的二次确认机制（可选，这里直接执行）
  const result = clearDatabase()
  if (result.success) {
    ctx.body = { code: 0, message: 'Database cleared successfully' }
  } else {
    ctx.status = 500
    ctx.body = { code: 1, message: result.message || 'Failed to clear database' }
  }
})

export default router
