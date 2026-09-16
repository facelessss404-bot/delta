import React, { useState, useEffect, useRef } from 'react';
import { AuthContext } from './authStateContext';
import api from '../services/api';

export { AuthContext } from './authStateContext';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const skipNextValidation = useRef(false);

  useEffect(() => {
    const validatedToken = token;
    const savedUser = localStorage.getItem('user');
    if (!savedUser || !token) { setLoading(false); return; }
    if (skipNextValidation.current) { skipNextValidation.current = false; setLoading(false); return; }
    api.get('/auth/me').then(({ data }) => {
      if (localStorage.getItem('token') !== validatedToken) return;
      const restored = { ...data, token };
      setUser(restored);
      localStorage.setItem('user', JSON.stringify(restored));
    }).catch(() => {
      if (localStorage.getItem('token') !== validatedToken) return;
      setUser(null);
      setToken(null);
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    }).finally(() => setLoading(false));
  }, [token]);

  const login = (userData) => {
    skipNextValidation.current = true;
    setUser(userData);
    setToken(userData.token);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', userData.token);
  };

  const logout = async () => {
    api.post('/auth/logout').catch(() => { /* Logout is client-side for stateless JWT sessions. */ });
    setUser(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    window.location.assign('/');
  };

  if (loading) return null;

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
