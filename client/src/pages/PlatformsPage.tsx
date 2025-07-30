import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { Plus, Edit, Trash2 } from 'lucide-react'
import { useTranslation } from '../i18n'

interface Platform {
  id: number
  name: string
  api_base_url: string
  api_key: string
  models: string
  admin_url: string
}

export default function PlatformsPage() {
  const { t } = useTranslation()
  const [platforms, setPlatforms] = useState<Platform[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editingPlatform, setEditingPlatform] = useState<Platform | null>(null)
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [errorDetails, setErrorDetails] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    apiBaseUrl: '',
    apiKey: '',
    models: '',
    adminUrl: ''
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPlatforms()
  }, [])

  const fetchPlatforms = async () => {
    try {
      const sessionId = localStorage.getItem('sessionId')
      const response = await axios.get('/api/platforms', {
        headers: { Authorization: `Bearer ${sessionId}` }
      })
      setPlatforms(response.data)
    } catch (error) {
      console.error(t('fetchPlatformsFailed'), error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const sessionId = localStorage.getItem('sessionId')
      const url = editingPlatform ? `/api/platforms/${editingPlatform.id}` : '/api/platforms'
      const method = editingPlatform ? 'put' : 'post'
      
      await axios[method](url, {
        name: formData.name,
        api_base_url: formData.apiBaseUrl,
        api_key: formData.apiKey,
        models: formData.models,
        admin_url: formData.adminUrl
      }, {
        headers: { Authorization: `Bearer ${sessionId}` }
      })
      
      setShowModal(false)
      setEditingPlatform(null)
      setFormData({ name: '', apiBaseUrl: '', apiKey: '', models: '', adminUrl: '' })
      fetchPlatforms()
    } catch (error: any) {
      console.error('保存平台失败:', error)
      const errorMessage = error.response?.data?.details 
        ? `错误: ${error.response.data.error}\n详情: ${JSON.stringify(error.response.data.details, null, 2)}`
        : `错误: ${error.response?.data?.error || '保存平台失败，请检查输入信息'}`
      setErrorDetails(errorMessage)
      setShowErrorModal(true)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm(t('confirmDeletePlatform'))) return
    
    try {
      const sessionId = localStorage.getItem('sessionId')
      await axios.delete(`/api/platforms/${id}`, {
        headers: { Authorization: `Bearer ${sessionId}` }
      })
      fetchPlatforms()
    } catch (error) {
      console.error(t('deletePlatformFailed'), error)
    }
  }

  const openEditModal = (platform: Platform) => {
    setEditingPlatform(platform)
    setFormData({
      name: platform.name,
      apiBaseUrl: platform.api_base_url,
      apiKey: platform.api_key,
      models: platform.models,
      adminUrl: platform.admin_url || ''
    })
    setShowModal(true)
  }

  const openCreateModal = () => {
    setEditingPlatform(null)
    setFormData({ name: '', apiBaseUrl: '', apiKey: '', models: '', adminUrl: '' })
    setShowModal(true)
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">平台管理</h1>
        <button
          onClick={openCreateModal}
          className="btn-primary flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          添加平台
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          {platforms.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">暂无平台数据</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {platforms.map((platform) => (
                <li key={platform.id} className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900">{platform.name}</h3>
                      <div className="mt-2 space-y-1">
                        {platform.admin_url && (
                          <div className="flex items-center">
                            <span className="text-sm font-medium text-gray-600">管理画面：</span>
                            <a 
                              href={platform.admin_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:text-blue-800 underline"
                            >
                              {platform.admin_url}
                            </a>
                            <button
                              onClick={() => navigator.clipboard.writeText(platform.admin_url)}
                              className="ml-2 text-xs text-blue-600 hover:text-blue-800"
                              title="复制管理画面URL"
                            >
                              复制
                            </button>
                          </div>
                        )}
                        
                        <div className="flex items-center">
                          <span className="text-sm font-medium text-gray-600">Base URL：</span>
                          <span className="text-sm text-gray-500 mr-2">{platform.api_base_url}</span>
                          <button
                            onClick={() => navigator.clipboard.writeText(platform.api_base_url)}
                            className="text-xs text-blue-600 hover:text-blue-800"
                            title="复制Base URL"
                          >
                            复制
                          </button>
                        </div>
                        
                        <div className="flex items-center">
                          <span className="text-sm font-medium text-gray-600">API Key：</span>
                          <span className="text-sm text-gray-500 mr-2">••••••••</span>
                          <button
                            onClick={() => navigator.clipboard.writeText(platform.api_key)}
                            className="text-xs text-blue-600 hover:text-blue-800"
                            title="复制API Key"
                          >
                            复制
                          </button>
                        </div>
                        
                        <div className="flex items-center">
                          <span className="text-sm font-medium text-gray-600">模型：</span>
                          <span className="text-sm text-gray-500">{platform.models}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2 ml-4">
                      <button
                        onClick={() => openEditModal(platform)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Edit className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(platform.id)}
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
                {editingPlatform ? t('editPlatform') : t('addPlatform')}
              </h3>
            
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">{t('platformName')}</label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">{t('apiUrl')}</label>
                  <input
                    type="url"
                    required
                    className="input-field"
                    value={formData.apiBaseUrl}
                    onChange={(e) => setFormData({ ...formData, apiBaseUrl: e.target.value })}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">{t('apiKey')}</label>
                  <input
                    type="password"
                    required
                    className="input-field"
                    value={formData.apiKey}
                    onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">{t('modelList')}</label>
                  <input
                    type="text"
                    required
                    placeholder="gpt-3.5-turbo,gpt-4"
                    className="input-field"
                    value={formData.models}
                    onChange={(e) => setFormData({ ...formData, models: e.target.value })}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">{t('adminUrl')}</label>
                  <input
                    type="url"
                    className="input-field"
                    value={formData.adminUrl}
                    onChange={(e) => setFormData({ ...formData, adminUrl: e.target.value })}
                    placeholder="https://example.com"
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
                  {editingPlatform ? t('update') : t('create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 错误提示模态框 */}
      {showErrorModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-medium text-red-900 mb-4">更新失败</h3>
            <div className="bg-gray-50 p-3 rounded mb-4">
              <pre className="text-sm text-gray-800 whitespace-pre-wrap break-words max-h-60 overflow-y-auto">
                {errorDetails}
              </pre>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(errorDetails)
                  alert('错误信息已复制到剪贴板')
                }}
                className="btn-secondary flex-1"
              >
                复制错误信息
              </button>
              <button
                onClick={() => setShowErrorModal(false)}
                className="btn-primary flex-1"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}