import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { Settings, Bot, TestTube2 } from 'lucide-react'
import { useTranslation } from '../i18n'

interface Stats {
  platforms: number
  agents: number
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({ platforms: 0, agents: 0 })
  const [loading, setLoading] = useState(true)
  const { t } = useTranslation()

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const sessionId = localStorage.getItem('sessionId')
      const [platformsRes, agentsRes] = await Promise.all([
        axios.get('/api/platforms', {
          headers: { Authorization: `Bearer ${sessionId}` }
        }),
        axios.get('/api/agents', {
          headers: { Authorization: `Bearer ${sessionId}` }
        })
      ])
      
      setStats({
        platforms: platformsRes.data.length,
        agents: agentsRes.data.length
      })
    } catch (error) {
      console.error('获取统计数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const cards = [
    {
      title: t('platformManagement'),
      description: t('platformManagementDesc'),
      count: stats.platforms,
      icon: Settings,
      href: '/platforms',
      color: 'bg-blue-500'
    },
    {
      title: t('agentManagement'),
      description: t('agentManagementDesc'),
      count: stats.agents,
      icon: Bot,
      href: '/agents',
      color: 'bg-green-500'
    },
    {
      title: t('infoGenerator'),
      description: t('infoGeneratorDesc'),
      icon: TestTube2,
      href: '/test',
      color: 'bg-purple-500'
    }
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">仪表盘</h1>
      
      {loading ? (
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((card) => (
            <Link
              key={card.title}
              to={card.href}
              className="block bg-white rounded-lg shadow hover:shadow-md transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-center">
                  <div className={`p-3 rounded-lg ${card.color}`}>
                    <card.icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">{card.title}</h3>
                    <p className="text-sm text-gray-500">{card.description}</p>
                  </div>
                </div>
                {card.count !== undefined && (
                  <div className="mt-4">
                    <p className="text-2xl font-semibold text-gray-900">{card.count}</p>
                    <p className="text-sm text-gray-500">总数</p>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}