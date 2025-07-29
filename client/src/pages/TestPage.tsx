import { useState, useEffect } from 'react'
import axios from 'axios'

interface Platform {
  id: number
  name: string
  api_base_url: string
  api_key: string
  models: string
  admin_url: string
}

interface Agent {
  id: number
  name: string
  env_vars: Record<string, string>
}

export default function TestPage() {
  const [platforms, setPlatforms] = useState<Platform[]>([])
  const [agents, setAgents] = useState<Agent[]>([])
  const [selectedPlatform, setSelectedPlatform] = useState<number | null>(null)
  const [selectedModel, setSelectedModel] = useState<string>('')
  const [selectedAgent, setSelectedAgent] = useState<number | null>(null)
  const [testCommand, setTestCommand] = useState<string>('')
  const [testResult, setTestResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [resolvedVars, setResolvedVars] = useState<Record<string, string>>({})

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (selectedPlatform && selectedModel) {
      generateTestCommand()
    }
  }, [selectedPlatform, selectedModel])

  useEffect(() => {
    if (selectedPlatform && selectedModel && selectedAgent) {
      resolveAgentVars()
    }
  }, [selectedPlatform, selectedModel, selectedAgent])

  const fetchData = async () => {
    try {
      const sessionId = localStorage.getItem('sessionId')
      if (!sessionId) {
        setError('请先登录')
        return
      }

      const [platformsRes, agentsRes] = await Promise.all([
        axios.get('/api/platforms', {
          headers: { Authorization: `Bearer ${sessionId}` }
        }),
        axios.get('/api/agents', {
          headers: { Authorization: `Bearer ${sessionId}` }
        })
      ])
      
      setPlatforms(platformsRes.data)
      setAgents(agentsRes.data)
    } catch (error: any) {
      console.error('获取数据失败:', error)
      setError(error.response?.data?.error || '获取数据失败')
    }
  }

  const [error, setError] = useState<string>('')

  const generateTestCommand = async () => {
    if (!selectedPlatform || !selectedModel) return
    
    const sessionId = localStorage.getItem('sessionId')
    if (!sessionId) {
      setError('请先登录')
      return
    }

    setError('')
    
    try {
      const response = await axios.post('/api/tests/command', {
        platformId: selectedPlatform,
        model: selectedModel
      }, {
        headers: { Authorization: `Bearer ${sessionId}` }
      })
      
      setTestCommand(response.data.command)
    } catch (error: any) {
      console.error('生成测试命令失败:', error)
      setError(error.response?.data?.error || '生成测试命令失败')
    }
  }

  const resolveAgentVars = async () => {
    if (!selectedPlatform || !selectedModel || !selectedAgent) return
    
    const sessionId = localStorage.getItem('sessionId')
    if (!sessionId) {
      setError('请先登录')
      return
    }

    setError('')
    
    try {
      const response = await axios.post('/api/tests/agent-vars', {
        platformId: selectedPlatform,
        model: selectedModel,
        agentId: selectedAgent
      }, {
        headers: { Authorization: `Bearer ${sessionId}` }
      })
      
      setResolvedVars(response.data.resolvedVars)
    } catch (error: any) {
      console.error('解析Agent变量失败:', error)
      setError(error.response?.data?.error || '解析Agent变量失败')
    }
  }

  const runTest = async () => {
    if (!selectedPlatform || !selectedModel) return
    
    const sessionId = localStorage.getItem('sessionId')
    if (!sessionId) {
      setError('请先登录')
      return
    }

    setError('')
    setLoading(true)
    setTestResult(null)
    
    try {
      const response = await axios.post('/api/tests/execute', {
        platformId: selectedPlatform,
        model: selectedModel
      }, {
        headers: { Authorization: `Bearer ${sessionId}` }
      })
      
      setTestResult(response.data)
    } catch (error: any) {
      console.error('测试失败:', error)
      setError(error.response?.data?.error || '测试失败')
      setTestResult({ success: false, error: error.response?.data?.error || '测试失败' })
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      alert('已复制到剪贴板')
    } catch (error) {
      console.error('复制失败:', error)
      alert('复制失败，请手动复制')
    }
  }

  const selectedPlatformData = platforms.find(p => p.id === selectedPlatform)
  const models = selectedPlatformData?.models?.split(',') || []

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">信息生成器</h1>
      
      <div className="space-y-6">
        {/* 选择区域 */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-medium text-gray-900 mb-4">配置选择</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">平台</label>
              <select
                className="input-field"
                value={selectedPlatform || ''}
                onChange={(e) => {
                  setSelectedPlatform(Number(e.target.value))
                  setSelectedModel('')
                }}
              >
                <option value="">请选择平台</option>
                {platforms.map(platform => (
                  <option key={platform.id} value={platform.id}>
                    {platform.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">模型</label>
              <select
                className="input-field"
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                disabled={!selectedPlatform}
              >
                <option value="">请选择模型</option>
                {models.map(model => (
                  <option key={model.trim()} value={model.trim()}>
                    {model.trim()}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Agent</label>
              <select
                className="input-field"
                value={selectedAgent || ''}
                onChange={(e) => setSelectedAgent(Number(e.target.value))}
              >
                <option value="">请选择Agent</option>
                {agents.map(agent => (
                  <option key={agent.id} value={agent.id}>
                    {agent.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">错误</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 平台详细信息 */}
        {selectedPlatformData && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-medium text-gray-900 mb-4">平台信息</h2>
            <div className="space-y-4">
              {selectedPlatformData.admin_url && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">管理画面</label>
                  <div className="flex items-center space-x-2">
                    <a 
                      href={selectedPlatformData.admin_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-800 underline"
                    >
                      {selectedPlatformData.admin_url}
                    </a>
                    <button
                      onClick={() => copyToClipboard(selectedPlatformData.admin_url)}
                      className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                    >
                      复制
                    </button>
                  </div>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Base URL</label>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-900 font-mono">{selectedPlatformData.api_base_url}</span>
                  <button
                    onClick={() => copyToClipboard(selectedPlatformData.api_base_url)}
                    className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded text-gray-700"
                  >
                    复制
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-900 font-mono">••••••••</span>
                  <button
                    onClick={() => copyToClipboard(selectedPlatformData.api_key)}
                    className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded text-gray-700"
                  >
                    复制
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* API测试命令 */}
        {testCommand && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-medium text-gray-900 mb-4">API测试命令</h2>
            <pre className="bg-gray-50 p-4 rounded overflow-x-auto text-sm">
              {testCommand}
            </pre>
            <button
              onClick={runTest}
              disabled={loading}
              className="btn-primary mt-4"
            >
              {loading ? '测试中...' : '执行测试'}
            </button>
            
            {/* 测试结果 - 显示在命令下方 */}
            {testResult && (
              <div className="mt-4">
                <h3 className="text-md font-medium text-gray-900 mb-2">测试结果</h3>
                <div className={`p-4 rounded ${
                  testResult.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                }`}>
                  <pre className="text-sm overflow-x-auto">
                    {testResult.data?.choices?.[0]?.message ? 
                      JSON.stringify(testResult.data.choices[0].message, null, 2) : 
                      JSON.stringify(testResult.data || testResult, null, 2)
                    }
                  </pre>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Agent环境变量 */}
        {selectedAgent && Object.keys(resolvedVars).length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Agent环境变量</h2>
            <pre className="bg-gray-50 p-4 rounded overflow-x-auto text-sm">
              {Object.entries(resolvedVars).map(([key, value]) => 
                `export ${key}="${value}"`
              ).join('\n')}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}