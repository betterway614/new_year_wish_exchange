import request from 'supertest'
import Koa from 'koa'
import bodyParser from 'koa-bodyparser'
import router from '../src/controllers/card.js'
import { initDB } from '../src/models/db.js'
import fs from 'fs'
import path from 'path'
import initSqlJs from 'sql.js'

const app = new Koa()
app.use(bodyParser())
app.use(router.routes())
app.use(router.allowedMethods())

async function main() {
  process.env.NODE_ENV = 'test'
  const testDbPath = path.join(process.cwd(), 'data', 'cards.test.sqlite')
  try { if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath) } catch (e) {}

  await initDB()
  const agent = request(app.callback())
  const u1 = 'u1' + Date.now()
  await agent.post('/api/v1/card').send({ uuid: u1, nickname: '张三', content: '新年快乐', style_id: 1 })
  const wall = await agent.get('/api/v1/card/wall').query({ limit: 50 })
  if (wall.status !== 200) throw new Error('心愿墙接口异常')
  if (wall.body?.code !== 0) throw new Error('心愿墙接口返回码异常')
  if (!Array.isArray(wall.body?.data)) throw new Error('心愿墙数据格式异常')
  const nicknames = wall.body.data.map(i => i.nickname)
  if (!nicknames.includes('张三')) throw new Error('心愿墙未包含新增数据')
  const r1 = await agent.get('/api/v1/card/my').query({ uuid: u1 })
  if (r1.body?.data?.status !== 'MATCHED') throw new Error('匹配失败')
  const receiverNickname = r1.body?.data?.delivery?.receiverNickname
  if (receiverNickname) throw new Error('delivery.receiverNickname 异常')

  const u2 = 'u2' + Date.now()
  await agent.post('/api/v1/card').send({ uuid: u2, nickname: '李四', content: '新年快乐', style_id: 1 })
  const r2 = await agent.get('/api/v1/card/my').query({ uuid: u2 })
  if (r2.body?.data?.status !== 'MATCHED') throw new Error('第二个用户匹配失败')

  const r1Again = await agent.get('/api/v1/card/my').query({ uuid: u1 })
  if (r1Again.body?.data?.status !== 'MATCHED') throw new Error('首次用户匹配状态异常')
  const deliveredToNickname = r1Again.body?.data?.delivery?.receiverNickname
  if (deliveredToNickname !== '李四') throw new Error('delivery.receiverNickname 送达对象异常')

  await new Promise(resolve => setTimeout(resolve, 1200))
  const SQL = await initSqlJs()
  const filebuffer = fs.readFileSync(testDbPath)
  const db = new SQL.Database(filebuffer)
  const stmt = db.prepare(`SELECT target_person FROM cards WHERE uuid = ?`)
  const row = stmt.getAsObject([u1])
  stmt.free()
  db.close()
  if (row?.target_person !== '新春小助手') throw new Error('数据库 target_person 未正确写入')
  console.log('API test passed')
}
main().catch(e => { console.error(e); process.exit(1) })
