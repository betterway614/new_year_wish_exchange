import initSqlJs from 'sql.js'
import path from 'path'
import fs from 'fs'
import bcrypt from 'bcryptjs'

const dataDir = path.join(process.cwd(), 'data')
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true })
const dbPath = path.join(dataDir, 'cards.sqlite')
let SQL = null
let db = null
let saveTimeout = null

// Debounced save to improve performance
function save() {
  if (saveTimeout) clearTimeout(saveTimeout)
  saveTimeout = setTimeout(() => {
    try {
      const data = Buffer.from(db.export())
      fs.writeFileSync(dbPath, data)
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
}

export async function initDB() {
  if (!SQL) SQL = await initSqlJs()
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
  db.run(`UPDATE cards SET target_card_id=${userBId}, status=1, last_match_time='${now}', match_partner='${partnerName}' WHERE id=${userAId}`)
  
  // Update User B: Set matched_by to A
  if (target && target.uuid !== 'system_bot') {
    db.run(`UPDATE cards SET matched_by_card_id=${userAId} WHERE id=${userBId}`)
  }

  // Log
  db.run(`INSERT INTO match_logs (user_card_id, target_card_id) VALUES (${userAId}, ${userBId})`)
  
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
  const stmt = db.prepare(`SELECT * FROM cards WHERE is_removed=0 ORDER BY created_at DESC LIMIT ? OFFSET ?`)
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
