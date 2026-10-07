import React, { useState, useEffect, useRef } from 'react';
import { AuthContext } from './authStateContext';
import api from '../services/api';

export { AuthContext } from './authStateContext';

const LoadingScreen = () => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0a0f1c', color: '#94a3b8', fontFamily: 'Inter, system-ui, sans-serif' }}>
    <div style={{ width: 40, height: 40, border: '3px solid #1e293b', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    <p style={{ marginTop: 16, fontSize: 14, letterSpacing: '0.05em' }}>Connecting to server...</p>
    <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
  </div>
);

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

  if (loading) return <LoadingScreen />;

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

