import { Hono } from 'hono'
import { Bindings } from '../index'

const auth = new Hono<{ Bindings: Bindings }>()

// 注册
auth.post('/register', async (c) => {
  const { username, password } = await c.req.json()
  
  if (!username || !password) {
    return c.json({ success: false, message: '用户名和密码不能为空' }, 400)
  }
  
  // 检查用户名是否已存在
  const existing = await c.env.DB.prepare(`
    SELECT id FROM users WHERE username = ?
  `).bind(username).first()
  
  if (existing) {
    return c.json({ success: false, message: '用户名已存在' }, 400)
  }
  
  // 创建新用户
  const hashedPassword = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(password))
    .then(hash => Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join(''))
  
  const result = await c.env.DB.prepare(`
    INSERT INTO users (username, password_hash, created_at)
    VALUES (?, ?, datetime('now'))
  `).bind(username, hashedPassword).run()
  
  const userId = result.meta.last_row_id
  
  return c.json({
    success: true,
    message: '注册成功',
    userId
  })
})

// 登录
auth.post('/login', async (c) => {
  const { username, password } = await c.req.json()
  
  if (!username || !password) {
    return c.json({ success: false, message: '用户名和密码不能为空' }, 400)
  }
  
  // 查找用户
  const user = await c.env.DB.prepare(`
    SELECT id, username, password_hash FROM users WHERE username = ?
  `).bind(username).first()
  
  if (!user) {
    return c.json({ success: false, message: '用户名或密码错误' }, 401)
  }
  
  // 验证密码
  const hashedPassword = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(password))
    .then(hash => Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join(''))
  
  if (hashedPassword !== user.password_hash) {
    return c.json({ success: false, message: '用户名或密码错误' }, 401)
  }
  
  const sessionId = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24小时
  
  await c.env.DB.prepare(`
    INSERT INTO sessions (id, username, expires_at, user_id)
    VALUES (?, ?, ?, ?)
  `).bind(sessionId, username, expiresAt.toISOString(), user.id).run()
  
  return c.json({
    success: true,
    sessionId,
    userId: user.id,
    username: user.username,
    message: '登录成功'
  })
})

// 验证会话
auth.post('/verify', async (c) => {
  const { sessionId } = await c.req.json()
  
  if (!sessionId) {
    return c.json({ valid: false }, 401)
  }
  
  const result = await c.env.DB.prepare(`
    SELECT s.*, u.id as user_id, u.username 
    FROM sessions s
    JOIN users u ON s.user_id = u.id
    WHERE s.id = ? AND s.expires_at > datetime('now')
  `).bind(sessionId).first()
  
  if (result) {
    return c.json({ 
      valid: true, 
      userId: result.user_id,
      username: result.username 
    })
  }
  
  return c.json({ valid: false }, 401)
})

// 登出
auth.post('/logout', async (c) => {
  const { sessionId } = await c.req.json()
  
  if (sessionId) {
    await c.env.DB.prepare('DELETE FROM sessions WHERE id = ?').bind(sessionId).run()
  }
  
  return c.json({ success: true })
})

export { auth as authRoutes }