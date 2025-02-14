<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
    <div class="max-w-md w-full space-y-8 p-8 bg-white rounded-xl shadow-lg transform transition-all hover:scale-105">
      <div class="text-center">
        <div class="flex justify-center">
          <div class="w-20 h-20 bg-indigo-600 rounded-full flex items-center justify-center">
            <svg class="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
        </div>
        <h2 class="mt-6 text-3xl font-extrabold text-gray-900">注册账户</h2>
        <p class="mt-2 text-sm text-gray-600">
          创建您的交易账户
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
            <label for="confirmPassword" class="block text-sm font-medium text-gray-700">确认密码</label>
            <div class="mt-1 relative">
              <input
                id="confirmPassword"
                v-model="formData.confirmPassword"
                name="confirmPassword"
                type="password"
                required
                class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all"
                placeholder="请再次输入密码"
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
            <router-link to="/auth/login" class="font-medium text-indigo-600 hover:text-indigo-500 transition-colors">
              已有账户？立即登录
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
              >
                <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
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
            {{ loading ? '注册中...' : '注册' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { register, getCaptcha } from '@/api/auth'
import { ElMessage } from 'element-plus'

const router = useRouter()
const loading = ref(false)
const captchaImage = ref('')
const sessionId = ref('')

const formData = ref({
  username: '',
  password: '',
  confirmPassword: '',
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

  if (formData.value.password !== formData.value.confirmPassword) {
    ElMessage.error('两次输入的密码不一致')
    return
  }

  loading.value = true
  try {
    const { confirmPassword, ...registerData } = formData.value
    const res = await register(registerData)
    if (res.success) {
      ElMessage.success('注册成功')
      router.push('/auth/login')
    } else {
      ElMessage.error('注册失败')
      refreshCaptcha()
    }
  } catch (error) {
    ElMessage.error(error.message || '注册失败')
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