
import request from 'supertest'
import Koa from 'koa'
import bodyParser from 'koa-bodyparser'
import router from '../src/controllers/card.js'
import { initDB } from '../src/models/db.js'
import filter from '../src/utils/SensitiveFilter.js'

const app = new Koa()
app.use(bodyParser())
app.use(router.routes())
app.use(router.allowedMethods())

async function main() {
  await initDB()
  
  // Ensure filter is initialized
  filter.init()
  
  // Give it a moment to load the file
  await new Promise(resolve => setTimeout(resolve, 500))

  const agent = request(app.callback())
  const uuid = 'bad_user_' + Date.now()
  
  console.log('Testing sensitive word filtering...')

  // Test 1: Sensitive Nickname
  const res1 = await agent.post('/api/v1/card').send({ 
    uuid: uuid, 
    nickname: '我是习近平', 
    content: '新年快乐', 
    style_id: 1 
  })
  
  if (res1.status !== 400) {
    console.error('Failed: Status should be 400. Got:', res1.status, res1.body)
    throw new Error('Sensitive Nickname Test Failed')
  }
  if (!res1.body.message.includes('包含敏感词') || !res1.body.message.includes('习近')) {
    console.error('Failed: Message should contain "包含敏感词" and "习近". Got:', res1.body.message)
    throw new Error('Sensitive Nickname Test Failed')
  }
  console.log('✓ Sensitive Nickname caught')

  // Test 2: Sensitive Content
  const res2 = await agent.post('/api/v1/card').send({ 
    uuid: uuid, 
    nickname: '正常人', 
    content: '祝你全家死全家', 
    style_id: 1 
  })
  
  if (res2.status !== 400) {
    console.error('Failed: Status should be 400. Got:', res2.status, res2.body)
    throw new Error('Sensitive Content Test Failed')
  }
  if (!res2.body.message.includes('包含敏感词') || !res2.body.message.includes('死全家')) {
    console.error('Failed: Message should contain "包含敏感词" and "死全家". Got:', res2.body.message)
    throw new Error('Sensitive Content Test Failed')
  }
  console.log('✓ Sensitive Content caught')

  // Test 3: Normal Content
  const res3 = await agent.post('/api/v1/card').send({ 
    uuid: uuid, 
    nickname: '正常人', 
    content: '祝你新年快乐，万事如意', 
    style_id: 1 
  })
  
  if (res3.body.code !== 0) {
    console.error('Failed: Should allow normal content. Got:', res3.body)
    throw new Error('Normal Content Test Failed')
  }
  console.log('✓ Normal Content passed')

  // Test 4: New Dictionary Word (Falun Gong)
  const res4 = await agent.post('/api/v1/card').send({ 
    uuid: uuid, 
    nickname: '正常人', 
    content: '祝你练法轮功', 
    style_id: 1 
  })
  
  if (res4.status !== 400) {
    console.error('Failed: Status should be 400. Got:', res4.status, res4.body)
    throw new Error('Sensitive Word Test Failed')
  }
  if (!res4.body.message.includes('包含敏感词') || !res4.body.message.includes('法轮')) {
    console.error('Failed: Message should contain "包含敏感词" and "法轮". Got:', res4.body.message)
    throw new Error('Sensitive Word Test Failed')
  }
  console.log('✓ New Dictionary Word (Falun Gong) caught')
  
  console.log('All Sensitive Word Tests Passed!')
}

main().catch(e => { console.error(e); process.exit(1) })
