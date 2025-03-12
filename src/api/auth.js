import request from '@/utils/authRequest'

// 获取验证码
export function getCaptcha() {
  return request({
    url: '/api/auth/captcha',
    method: 'get'
  })
}

// 用户注册
export function register(data) {
  return request({
    url: '/api/auth/register',
    method: 'post',
    data
  })
}

// 用户登录
export function login(data) {
  return request({
    url: '/api/auth/login',
    method: 'post',
    data
  })
}

// 获取用户信息
export function getUserInfo() {
  return request({
    url: '/api/user/info',
    method: 'get'
  })
}

// 更新用户信息
export function updateUserInfo(data) {
  return request({
    url: '/api/user/update',
    method: 'put',
    data
  })
}

// 参数同步
export function syncParameter(data) {
  return request({
    url: '/api/user/parameter/cloud-sync',
    method: 'post',
    data
  })
}

// 表达式同步
export function syncExpression(data) {
  return request({
    url: '/api/user/expression/cloud-sync',
    method: 'post',
    data
  })
}

// 策略同步
export function syncStrategy(data) {
  return request({
    url: '/api/user/strategy/cloud-sync',
    method: 'post',
    data
  })
}

