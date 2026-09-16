import api from './api';

const CACHE_TTL_MS = 5 * 60 * 1000;
let cachedSubjects = null;
let cachedAt = 0;
let inFlightRequest = null;

export const getSubjects = async ({ force = false } = {}) => {
  const now = Date.now();
  if (!force && cachedSubjects && now - cachedAt < CACHE_TTL_MS) return cachedSubjects;
  if (!force && inFlightRequest) return inFlightRequest;

  inFlightRequest = api.get('/subjects')
    .then(({ data }) => {
      cachedSubjects = data;
      cachedAt = Date.now();
      return data;
    })
    .finally(() => { inFlightRequest = null; });

  return inFlightRequest;
};

export const invalidateSubjects = () => {
  cachedSubjects = null;
  cachedAt = 0;
};
