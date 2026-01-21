import bcrypt from 'bcryptjs'
import initSqlJs from 'sql.js'
import fs from 'fs'
import path from 'path'

// 新密码
const newPassword = 'betterway614'

async function changeAdminPassword() {
  try {
    // 初始化 SQL.js
    const SQL = await initSqlJs()
    
    // 获取数据库路径（直接访问根目录的data目录，因为Docker卷挂载在这里）
    const dataDir = path.join(process.cwd(), '..', 'data')
    
    // 确保data目录存在
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true })
    }
    
    const dbPath = path.join(dataDir, 'cards.sqlite')
    
    // 读取或创建数据库文件
    let db
    if (fs.existsSync(dbPath)) {
      const filebuffer = fs.readFileSync(dbPath)
      db = new SQL.Database(filebuffer)
    } else {
      console.log('数据库文件不存在，正在创建新数据库...')
      db = new SQL.Database()
      
      // 初始化数据库结构（只创建需要的表和数据）
      console.log('初始化数据库表...')
      
      // 创建管理员表
      db.run(`
        CREATE TABLE IF NOT EXISTS admins (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          role TEXT DEFAULT 'admin',
          last_login DATETIME,
          failed_login_attempts INTEGER DEFAULT 0,
          locked_until DATETIME
        );
      `)
      
      // 创建默认管理员账户（使用临时密码）
      const tempHash = bcrypt.hashSync('temp_password', bcrypt.genSaltSync(10))
      db.run(`INSERT INTO admins (username, password_hash, role) VALUES ('admin', '${tempHash}', 'superadmin')`)
      
      // 保存初始数据库
      const initialData = Buffer.from(db.export())
      fs.writeFileSync(dbPath, initialData)
      console.log('数据库初始化完成！')
    }
    
    // 生成新密码哈希
    const salt = bcrypt.genSaltSync(10)
    const hash = bcrypt.hashSync(newPassword, salt)
    
    // 更新管理员密码
    const stmt = db.prepare(`UPDATE admins SET password_hash = ? WHERE username = 'admin'`)
    const result = stmt.run([hash])
    stmt.free()
    
    // 检查是否更新成功
    if (result.changes === 0) {
      console.log('管理员账户不存在，正在创建新的管理员账户...')
      const stmtInsert = db.prepare(`INSERT INTO admins (username, password_hash, role) VALUES (?, ?, ?)`)
      stmtInsert.run(['admin', hash, 'superadmin'])
      stmtInsert.free()
    }
    
    // 保存数据库更改
    const data = Buffer.from(db.export())
    fs.writeFileSync(dbPath, data)
    
    console.log('管理员密码修改成功！')
    console.log('用户名：admin')
    console.log('新密码：', newPassword)
    
    db.close()
  } catch (error) {
    console.error('修改密码时出错：', error)
    process.exit(1)
  }
}

changeAdminPassword()