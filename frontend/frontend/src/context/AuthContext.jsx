import React, { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/authService';
import { checkBackendHealth } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isBackendOnline, setIsBackendOnline] = useState(false);
  const [backendMessage, setBackendMessage] = useState('Checking backend status...');

  const refreshBackendStatus = async () => {
    try {
      const status = await checkBackendHealth();
      setIsBackendOnline(status.online);
      setBackendMessage(status.message);
    } catch {
      setIsBackendOnline(false);
      setBackendMessage('Backend offline (Demo Mode active)');
    }
  };

  useEffect(() => {
    // Check initial user from localStorage
    const savedUser = authService.getCurrentUser();
    if (savedUser) {
      setUser(savedUser);
    } else {
      // For immediate preview / demo experience, initialize with demo user
      // or let user view login page
    }
    setLoading(false);
    refreshBackendStatus();

    // Periodic check every 45s
    const interval = setInterval(refreshBackendStatus, 45000);
    return () => clearInterval(interval);
  }, []);

  const loginGitHub = () => {
    const authUrl = authService.getGitHubAuthUrl();
    window.location.href = authUrl;
  };

  const loginDemo = (profile) => {
    const loggedIn = authService.loginDemoUser(profile);
    setUser(loggedIn);
    return loggedIn;
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        loading,
        isBackendOnline,
        backendMessage,
        loginGitHub,
        loginDemo,
        logout,
        refreshBackendStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
