import React, { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'

interface AuthContextType {
  isAuthenticated: boolean
  login: (username: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const sessionId = localStorage.getItem('sessionId')
    if (sessionId) {
      verifySession(sessionId)
    } else {
      setLoading(false)
    }
  }, [])

  const verifySession = async (sessionId: string) => {
    try {
      const response = await axios.post('/api/auth/verify', { sessionId })
      if (response.data.valid) {
        setIsAuthenticated(true)
      } else {
        localStorage.removeItem('sessionId')
      }
    } catch (error) {
      localStorage.removeItem('sessionId')
    } finally {
      setLoading(false)
    }
  }

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const response = await axios.post('/api/auth/login', { username, password })
      if (response.data.success) {
        localStorage.setItem('sessionId', response.data.sessionId)
        setIsAuthenticated(true)
        return true
      }
      return false
    } catch (error) {
      return false
    }
  }

  const logout = async () => {
    const sessionId = localStorage.getItem('sessionId')
    if (sessionId) {
      try {
        await axios.post('/api/auth/logout', { sessionId })
      } catch (error) {
        // 忽略错误
      }
    }
    localStorage.removeItem('sessionId')
    setIsAuthenticated(false)
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}