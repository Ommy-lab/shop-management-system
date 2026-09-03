import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import authService from '../services/authService';
import { unwrap } from '../utils/data';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(localStorage.getItem('token')));

  const logout = useCallback(() => { localStorage.removeItem('token'); setUser(null); }, []);

  // Restore the authenticated user after refresh; backend authorization stays authoritative.
  const loadCurrentUser = useCallback(async () => {
    if (!localStorage.getItem('token')) { setLoading(false); return; }
    try { setUser(unwrap(await authService.me(), 'user')); } catch { logout(); } finally { setLoading(false); }
  }, [logout]);

  useEffect(() => { loadCurrentUser(); }, [loadCurrentUser]);
  useEffect(() => { window.addEventListener('auth:expired', logout); return () => window.removeEventListener('auth:expired', logout); }, [logout]);

  const login = async (credentials) => {
    const response = await authService.login(credentials);
    const payload = unwrap(response);
    const token = payload.token || payload.accessToken || payload.access_token;
    if (!token) throw new Error('The server did not return an authentication token.');
    localStorage.setItem('token', token);
    const current = unwrap(await authService.me(), 'user');
    setUser(current);
    return current;
  };

  const value = useMemo(() => ({ user, loading, login, logout, refreshUser: loadCurrentUser, isAuthenticated: Boolean(user) }), [user, loading, logout, loadCurrentUser]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
