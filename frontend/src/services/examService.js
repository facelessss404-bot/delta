import api from './api';

export default {
  getExams: async () => (await api.get('/exams')).data,
  createExam: async (data) => (await api.post('/exams', data)).data,
  getResults: async (examId) => (await api.get('/results', { params: { examId } })).data,
  getMyResults: async () => (await api.get('/results/me')).data,
  upsertResult: async (data) => (await api.post('/results', data)).data,
  deleteResult: async (id) => (await api.delete(`/results/${id}`)).data,
  getCadets: async () => (await api.get('/cadets')).data,
};
