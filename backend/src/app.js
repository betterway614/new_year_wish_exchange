import Koa from 'koa'
import Router from 'koa-router'
import bodyParser from 'koa-bodyparser'
import cors from 'koa-cors'
import serve from 'koa-static'
import path from 'path'
import cardRouter from './controllers/card.js'
import adminRouter from './controllers/admin.js'
import { initDB } from './models/db.js'
import filter from './utils/SensitiveFilter.js'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Initialize Sensitive Filter
filter.init()

const app = new Koa()
const router = new Router()

app.use(cors())
app.use(bodyParser())
app.use(router.routes())
app.use(router.allowedMethods())
router.use(cardRouter.routes(), cardRouter.allowedMethods())
router.use(adminRouter.routes(), adminRouter.allowedMethods())

app.use(router.routes())
app.use(router.allowedMethods())

const distDir = join(__dirname, '../../frontend/dist')
app.use(serve(distDir))

const port = process.env.PORT || 3000
initDB().then(() => {
  app.listen(port, '0.0.0.0', () => {
    console.log(`API server running on http://localhost:${port}`)
    console.log(`Network access via: http://<Your-IP>:${port}`)
  })
})
