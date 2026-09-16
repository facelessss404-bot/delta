import api from './api';

export default {
  getLeaves: async () => (await api.get('/leaves')).data,
  createLeave: async (data) => (await api.post('/leaves', data)).data,
  reviewLeave: async (id, data) => (await api.patch(`/leaves/${id}/review`, data)).data,
  deleteLeave: async (id) => (await api.delete(`/leaves/${id}`)).data,
};
