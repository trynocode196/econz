import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api.get('/auth/me')
        .then(res => setUser(res.data))
        .catch(() => localStorage.removeItem('token'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', res.data.token);
    setUser(res.data.user);
    return res.data.user;
  };

  const loginWithGoogle = async (payload) => {
    const res = await api.post('/auth/google', payload);
    localStorage.setItem('token', res.data.token);
    if (res.data.googleAccessToken || payload.accessToken) {
      localStorage.setItem('googleAccessToken', res.data.googleAccessToken || payload.accessToken);
    }
    setUser(res.data.user);
    return res.data.user;
  };

  const setSession = (token, userData) => {
    if (token) localStorage.setItem('token', token);
    if (userData) setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('googleAccessToken');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, setSession, login, loginWithGoogle, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
