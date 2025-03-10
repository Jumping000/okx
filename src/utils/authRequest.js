import axios from 'axios'
import { useUserStore } from '@/store/modules/user'
// 创建axios实例
const service = axios.create({
  baseURL: process.env.VUE_APP_API_URL,
  timeout: 60000
})

// 请求拦截器
service.interceptors.request.use(
  config => {
    const userStore = useUserStore()
    if (userStore.token) {
      config.headers['Authorization'] = `Bearer ${userStore.token}`
    }
    return config
  },
  error => {
    console.error('请求错误：', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
service.interceptors.response.use(
  response => {
    const res = response.data
    if (res.error) {
      // 如果响应中包含错误信息
      return Promise.reject(new Error(res.error || '未知错误'))
    }
    return res
  },
  error => {
    console.error('响应错误：', error)
    return Promise.reject(error)
  }
)

export default service 