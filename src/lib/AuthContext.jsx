import React, { createContext, useState, useContext, useEffect } from 'react';
import { local } from '@/api/localStorageClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [needsSetup, setNeedsSetup] = useState(false);

  useEffect(() => { checkUserAuth(); }, []);

  const checkUserAuth = async () => {
    setIsLoadingAuth(true); setAuthError(null);
    try {
      const hasUsers = await local.auth.hasUsers();
      setNeedsSetup(!hasUsers);
      const currentUser = hasUsers ? await local.auth.me() : null;
      setUser(currentUser);
      setIsAuthenticated(Boolean(currentUser));
    } catch (error) {
      setAuthError({ type: 'auth_required', message: error.message || 'Authentication required' });
      setIsAuthenticated(false); setUser(null);
    } finally { setIsLoadingAuth(false); setAuthChecked(true); }
  };

  const login = async (email, password) => {
    const result = await local.auth.loginViaEmailPassword(email, password);
    localStorage.setItem('salon_session_token', result.token);
    setUser(result.user); setIsAuthenticated(true); setNeedsSetup(false); return result.user;
  };

  const register = async (data) => {
    await local.auth.register(data);
    return login(data.email, data.password);
  };

  const logout = async () => { await local.auth.logout(); setUser(null); setIsAuthenticated(false); window.location.href = '/login'; };
  const navigateToLogin = () => { window.location.href = needsSetup ? '/register' : '/login'; };

  return <AuthContext.Provider value={{ user, isAuthenticated, isLoadingAuth, isLoadingPublicSettings, authError, authChecked, needsSetup, login, register, logout, navigateToLogin, checkUserAuth, checkAppState: checkUserAuth }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
