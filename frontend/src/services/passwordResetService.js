import api from './api';
export const requestPasswordReset = async (email) => (await api.post('/auth/forgot-password', { email })).data;
export const resetPassword = async (token, newPassword) => (await api.post('/auth/reset-password', { token, newPassword })).data;
