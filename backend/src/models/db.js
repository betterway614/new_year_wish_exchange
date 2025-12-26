import initSqlJs from 'sql.js'
import path from 'path'
import fs from 'fs'
import bcrypt from 'bcryptjs'

const dataDir = path.join(process.cwd(), 'data')
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true })
let SQL = null
let db = null
let saveTimeout = null

function getDBPath() {
  const filename = process.env.NODE_ENV === 'test' ? 'cards.test.sqlite' : 'cards.sqlite'
  return path.join(dataDir, filename)
}

// Debounced save to improve performance
function save() {
  if (saveTimeout) clearTimeout(saveTimeout)
  saveTimeout = setTimeout(() => {
    try {
      const data = Buffer.from(db.export())
      fs.writeFileSync(getDBPath(), data)
    } catch (err) {
      console.error('Save failed:', err)
    }
    saveTimeout = null
  }, 1000)
}

function ensureSchema() {
  // Cards Table
  db.run(`
    CREATE TABLE IF NOT EXISTS cards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      uuid TEXT UNIQUE NOT NULL,
      nickname TEXT NOT NULL,
      content TEXT NOT NULL,
      style_id INTEGER NOT NULL DEFAULT 0,
      status INTEGER DEFAULT 0,
      target_card_id INTEGER,
      matched_by_card_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      is_removed BOOLEAN DEFAULT 0
    );
  `)

  // Add new columns if they don't exist
  try { db.run(`ALTER TABLE cards ADD COLUMN weight INTEGER DEFAULT 1`) } catch (e) {}
  try { db.run(`ALTER TABLE cards ADD COLUMN last_match_time DATETIME`) } catch (e) {}
  try { db.run(`ALTER TABLE cards ADD COLUMN match_partner TEXT`) } catch (e) {}
  try { db.run(`ALTER TABLE cards ADD COLUMN target_person TEXT`) } catch (e) {}

  // Admins Table
  db.run(`
    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'admin',
      last_login DATETIME
    );
  `)

  // System Config Table
  db.run(`
    CREATE TABLE IF NOT EXISTS system_config (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `)

  // Match Logs Table
  db.run(`
    CREATE TABLE IF NOT EXISTS match_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_card_id INTEGER,
      target_card_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `)

  // Seed System Bot
  const res = db.exec(`SELECT COUNT(*) AS c FROM cards WHERE uuid='system_bot'`)
  const c = res[0]?.values?.[0]?.[0] || 0
  if (c === 0) {
    const stmt = db.prepare(`
      INSERT INTO cards (uuid, nickname, content, style_id, status, is_removed, weight)
      VALUES (?, ?, ?, ?, ?, ?, 0)
    `)
    stmt.run(['system_bot', '新春小助手', '祝你代码无Bug，上线不回滚！(这是一张系统兜底卡)', 0, 1, 1])
    stmt.free()
    save()
  }

  // Seed Admin
  const adminRes = db.exec(`SELECT COUNT(*) FROM admins WHERE username='admin'`)
  const adminCount = adminRes[0]?.values?.[0]?.[0] || 0
  if (adminCount === 0) {
    const hash = bcrypt.hashSync('admin123', 10)
    db.run(`INSERT INTO admins (username, password_hash, role) VALUES ('admin', '${hash}', 'superadmin')`)
    save()
  }

  // Seed Config
  const configRes = db.exec(`SELECT COUNT(*) FROM system_config WHERE key='matching_enabled'`)
  if (configRes[0]?.values?.[0]?.[0] === 0) {
    db.run(`INSERT INTO system_config (key, value) VALUES ('matching_enabled', 'true')`)
    save()
  }

  try {
    const stmt = db.prepare(`
      SELECT id, target_card_id
      FROM cards
      WHERE status = 1
        AND target_card_id IS NOT NULL
        AND (target_person IS NULL OR target_person = '')
    `)
    const rows = []
    while (stmt.step()) rows.push(stmt.getAsObject())
    stmt.free()

    if (rows.length > 0) {
      const getNick = db.prepare(`SELECT nickname FROM cards WHERE id = ?`)
      const setTarget = db.prepare(`UPDATE cards SET target_person = ? WHERE id = ?`)
      for (const r of rows) {
        const nickObj = getNick.getAsObject([r.target_card_id])
        const nick = nickObj?.nickname || ''
        if (nick) setTarget.run([nick, r.id])
      }
      getNick.free()
      setTarget.free()
      save()
    }
  } catch (e) {}
}

export async function initDB() {
  if (!SQL) SQL = await initSqlJs()
  const dbPath = getDBPath()
  if (fs.existsSync(dbPath)) {
    const filebuffer = fs.readFileSync(dbPath)
    db = new SQL.Database(filebuffer)
  } else {
    db = new SQL.Database()
  }
  ensureSchema()
}

