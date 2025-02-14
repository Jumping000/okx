<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
    <div class="max-w-md w-full space-y-8 p-8 bg-white rounded-xl shadow-lg transform transition-all hover:scale-105">
      <div class="text-center">
        <div class="flex justify-center">
          <div class="w-20 h-20 bg-indigo-600 rounded-full flex items-center justify-center">
            <svg class="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
            </svg>
          </div>
        </div>
        <h2 class="mt-6 text-3xl font-extrabold text-gray-900">登录账户</h2>
        <p class="mt-2 text-sm text-gray-600">
          开启您的交易之旅
        </p>
      </div>
      
      <form class="mt-8 space-y-6" @submit.prevent="handleSubmit">
        <div class="rounded-md space-y-4">
          <div class="group">
            <label for="username" class="block text-sm font-medium text-gray-700">用户名</label>
            <div class="mt-1 relative">
              <input
                id="username"
                v-model="formData.username"
                name="username"
                type="text"
                required
                class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all"
                placeholder="请输入用户名"
              />
              <span class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 group-focus-within:text-indigo-500">
                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </span>
            </div>
          </div>
          
          <div class="group">
            <label for="password" class="block text-sm font-medium text-gray-700">密码</label>
            <div class="mt-1 relative">
              <input
                id="password"
                v-model="formData.password"
                name="password"
                type="password"
                required
                class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all"
                placeholder="请输入密码"
              />
              <span class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 group-focus-within:text-indigo-500">
                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </span>
            </div>
          </div>
          
          <div class="group">
            <label for="captcha" class="block text-sm font-medium text-gray-700">验证码</label>
            <div class="mt-1 flex space-x-2">
              <div class="relative flex-1">
                <input
                  id="captcha"
                  v-model="formData.captcha"
                  name="captcha"
                  type="text"
                  required
                  class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all"
                  placeholder="请输入验证码"
                />
              </div>
              <div class="flex-shrink-0">
                <img
                  v-if="captchaImage"
                  :src="captchaImage"
                  alt="验证码"
                  class="h-10 rounded cursor-pointer hover:opacity-80 transition-opacity"
                  @click="refreshCaptcha"
                />
              </div>
            </div>
          </div>
        </div>

        <div class="flex items-center justify-between">
          <div class="text-sm">
            <router-link to="/auth/register" class="font-medium text-indigo-600 hover:text-indigo-500 transition-colors">
              还没有账户？立即注册
            </router-link>
          </div>
        </div>

        <div>
          <button
            type="submit"
            :disabled="loading"
            class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
          >
            <span class="absolute left-0 inset-y-0 flex items-center pl-3">
              <svg
                v-if="!loading"
                class="h-5 w-5 text-indigo-500 group-hover:text-indigo-400 transition-colors"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fill-rule="evenodd"
                  d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                  clip-rule="evenodd"
                />
              </svg>
              <svg
                v-else
                class="animate-spin h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                ></circle>
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            </span>
            {{ loading ? '登录中...' : '登录' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/modules/user'
import { getCaptcha } from '@/api/auth'
import { ElMessage } from 'element-plus'
import { storage } from '@/utils/storage'

const router = useRouter()
const userStore = useUserStore()

const loading = ref(false)
const captchaImage = ref('')
const sessionId = ref('')

const formData = ref({
  username: '',
  password: '',
  captcha: '',
  sessionId: ''
})

// 获取验证码
const refreshCaptcha = async () => {
  try {
    const res = await getCaptcha()
    captchaImage.value = res.captchaBase64
    sessionId.value = res.sessionId
    formData.value.sessionId = res.sessionId
  } catch (error) {
    ElMessage.error('获取验证码失败')
  }
}

// 提交表单
const handleSubmit = async () => {
  if (loading.value) return

  loading.value = true
  try {
    const success = await userStore.loginAction(formData.value)
    if (success) {
      ElMessage.success('登录成功')
      // 检查是否已配置API
      const hasConfig = storage.hasApiConfig()
      if (hasConfig) {
        router.push('/dashboard/overview')
      } else {
        router.push('/exchange-setup')
      }
    } else {
      ElMessage.error('登录失败')
      refreshCaptcha()
    }
  } catch (error) {
    ElMessage.error(error.message || '登录失败')
    refreshCaptcha()
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  refreshCaptcha()
})
</script>

<style scoped>
.group:focus-within label {
  color: #4f46e5;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.max-w-md {
  animation: fadeIn 0.5s ease-out;
}
</style> 