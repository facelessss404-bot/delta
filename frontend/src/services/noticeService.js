import api from './api';

export default {
  getNotices: async () => (await api.get('/notices')).data,
  createNotice: async (data) => (await api.post('/notices', data)).data,
  updateNotice: async (id, data) => (await api.put(`/notices/${id}`, data)).data,
  deleteNotice: async (id) => (await api.delete(`/notices/${id}`)).data,
};
