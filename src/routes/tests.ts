import { Hono } from 'hono'
import { Bindings, Variables, User } from '../index'

interface Platform {
  id: number;
  name: string;
  api_base_url: string;
  api_key: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

interface Agent {
  id: number;
  name: string;
  description?: string;
  env_vars?: string | Record<string, any>;
  created_at: string;
  updated_at: string;
}

const tests = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// 中间件：验证会话并获取用户信息
tests.use('*', async (c, next) => {
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
  
  // 将用户信息存储在context中
  const user: User = { id: Number(result.user_id), username: String(result.username) }
  c.set('user', user)
  
  await next()
})

// 生成测试命令
function generateTestCommand(apiBaseUrl: string, apiKey: string, model: string) {
  const url = apiBaseUrl.endsWith('/') ? apiBaseUrl.slice(0, -1) : apiBaseUrl
  return `curl -X POST "${url}/chat/completions" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${apiKey}" \\
  -d '{
    "model": "${model}",
    "messages": [
      {
        "role": "user",
        "content": "你好，请介绍一下你自己"
      }
    ]
  }'`
}

// 获取测试命令
tests.post('/command', async (c) => {
  const { platformId, model } = await c.req.json()
  const user = c.get('user') as User
  
  console.log('收到测试命令请求:', { platformId, model, userId: user.id })
  
  if (!platformId || !model) {
    console.log('缺少必要参数:', { platformId, model })
    return c.json({ error: '缺少必要参数' }, 400)
  }
  
  const platform = await c.env.DB.prepare(`
    SELECT * FROM platforms WHERE id = ? AND user_id = ?
  `).bind(platformId, user.id).first() as Platform | null
  
  if (!platform) {
    return c.json({ error: '平台不存在' }, 404)
  }
  
  const command = generateTestCommand(platform.api_base_url, platform.api_key, model)
  
  return c.json({ command })
})

// 执行API测试
tests.post('/execute', async (c) => {
  const { platformId, model, prompt, variables = {} } = await c.req.json()
  const user = c.get('user') as User

  console.log('收到执行测试请求:', { platformId, model, userId: user.id })
  
  if (!platformId || !model) {
    console.log('缺少必要参数:', { platformId, model })
    return c.json({ error: '缺少必要参数' }, 400)
  }
  
  const platform = await c.env.DB.prepare(`
    SELECT * FROM platforms WHERE id = ? AND user_id = ?
  `).bind(platformId, user.id).first() as Platform | null
  
  if (!platform) {
    return c.json({ error: '平台不存在' }, 404)
  }
  
  try {
    const url = platform.api_base_url.endsWith('/') ? 
      platform.api_base_url.slice(0, -1) : platform.api_base_url
    
    const response = await fetch(`${url}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${platform.api_key}`
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'user',
            content: '你好，请介绍一下你自己'
          }
        ],
        max_tokens: 50
      })
    })
    
    const data = await response.json()
    
    return c.json({
      success: true,
      status: response.status,
      data,
      responseTime: Date.now()
    })
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : '请求失败'
    }, 500)
  }
})

// 生成Agent环境变量
tests.post('/agent-vars', async (c) => {
  const { platformId, model, agentId } = await c.req.json()
  const user = c.get('user') as User
  
  console.log('收到Agent变量请求:', { platformId, model, agentId, userId: user.id })
  
  if (!platformId || !model || !agentId) {
    console.log('缺少必要参数:', { platformId, model, agentId })
    return c.json({ error: '缺少必要参数' }, 400)
  }
  
  const [platform, agent] = await Promise.all([
    c.env.DB.prepare(`SELECT * FROM platforms WHERE id = ? AND user_id = ?`).bind(platformId, user.id).first() as Promise<Platform | null>,
    c.env.DB.prepare(`SELECT * FROM agents WHERE id = ? AND user_id = ?`).bind(agentId, user.id).first() as Promise<Agent | null>
  ])
  
  if (!platform || !agent) {
    return c.json({ error: '平台或Agent不存在' }, 404)
  }
  
  const envVars = typeof agent.env_vars === 'string' ? 
    JSON.parse(agent.env_vars) : agent.env_vars
  
  // 替换占位符
  const resolvedVars = Object.entries(envVars || {}).reduce((acc, [key, value]) => {
    if (typeof value === 'string') {
      acc[key] = value
        .replace(/\$BASE_URL/g, platform.api_base_url)
        .replace(/\$API_KEY/g, platform.api_key)
        .replace(/\$MODEL/g, model)
    } else {
      acc[key] = value
    }
    return acc
  }, {} as Record<string, any>)
  
  return c.json({
    resolvedVars,
    originalVars: envVars
  })
})

export { tests as testRoutes }