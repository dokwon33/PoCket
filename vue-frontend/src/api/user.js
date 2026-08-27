import api from './index.js'

export const userApi = {
  // 인증 필요. {id, email, name, role} 반환
  getById(id) {
    return api.get(`/api/users/${id}`)
  }
}
