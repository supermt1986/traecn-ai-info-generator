import { Hono } from 'hono'
import { Bindings, Variables, User } from '../index'

const agents = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// 中间件：验证会话并获取用户信息
agents.use('*', async (c, next) => {
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

// 获取所有Agent
agents.get('/', async (c) => {
  const user = c.get('user')
  const results = await c.env.DB.prepare(`
    SELECT * FROM agents WHERE user_id = ? ORDER BY created_at DESC
  `).bind(user.id).all()
  
  // 解析JSON格式的环境变量
  const agents = results.results.map(agent => ({
    ...agent,
    env_vars: typeof agent.env_vars === 'string' ? JSON.parse(agent.env_vars) : agent.env_vars
  }))
  
  return c.json(agents)
})

// 创建Agent
agents.post('/', async (c) => {
  const { name, envVars } = await c.req.json()
  const user = c.get('user')
  
  if (!name || !envVars) {
    return c.json({ error: '缺少必要字段' }, 400)
  }
  
  try {
    const envVarsJson = JSON.stringify(envVars)
    const result = await c.env.DB.prepare(`
      INSERT INTO agents (name, env_vars, user_id)
      VALUES (?, ?, ?)
    `).bind(name, envVarsJson, user.id).run()
    
    return c.json({ id: result.meta.last_row_id, message: '创建成功' })
  } catch (error) {
    return c.json({ error: 'Agent名称已存在' }, 400)
  }
})

// 更新Agent
agents.put('/:id', async (c) => {
  const id = c.req.param('id')
  const { name, envVars } = await c.req.json()
  const user = c.get('user')
  
  if (!name || !envVars) {
    return c.json({ error: '缺少必要字段' }, 400)
  }
  
  try {
    const envVarsJson = JSON.stringify(envVars)
    const result = await c.env.DB.prepare(`
      UPDATE agents 
      SET name = ?, env_vars = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND user_id = ?
    `).bind(name, envVarsJson, id, user.id).run()
    
    if (result.meta.changes === 0) {
      return c.json({ error: 'Agent不存在或无权限更新' }, 404)
    }
    
    return c.json({ message: '更新成功' })
  } catch (error) {
    console.error('更新Agent失败:', error)
    return c.json({ error: '更新失败' }, 400)
  }
})

// 删除Agent
agents.delete('/:id', async (c) => {
  const id = c.req.param('id')
  const user = c.get('user')
  
  const result = await c.env.DB.prepare('DELETE FROM agents WHERE id = ? AND user_id = ?').bind(id, user.id).run()
  
  if (result.meta.changes === 0) {
    return c.json({ error: 'Agent不存在或无权限删除' }, 404)
  }
  
  return c.json({ message: '删除成功' })
})

export { agents as agentRoutes }