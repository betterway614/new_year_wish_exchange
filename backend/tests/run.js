import request from 'supertest'
import Koa from 'koa'
import bodyParser from 'koa-bodyparser'
import router from '../src/controllers/card.js'
import { initDB } from '../src/models/db.js'

const app = new Koa()
app.use(bodyParser())
app.use(router.routes())
app.use(router.allowedMethods())

async function main() {
  await initDB()
  const agent = request(app.callback())
  const u1 = 'u1'+Date.now()
  const u2 = 'u2'+Date.now()
  await agent.post('/api/v1/card').send({ uuid: u1, nickname: '张三', content: '新年快乐', style_id: 1 })
  await agent.post('/api/v1/card').send({ uuid: u2, nickname: '李四', content: '恭喜发财', style_id: 2 })
  const wall = await agent.get('/api/v1/card/wall').query({ limit: 50 })
  if (wall.status !== 200) throw new Error('心愿墙接口异常')
  if (wall.body?.code !== 0) throw new Error('心愿墙接口返回码异常')
  if (!Array.isArray(wall.body?.data)) throw new Error('心愿墙数据格式异常')
  const nicknames = wall.body.data.map(i => i.nickname)
  if (!nicknames.includes('张三') || !nicknames.includes('李四')) throw new Error('心愿墙未包含新增数据')
  const r1 = await agent.get('/api/v1/card/my').query({ uuid: u1 })
  if (r1.body?.data?.status !== 'MATCHED') throw new Error('匹配失败')
  console.log('API test passed')
}
main().catch(e => { console.error(e); process.exit(1) })