// --- Cards ---
export function insertCard({ uuid, nickname, content, style_id }) {
  const stmt = db.prepare(`
    INSERT INTO cards (uuid, nickname, content, style_id, status, weight)
    VALUES (?, ?, ?, ?, 0, 1)
    ON CONFLICT(uuid) DO UPDATE SET nickname=excluded.nickname, content=excluded.content, style_id=excluded.style_id
  `)
  stmt.run([uuid, nickname, content, style_id])
  stmt.free()
  save()
}

export function findByUUID(uuid) {
  const stmt = db.prepare(`SELECT * FROM cards WHERE uuid = ?`)
  const result = stmt.getAsObject([uuid])
  stmt.free()
  return result && result.uuid ? result : null
}

export function getSystemBot() {
  return findByUUID('system_bot')
}

export function getCandidates(excludeId, requireUnmatched = true) {
  // Logic: Get cards that are NOT removed, and are NOT the user themselves.
  // If requireUnmatched is true, we ONLY return cards where matched_by_card_id IS NULL.
  // If requireUnmatched is false, we return ANYONE (except self), even if they are already matched.
  let query = `
    SELECT * FROM cards 
    WHERE id != ? 
      AND is_removed = 0
  `
  if (requireUnmatched) {
    query += ` AND matched_by_card_id IS NULL`
  } else {
    // If allowing matched users, we should probably exclude those who matched US?
    // No, strictly speaking if A->B, B can give to A. (matched_by_card_id check is enough for Primary)
    // For secondary, we just want valid targets.
    // Ideally we exclude 'system_bot' from being a target for users (unless via fallback logic)
    query += ` AND uuid != 'system_bot'`
  }

  const stmt = db.prepare(query)
  const rows = []
  stmt.bind([excludeId])
  while (stmt.step()) {
    rows.push(stmt.getAsObject())
  }
  stmt.free()
  return rows
}

export function getPool(excludeId) {
  // Backwards compatibility wrapper (default to strict mode)
  return getCandidates(excludeId, true)
}

export function updateMatch(userAId, userBId) {
  const target = getCardById(userBId)
  const now = new Date().toISOString()
  
  // Update User A: Set target to B, status to 1, update last_match_time, and match_partner
  const partnerName = target ? target.nickname : 'Unknown'
  const stmtA = db.prepare(`
    UPDATE cards
    SET target_card_id = ?,
        status = 1,
        last_match_time = ?,
        match_partner = ?,
        target_person = ?
    WHERE id = ?
  `)
  stmtA.run([userBId, now, partnerName, partnerName, userAId])
  stmtA.free()
  
  // Update User B: Set matched_by to A
  if (target && target.uuid !== 'system_bot') {
    const stmtB = db.prepare(`UPDATE cards SET matched_by_card_id = ? WHERE id = ?`)
    stmtB.run([userAId, userBId])
    stmtB.free()
  }

  // Log
  const stmtLog = db.prepare(`INSERT INTO match_logs (user_card_id, target_card_id) VALUES (?, ?)`)
  stmtLog.run([userAId, userBId])
  stmtLog.free()
  
  save()
}

export function getCardById(id) {
  const stmt = db.prepare(`SELECT * FROM cards WHERE id = ?`)
  const r = stmt.getAsObject([id])
  stmt.free()
  return r && r.id ? r : null
}

export function getAllCards(page = 1, limit = 20) {
  const offset = (page - 1) * limit
  const stmt = db.prepare(`
    SELECT
      c.*,
      COALESCE(deliver.nickname, '') AS delivered_to_nickname,
      COALESCE(NULLIF(c.target_person, ''), receive.nickname, '') AS received_from_nickname
    FROM cards c
    LEFT JOIN cards deliver ON deliver.id = c.matched_by_card_id
    LEFT JOIN cards receive ON receive.id = c.target_card_id
    WHERE c.is_removed = 0
    ORDER BY c.created_at DESC
    LIMIT ? OFFSET ?
  `)
  stmt.bind([limit, offset])
  const rows = []
  while (stmt.step()) {
    rows.push(stmt.getAsObject())
  }
  stmt.free()

  const res = db.exec(`SELECT COUNT(*) FROM cards WHERE is_removed=0`)
  const total = res[0]?.values?.[0]?.[0] || 0

  return { rows, total }
}

export function getWallCards(limit = 200) {
  const safeLimit = Math.max(1, Math.min(500, Number(limit) || 200))
  const stmt = db.prepare(`
    SELECT uuid, nickname, content, style_id, created_at
    FROM cards
    WHERE is_removed = 0
      AND uuid != 'system_bot'
    ORDER BY created_at DESC
    LIMIT ?
  `)
  stmt.bind([safeLimit])
  const rows = []
  while (stmt.step()) {
    rows.push(stmt.getAsObject())
  }
  stmt.free()
  return rows
}

