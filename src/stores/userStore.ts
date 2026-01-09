import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authAPI } from '../services/api'

interface User {
  id: string
  username: string
  avatar?: string
  isTestUser?: boolean
}

interface UserState {
  user: User | null
  isLoggedIn: boolean
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
  setTestUser: () => void
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      isLoggedIn: false,
      
      login: async (username: string, password: string) => {
        try {
          const res = await authAPI.login(username, password)
          set({
            user: {
              id: String(res.user.id),
              username: res.user.username,
            },
            isLoggedIn: true
          })
          return true
        } catch {
          return false
        }
      },
      
      logout: () => {
        authAPI.logout()
        set({
          user: null,
          isLoggedIn: false
        })
      },
      
      setTestUser: async () => {
        // 开发环境快速登录：确保测试用户存在并登录以获取后端JWT
        const username = '测试用户1'
        const password = 'test123'
        try {
          // 尝试注册（若已存在会失败，忽略错误）
          await authAPI.register(username, password).catch(() => {})
          const res = await authAPI.login(username, password)
          set({
            user: {
              id: String(res.user.id),
              username: res.user.username,
              isTestUser: true
            },
            isLoggedIn: true
          })
        } catch {
          // 忽略错误，保持未登录状态
        }
      }
    }),
    {
      name: 'user-storage',
      partialize: (state) => ({
        user: state.user,
        isLoggedIn: state.isLoggedIn
      })
    }
  )
)
