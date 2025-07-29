import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { Plus, Edit, Trash2 } from 'lucide-react'

interface Agent {
  id: number
  name: string
  env_vars: Record<string, string>
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    envVars: ''
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchAgents()
  }, [])

  const fetchAgents = async () => {
    try {
      const sessionId = localStorage.getItem('sessionId')
      const response = await axios.get('/api/agents', {
        headers: { Authorization: `Bearer ${sessionId}` }
      })
      setAgents(response.data)
    } catch (error) {
      console.error('获取Agent列表失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      // 验证JSON格式
      let envVars;
      try {
        envVars = JSON.parse(formData.envVars || '{}')
        // 验证是否为对象
        if (typeof envVars !== 'object' || Array.isArray(envVars) || envVars === null) {
          throw new Error('环境变量必须是JSON对象格式')
        }
      } catch (jsonError) {
        alert(jsonError instanceof Error ? jsonError.message : '环境变量格式错误，请检查JSON格式')
        return
      }

      const sessionId = localStorage.getItem('sessionId')
      const url = editingAgent ? `/api/agents/${editingAgent.id}` : '/api/agents'
      const method = editingAgent ? 'put' : 'post'
      
      await axios[method](url, {
        name: formData.name,
        envVars
      }, {
        headers: { Authorization: `Bearer ${sessionId}` }
      })
      
      setShowModal(false)
      setEditingAgent(null)
      setFormData({ name: '', envVars: '' })
      fetchAgents()
    } catch (error: any) {
      console.error('保存Agent失败:', error)
      const errorMessage = error.response?.data?.error || '保存失败，请重试'
      alert(errorMessage)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这个Agent吗？')) return
    
    try {
      const sessionId = localStorage.getItem('sessionId')
      await axios.delete(`/api/agents/${id}`, {
        headers: { Authorization: `Bearer ${sessionId}` }
      })
      fetchAgents()
    } catch (error) {
      console.error('删除Agent失败:', error)
    }
  }

  const openEditModal = (agent: Agent) => {
    setEditingAgent(agent)
    setFormData({
      name: agent.name,
      envVars: JSON.stringify(agent.env_vars, null, 2)
    })
    setShowModal(true)
  }

  const openCreateModal = () => {
    setEditingAgent(null)
    setFormData({ 
      name: '', 
      envVars: JSON.stringify({
        "CUSTOM_VAR": "$BASE_URL/api/test",
        "API_ENDPOINT": "$API_KEY",
        "MODEL_NAME": "$MODEL"
      }, null, 2)
    })
    setShowModal(true)
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Agent管理</h1>
        <button
          onClick={openCreateModal}
          className="btn-primary flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          添加Agent
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          {agents.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">暂无Agent数据</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {agents.map((agent) => (
                <li key={agent.id} className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900">{agent.name}</h3>
                      <div className="mt-2">
                        <p className="text-sm text-gray-500">环境变量:</p>
                        <pre className="mt-1 text-xs bg-gray-50 p-2 rounded overflow-x-auto">
                          {JSON.stringify(agent.env_vars, null, 2)}
                        </pre>
                      </div>
                    </div>
                    <div className="flex space-x-2 ml-4">
                      <button
                        onClick={() => openEditModal(agent)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Edit className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(agent.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* 模态框 */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {editingAgent ? '编辑Agent' : '添加Agent'}
            </h3>
            
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Agent名称</label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    环境变量 (JSON格式)
                    <span className="text-xs text-gray-500 ml-2">
                      支持占位符: $BASE_URL, $API_KEY, $MODEL
                    </span>
                  </label>
                  <textarea
                    rows={6}
                    required
                    className="input-field font-mono text-sm"
                    value={formData.envVars}
                    onChange={(e) => setFormData({ ...formData, envVars: e.target.value })}
                    placeholder='{"key": "value"}'
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-2 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary"
                >
                  取消
                </button>
                <button type="submit" className="btn-primary">
                  {editingAgent ? '更新' : '创建'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}