import request from '@/utils/authRequest'

// 提交反馈
export function submitFeedback(data) {
  return request({
    url: '/api/feedback/sub',
    method: 'post',
    data: {
      type: data.type,      // 反馈类型：'bug'、'feature'、'other'
      content: data.content,  // 反馈内容
      contact: data.contact  // 联系方式（可选）
    }
  })
}


