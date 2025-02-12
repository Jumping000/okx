import { defineStore } from 'pinia'
import { login, getUserInfo } from '@/api/auth'

export const useUserStore = defineStore('user', {
  state: () => ({
    token: localStorage.getItem('token') || '',
    userInfo: null,
    isLoading: false
  }),

  getters: {
    isLoggedIn: (state) => !!state.token,
    username: (state) => state.userInfo?.username
  },

  actions: {
    // 设置token
    setToken(token) {
      this.token = token
      localStorage.setItem('token', token)
    },

    // 清除token
    clearToken() {
      this.token = ''
      localStorage.removeItem('token')
    },

    // 设置用户信息
    setUserInfo(info) {
      this.userInfo = info
    },

    // 登录
    async loginAction(loginData) {
      this.isLoading = true
      try {
        const res = await login(loginData)
        if (res.success && res.token) {
          this.setToken(res.token)
          if (res.user) {
            this.setUserInfo(res.user)
          }
          // 登录成功后获取最新的用户信息
          await this.getUserInfoAction()
          return true
        }
        return false
      } catch (error) {
        console.error('登录失败：', error)
        return false
      } finally {
        this.isLoading = false
      }
    },

    // 获取用户信息
    async getUserInfoAction() {
      try {
        const res = await getUserInfo()
        this.setUserInfo(res)
        return true
      } catch (error) {
        console.error('获取用户信息失败：', error)
        return false
      }
    },

    // 登出
    logout() {
      this.clearToken()
      this.setUserInfo(null)
    }
  }
}) 