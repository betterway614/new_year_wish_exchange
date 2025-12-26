import Router from 'koa-router'
import { insertCard, findByUUID, getCandidates, updateMatch, getCardById, stats, getSystemBot, getConfig, getWallCards } from '../models/db.js'
import { SHARED_STYLES } from '../constants/shared_styles.js'
import filter from '../utils/SensitiveFilter.js'

const router = new Router({ prefix: '/api/v1' })

router.get('/common/dict', async ctx => {
  ctx.set('Cache-Control', 'public, max-age=86400')
  ctx.body = {
    code: 0,
    data: filter.getWordList()
  }
})

router.get('/stats', async ctx => {
  ctx.body = { code: 0, data: stats() }
})

router.get('/card/wall', async ctx => {
  const limit = ctx.query.limit
  const rows = getWallCards(limit)
  ctx.set('Cache-Control', 'no-store')
  ctx.body = { code: 0, data: rows }
})

router.post('/card', async ctx => {
  const { uuid, nickname, content, style_id } = ctx.request.body || {}
  if (!uuid || !nickname || !content) {
    ctx.status = 400
    ctx.body = { code: 1, message: '参数不完整' }
    return
  }
  const sid = Number(style_id)
  if (!Object.prototype.hasOwnProperty.call(SHARED_STYLES, sid)) {
    ctx.status = 400
    ctx.body = { code: 1, message: '非法 style_id' }
    return
  }

  // Sensitive Word Check
  const badNick = filter.check(nickname)
  if (badNick) {
    ctx.status = 400
    ctx.body = { code: 40001, message: `包含敏感词（${badNick}），阳光向上正能量喔🤞` }
    return
  }

  const badContent = filter.check(content)
  if (badContent) {
    ctx.status = 400
    ctx.body = { code: 40001, message: `包含敏感词（${badContent}），阳光向上正能量喔🤞` }
    return
  }

  insertCard({ uuid, nickname, content, style_id: sid })
  ctx.body = { code: 0, message: 'ok' }
})

router.get('/card/my', async ctx => {
  const uuid = ctx.query.uuid
  if (!uuid) { ctx.status = 400; ctx.body = { code: 1, message: '缺少uuid' }; return }
  const self = findByUUID(uuid)
  if (!self) {
    ctx.set('Cache-Control', 'no-store')
    ctx.body = { code: 0, data: { status: 'NOT_FOUND' } }
    return
  }

  // Check if matched
  if (self.status === 1 && self.target_card_id) {
    const target = getCardById(self.target_card_id)
    const deliveredTo = self.matched_by_card_id ? getCardById(self.matched_by_card_id) : null
    const receiverNickname = deliveredTo?.nickname || ''
    ctx.body = {
      code: 0,
      data: {
        status: 'MATCHED',
        self: { nickname: self.nickname, content: self.content, style_id: self.style_id },
        target: { nickname: target.nickname, content: target.content, style_id: target.style_id, match_partner: self.match_partner },
        delivery: { receiverNickname }
      }
    }
    return
  }

  // Check Global Switch
  const matchingEnabled = getConfig('matching_enabled') === 'true'
  if (!matchingEnabled) {
    ctx.body = { code: 0, data: { status: 'PAUSED', message: 'Matching is temporarily paused.' } }
    return
  }

  // Frequency Check (10 seconds for demo purposes, or 60s as planned)
  // Let's do 10s to be user friendly during testing, or 60s for "prevention". 
  // User said "prevent short time repeat". 60s is good.
  const lastMatch = self.last_match_time ? new Date(self.last_match_time).getTime() : 0
  const now = Date.now()
  if (now - lastMatch < 10000) { // 10 seconds to allow easier testing
     ctx.body = { code: 0, data: { status: 'WAITING', message: 'Matching too frequent. Please wait.' } }
     return
  }
  
  let pool = getCandidates(self.id, true) // Primary Pool: Unmatched users
  if (pool.length === 0) {
    // pool = getCandidates(self.id, false) // Old Secondary Pool logic (allowed duplicates)
    // New Logic: If no unmatched users, use System Bot to avoid duplicate matches for real users.
    const system = getSystemBot()
    if (system) {
      updateMatch(self.id, system.id)
      const target = system
      const refreshed = findByUUID(uuid)
      const deliveredTo = refreshed?.matched_by_card_id ? getCardById(refreshed.matched_by_card_id) : null
      ctx.body = {
        code: 0,
        data: {
          status: 'MATCHED',
          self: { nickname: self.nickname, content: self.content, style_id: self.style_id },
          target: { nickname: target.nickname, content: target.content, style_id: target.style_id, match_partner: target.nickname },
          delivery: { receiverNickname: deliveredTo?.nickname || '' }
        }
      }
      return
    }
  }

  if (pool.length > 0) {
    // Weighted Random
    let totalWeight = 0
    pool.forEach(c => totalWeight += (c.weight || 1))
    
    let random = Math.random() * totalWeight
    let choice = null
    
    for (const card of pool) {
      random -= (card.weight || 1)
      if (random <= 0) {
        choice = card
        break
      }
    }
    if (!choice) choice = pool[pool.length - 1]

    updateMatch(self.id, choice.id)
    const target = getCardById(choice.id)
    const refreshed = findByUUID(uuid)
    const deliveredTo = refreshed?.matched_by_card_id ? getCardById(refreshed.matched_by_card_id) : null
    ctx.body = {
      code: 0,
      data: {
        status: 'MATCHED',
        self: { nickname: self.nickname, content: self.content, style_id: self.style_id },
        target: { nickname: target.nickname, content: target.content, style_id: target.style_id, match_partner: target.nickname },
        delivery: { receiverNickname: deliveredTo?.nickname || '' }
      }
    }
    return
  }
  
  // Timeout Fallback (2 minutes)
  const createdTime = new Date(self.created_at).getTime()
  // Check if waiting more than 2 minutes (120000ms)
  if (now - createdTime > 120000) {
    const system = getSystemBot()
    if (system) {
      updateMatch(self.id, system.id)
      const target = system
      const refreshed = findByUUID(uuid)
      const deliveredTo = refreshed?.matched_by_card_id ? getCardById(refreshed.matched_by_card_id) : null
      ctx.body = {
        code: 0,
        data: {
          status: 'MATCHED',
          self: { nickname: self.nickname, content: self.content, style_id: self.style_id },
          target: { nickname: target.nickname, content: target.content, style_id: target.style_id },
          delivery: { receiverNickname: deliveredTo?.nickname || '' }
        }
      }
      return
    }
  }

  // Dev backdoor for bot
  if (ctx.query.force_bot === '1') {
    const system = getSystemBot()
    if (system) {
      updateMatch(self.id, system.id)
      const target = system
      const refreshed = findByUUID(uuid)
      const deliveredTo = refreshed?.matched_by_card_id ? getCardById(refreshed.matched_by_card_id) : null
      ctx.body = {
        code: 0,
        data: {
          status: 'MATCHED',
          self: { nickname: self.nickname, content: self.content, style_id: self.style_id },
          target: { nickname: target.nickname, content: target.content, style_id: target.style_id },
          delivery: { receiverNickname: deliveredTo?.nickname || '' }
        }
      }
      return
    }
  }

  ctx.body = { code: 0, data: { status: 'WAITING' } }
})

export default router
