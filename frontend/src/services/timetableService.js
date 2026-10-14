import api from './api';

export const getSchedules = async () => {
  const { data } = await api.get('/timetable/schedules');
  return data;
};

export const getTimetableSlots = async (params = {}) => {
  const { data } = await api.get('/timetable/slots', { params });
  return data;
};

export const getMyTimetable = async (scheduleKey) => {
  const { data } = await api.get('/timetable/my', {
    params: scheduleKey ? { scheduleKey } : undefined
  });
  return data;
};

export const getTodaySchedule = async (scheduleKey, date) => {
  const { data } = await api.get('/timetable/today', {
    params: { scheduleKey, date }
  });
  return data;
};

export const createTimetableSlot = async (slot) => {
  const { data } = await api.post('/timetable/slots', slot);
  return data;
};

export const updateTimetableSlot = async (id, slot) => {
  const { data } = await api.put(`/timetable/slots/${id}`, slot);
  return data;
};

export const deleteTimetableSlot = async (id) => {
  const { data } = await api.delete(`/timetable/slots/${id}`);
  return data;
};

export default {
  getSchedules,
  getTimetableSlots,
  getMyTimetable,
  getTodaySchedule,
  createTimetableSlot,
  updateTimetableSlot,
  deleteTimetableSlot
};
