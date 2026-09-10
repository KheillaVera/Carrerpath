import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, readStoredToken, setAuthToken, setUnauthorizedHandler } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [status, setStatus] = useState('loading'); // loading | authenticated | anonymous

  const signOut = useCallback(() => {
    setAuthToken(null);
    setUser(null);
    setPermissions([]);
    setStatus('anonymous');
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(signOut);
  }, [signOut]);

  const loadMe = useCallback(async () => {
    try {
      const { data } = await api.get('/auth/me');
      setUser(data.user);
      setPermissions(data.permissions || []);
      setStatus('authenticated');
    } catch (_err) {
      signOut();
    }
  }, [signOut]);

  useEffect(() => {
    const token = readStoredToken();
    if (!token) {
      setStatus('anonymous');
      return;
    }
    setAuthToken(token);
    loadMe();
  }, [loadMe]);

  const signIn = useCallback(async ({ email, password }) => {
    const { data } = await api.post('/auth/login', { email, password });
    setAuthToken(data.token);
    setUser(data.user);
    setStatus('authenticated');
    await loadMe();
    return data.user;
  }, [loadMe]);

  const signUp = useCallback(async (payload) => {
    const { data } = await api.post('/auth/register', payload);
    setAuthToken(data.token);
    setUser(data.user);
    setStatus('authenticated');
    await loadMe();
    return data.user;
  }, [loadMe]);

  const value = useMemo(
    () => ({
      user,
      permissions,
      status,
      isAuthenticated: status === 'authenticated',
      hasRole: (role) => !!user?.roles?.includes(role),
      hasPermission: (perm) => permissions.includes(perm),
      signIn,
      signUp,
      signOut,
    }),
    [user, permissions, status, signIn, signUp, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
