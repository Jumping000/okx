import request from '@/utils/authRequest'

// 获取用户消息列表
export function getUserMessages(params) {
  return request({
    url: '/api/message/user/list',
    method: 'get',
    params: {
      page: params?.page || 1,
      pageSize: params?.pageSize || 10,
      isRead: params?.isRead
    }
  })
}

// 标记消息为已读
export function markMessageRead(id) {
  return request({
    url: `/api/message/user/${id}/read`,
    method: 'put'
  })
}

// 标记所有消息为已读
export function markAllMessagesRead() {
  return request({
    url: '/api/message/user/read/all',
    method: 'put'
  })
}

// 删除消息
export function deleteMessage(id) {
  return request({
    url: `/api/message/user/${id}`,
    method: 'delete'
  })
}

// 获取未读消息数量
export function getUnreadMessageCount() {
  return request({
    url: '/api/message/user/unread/count',
    method: 'get'
  })
} 