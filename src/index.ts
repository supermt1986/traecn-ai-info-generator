import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { authRoutes } from './routes/auth'
import { platformRoutes } from './routes/platforms'
import { agentRoutes } from './routes/agents'
import { testRoutes } from './routes/tests'

export interface User {
  id: number
  username: string
}

export type Bindings = {
  DB: D1Database
  ADMIN_USERNAME: string
  ADMIN_PASSWORD: string
  ASSETS: any
}

export type Variables = {
  user: User
}

const app = new Hono<{ Bindings: Bindings }>()

app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowHeaders: ['Content-Type', 'Authorization'],
}))

app.use('*', logger())

// API路由
app.route('/api/auth', authRoutes)
app.route('/api/platforms', platformRoutes)
app.route('/api/agents', agentRoutes)
app.route('/api/tests', testRoutes)

// SPAフォールバックルーティング - React Router対応
app.get('*', async (c) => {
  // APIリクエストは404を返す
  if (c.req.path.startsWith('/api/')) {
    return c.notFound()
  }
  
  // 静的ファイルを直接提供し、存在しない場合はindex.htmlを返す
  try {
    const assetResponse = await c.env.ASSETS.fetch(c.req.raw)
    
    // ファイルが存在する場合はそのまま返す
    if (assetResponse.status === 200) {
      return assetResponse
    }
    
    // 404の場合はindex.htmlを返してReact Routerに任せる
    if (assetResponse.status === 404) {
      const indexRequest = new Request(new URL('/index.html', c.req.url), c.req.raw)
      return c.env.ASSETS.fetch(indexRequest)
    }
    
    return assetResponse
  } catch (error) {
    // エラー時はindex.htmlを返す
    const indexRequest = new Request(new URL('/index.html', c.req.url), c.req.raw)
    return c.env.ASSETS.fetch(indexRequest)
  }
})

export default app