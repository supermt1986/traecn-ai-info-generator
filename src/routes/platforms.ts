import { Hono } from 'hono'
import { Bindings, Variables, User } from '../index'

const platforms = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// 中间件：验证会话并获取用户信息
platforms.use('*', async (c, next) => {
  const sessionId = c.req.header('Authorization')?.replace('Bearer ', '')
  
  if (!sessionId) {
    return c.json({ error: '未授权访问' }, 401)
  }
  
  const result = await c.env.DB.prepare(`
    SELECT s.*, u.id as user_id, u.username 
    FROM sessions s
    JOIN users u ON s.user_id = u.id
    WHERE s.id = ? AND s.expires_at > datetime('now')
  `).bind(sessionId).first()
  
  if (!result) {
    return c.json({ error: '会话已过期' }, 401)
  }
  
  c.set('user', {
    id: Number(result.user_id),
    username: String(result.username)
  })
  
  await next()
})

// 获取所有平台
platforms.get('/', async (c) => {
  const user = c.get('user')
  const results = await c.env.DB.prepare(`
    SELECT * FROM platforms WHERE user_id = ? ORDER BY created_at DESC
  `).bind(user.id).all()
  
  return c.json(results.results)
})

// 创建平台
platforms.post('/', async (c) => {
  const { name, api_base_url, api_key, models, admin_url } = await c.req.json()
  const user = c.get('user')
  
  if (!name || !api_base_url || !api_key || !models) {
    return c.json({ error: '缺少必要字段' }, 400)
  }
  
  try {
    const result = await c.env.DB.prepare(`
      INSERT INTO platforms (name, api_base_url, api_key, models, admin_url, user_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(name, api_base_url, api_key, models, admin_url, user.id).run()
    
    return c.json({ id: result.meta.last_row_id, message: '创建成功' })
  } catch (error) {
    return c.json({ error: '平台名称已存在' }, 400)
  }
})

// 更新平台
platforms.put('/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()
  const user = c.get('user')
  
  console.log('收到更新请求:', { id, body, userId: user.id })
  
  const { name, api_base_url, api_key, models, admin_url } = body
  
  if (!name || !api_base_url || !api_key || !models) {
    console.error('缺少必要字段:', { name, api_base_url, api_key, models })
    return c.json({ error: '缺少必要字段', details: { name: !!name, api_base_url: !!api_base_url, api_key: !!api_key, models: !!models } }, 400)
  }
  
  try {
    // 检查平台是否存在且属于当前用户
    const existing = await c.env.DB.prepare(`SELECT id FROM platforms WHERE id = ? AND user_id = ?`).bind(id, user.id).first()
    if (!existing) {
      return c.json({ error: '平台不存在' }, 404)
    }
    
    const result = await c.env.DB.prepare(`
      UPDATE platforms 
      SET name = ?, api_base_url = ?, api_key = ?, models = ?, admin_url = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND user_id = ?
    `).bind(name, api_base_url, api_key, models, admin_url || null, id, user.id).run()
    
    console.log('更新结果:', result)
    
    if (result.meta.changes === 0) {
      return c.json({ error: '更新失败，未找到匹配记录' }, 400)
    }
    
    return c.json({ message: '更新成功', id })
  } catch (error) {
      console.error('更新平台失败:', error)
      const errorMessage = error instanceof Error ? error.message : String(error)
      return c.json({ error: '更新失败', details: errorMessage }, 400)
    }
})

// 删除平台
platforms.delete('/:id', async (c) => {
  const id = c.req.param('id')
  const user = c.get('user')
  
  const result = await c.env.DB.prepare('DELETE FROM platforms WHERE id = ? AND user_id = ?').bind(id, user.id).run()
  
  if (result.meta.changes === 0) {
    return c.json({ error: '平台不存在或无权限删除' }, 404)
  }
  
  return c.json({ message: '删除成功' })
})

export { platforms as platformRoutes }