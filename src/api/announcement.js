import request from '@/utils/authRequest'

// 获取公告列表
export function getAnnouncementList(params) {
  return request({
    url: '/api/announcement/client/list',
    method: 'get',
    params: {
      page: params?.page || 1,
      pageSize: 99999999
    }
  })
}

// 获取公告详情
export function getAnnouncementDetail(id) {
  return request({
    url: `/api/announcement/${id}`,
    method: 'get'
  })
} 