export function removeCard(id) {
  db.run(`UPDATE cards SET is_removed=1 WHERE id=${id}`)
  save()
}

export function batchRemoveCards(ids) {
  if (!ids || ids.length === 0) return
  const placeholder = ids.map(() => '?').join(',')
  const stmt = db.prepare(`UPDATE cards SET is_removed=1 WHERE id IN (${placeholder})`)
  stmt.run(ids)
  stmt.free()
  save()
}

export function updateCardContent(id, content) {
  const stmt = db.prepare(`UPDATE cards SET content = ? WHERE id = ?`)
  stmt.run([content, id])
  stmt.free()
  save()
}

// --- Stats ---
export function stats() {
  const resCards = db.exec(`SELECT COUNT(*) FROM cards WHERE is_removed=0`)
  const cardCount = resCards[0]?.values?.[0]?.[0] || 0
  
  const resMatches = db.exec(`SELECT COUNT(*) FROM match_logs`)
  const matchCount = resMatches[0]?.values?.[0]?.[0] || 0

  return { count: cardCount, matches: matchCount }
}

export function getMatchTrend(days = 7) {
  // This is a bit complex in pure SQL.js without date functions depending on version.
  // We can fetch logs and aggregate in JS for simplicity.
  const stmt = db.prepare(`SELECT created_at FROM match_logs`)
  const dates = []
  while(stmt.step()) {
    dates.push(stmt.getAsObject().created_at)
  }
  stmt.free()
  return dates
}

// --- Admin ---
export function findAdminByUsername(username) {
  const stmt = db.prepare(`SELECT * FROM admins WHERE username = ?`)
  const res = stmt.getAsObject([username])
  stmt.free()
  return res && res.id ? res : null
}

export function updateAdminLoginTime(id) {
  const now = new Date().toISOString()
  db.run(`UPDATE admins SET last_login='${now}' WHERE id=${id}`)
  save()
}

// --- Config ---
export function getConfig(key) {
  const stmt = db.prepare(`SELECT value FROM system_config WHERE key = ?`)
  const res = stmt.getAsObject([key])
  stmt.free()
  return res && res.value ? res.value : null
}

export function setConfig(key, value) {
  const stmt = db.prepare(`INSERT OR REPLACE INTO system_config (key, value) VALUES (?, ?)`)
  stmt.run([key, value])
  stmt.free()
  save()
}

// --- Export ---
export function getAllDataForExport() {
  const stmt = db.prepare(`SELECT * FROM cards`)
  const rows = []
  while(stmt.step()) {
    rows.push(stmt.getAsObject())
  }
  stmt.free()
  return rows
}

export function batchImportCards(cards) {
  if (!cards || cards.length === 0) return { success: true, count: 0 }
  
  try {
    db.run('BEGIN TRANSACTION')
    const stmt = db.prepare(`
      INSERT INTO cards (uuid, nickname, content, style_id, status, weight, created_at)
      VALUES (?, ?, ?, ?, 0, 1, ?)
      ON CONFLICT(uuid) DO UPDATE SET 
        nickname=excluded.nickname, 
        content=excluded.content, 
        style_id=excluded.style_id
    `)

    let count = 0
    const now = new Date().toISOString()

    for (const card of cards) {
      // 如果没有 UUID，生成一个随机的
      const uuid = card.uuid || 'imp_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36)
      const nickname = card.nickname || 'Unknown'
      const content = card.content || ''
      const styleId = Number(card.style_id) || 0
      const createdAt = card.created_at || now

      // 简单校验
      if (!content) continue

      stmt.run([uuid, nickname, content, styleId, createdAt])
      count++
    }
    
    stmt.free()
    db.run('COMMIT')
    save()
    return { success: true, count }
  } catch (err) {
    db.run('ROLLBACK')
    console.error('Import Error:', err)
    return { success: false, message: err.message }
  }
}

// === 新增：清空数据库 (保留系统机器人) ===
export function clearDatabase() {
  try {
    db.run('BEGIN TRANSACTION')
    
    // 1. 删除所有匹配日志
    db.run(`DELETE FROM match_logs`)
    
    // 2. 物理删除所有卡片 (除了系统机器人)
    // 注意：这里使用物理删除(DELETE)而不是软删除(is_removed=1)，是为了彻底释放空间和 UUID
    db.run(`DELETE FROM cards WHERE uuid != 'system_bot'`)
    
    // 3. 重置系统机器人的状态（清除它的匹配对象）
    db.run(`UPDATE cards 
            SET status=0, target_card_id=NULL, matched_by_card_id=NULL, match_partner=NULL, last_match_time=NULL 
            WHERE uuid='system_bot'`)

    db.run('COMMIT')
    save()
    return { success: true }
  } catch (err) {
    db.run('ROLLBACK')
    console.error('Clear DB Error:', err)
    return { success: false, message: err.message }
  }
}