import api from './api';

export default {
  getNotes: async (subjectId) => {
    return (await api.get('/notes', { params: subjectId ? { subjectId } : {} })).data;
  },
  uploadNote: async (formData) => {
    return (await api.post('/notes', formData, { headers: { 'Content-Type': 'multipart/form-data' } })).data;
  },
  deleteNote: async (id) => (await api.delete(`/notes/${id}`)).data,
  downloadNote: async (id, title) => {
    const res = await api.get(`/notes/${id}/download`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url; link.setAttribute('download', title);
    document.body.appendChild(link); link.click(); link.remove();
  }
};
