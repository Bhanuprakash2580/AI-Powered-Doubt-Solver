// ============================================
// AuthContext.jsx - Global Authentication State
// ============================================

import { createContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // Load user from localStorage (prevents UI flicker)
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });

  const [loading, setLoading] = useState(true);

  // ── Validate token on app mount ───────────────────────────
  useEffect(() => {
    const token = localStorage.getItem('token');

    const validateToken = async () => {
      try {
        if (!token) {
          setLoading(false);
          return;
        }

        const { data } = await authAPI.getMe();
        setUser(data.user);
        localStorage.setItem('user', JSON.stringify(data.user));
      } catch (error) {
        // If token is invalid/expired → clear storage
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    validateToken();
  }, []);

  // ── login ─────────────────────────────────────────────────
  const login = async (email, password) => {
    const { data } = await authAPI.login({ email, password });

    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);

    return data;
  };

  // ── register ──────────────────────────────────────────────
  const register = async (formData) => {
    const { data } = await authAPI.register(formData);

    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);

    return data;
  };

  // ── logout ────────────────────────────────────────────────
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};