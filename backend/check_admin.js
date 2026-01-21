import bcrypt from 'bcryptjs'
import initSqlJs from 'sql.js'
import fs from 'fs'
import path from 'path'

async function checkAdminPassword() {
  try {
    // 初始化 SQL.js
    const SQL = await initSqlJs()
    
    // 获取数据库路径
    const dataDir = path.join(process.cwd(), 'data')
    const dbPath = path.join(dataDir, 'cards.sqlite')
    
    // 读取数据库文件
    if (!fs.existsSync(dbPath)) {
      console.log('数据库文件不存在！')
      return
    }
    
    const filebuffer = fs.readFileSync(dbPath)
    const db = new SQL.Database(filebuffer)
    
    // 查询管理员表
    console.log('查询管理员账户信息...')
    const stmt = db.prepare('SELECT id, username, role FROM admins')
    const admins = []
    
    while (stmt.step()) {
      const admin = stmt.getAsObject()
      admins.push(admin)
    }
    
    stmt.free()
    
    if (admins.length > 0) {
      console.log('管理员账户列表：')
      admins.forEach(admin => {
        console.log(`- ID: ${admin.id}, Username: ${admin.username}, Role: ${admin.role}`)
      })
      
      // 测试默认密码
      console.log('\n测试默认密码...')
      const testPasswords = ['betterway614', 'temp_password', 'admin123']
      
      // 获取admin用户的密码哈希
      const adminStmt = db.prepare('SELECT password_hash FROM admins WHERE username = ?')
      adminStmt.bind(['admin'])
      
      if (adminStmt.step()) {
        const { password_hash } = adminStmt.getAsObject()
        
        console.log('\n测试密码是否匹配：')
        testPasswords.forEach(password => {
          const isMatch = bcrypt.compareSync(password, password_hash)
          console.log(`- 密码 '${password}': ${isMatch ? '✓ 匹配' : '✗ 不匹配'}`)
        })
      } else {
        console.log('未找到admin用户！')
      }
      
      adminStmt.free()
    } else {
      console.log('没有找到管理员账户！')
    }
    
    db.close()
  } catch (error) {
    console.error('检查密码时出错：', error)
  }
}

checkAdminPassword()
