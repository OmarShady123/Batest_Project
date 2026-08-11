import React, { createContext, useContext, useState, useEffect } from 'react';
import apiClient, { setAccessToken, clearAccessToken } from '../services/apiClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const login = async (email, password, rememberMe = false) => {
    const res = await apiClient.post('/api/v1/auth/login', {
      email,
      password,
      remember_me: rememberMe,
    });


    setAccessToken(res.data.access_token);
    const profileRes = await apiClient.get('/api/v1/auth/me');
    setUser(profileRes.data);
    return profileRes.data;
  };



  const signup = async (name, email, password, confirmPassword, termsAccepted = true) => {
    const res = await apiClient.post('/api/v1/auth/signup', {
      name,
      email,
      password,
      confirm_password: confirmPassword,
      terms_accepted: termsAccepted,
    });
    return res.data;
  };

  const googleLogin = async (credential, termsAccepted = false) => {
    const res = await apiClient.post('/api/v1/auth/google', {
      credential,
      terms_accepted: termsAccepted,
    });
    setAccessToken(res.data.access_token);
    const profileRes = await apiClient.get('/api/v1/auth/me');
    setUser(profileRes.data);
    return profileRes.data;
  };

  const logout = async () => {
    try {
      await apiClient.post('/api/v1/auth/logout');
    } catch (err) {
      // Ignore network failure on logout
    } finally {
      clearAccessToken();
      setUser(null);
    }
  };

  const logoutAll = async () => {
    try {
      await apiClient.post('/api/v1/sessions/logout-all');
    } catch (err) {
      // Ignore
    } finally {
      clearAccessToken();
      setUser(null);
    }
  };

  const refreshUser = async () => {
    try {
      const res = await apiClient.get('/api/v1/auth/me');
      setUser(res.data);
    } catch (err) {
      setUser(null);
      clearAccessToken();
    }
  };

  const updateProfile = async (data) => {
    const res = await apiClient.patch('/api/v1/account/profile', data);
    setUser(res.data);
    return res.data;
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        const res = await apiClient.post('/api/v1/auth/refresh');
        setAccessToken(res.data.access_token);
        const profile = await apiClient.get('/api/v1/auth/me');
        setUser(profile.data);
      } catch (err) {
        setUser(null);
        clearAccessToken();
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    const handleLogoutEvent = () => {
      setUser(null);
      clearAccessToken();
    };

    window.addEventListener('auth-logout', handleLogoutEvent);
    return () => {
      window.removeEventListener('auth-logout', handleLogoutEvent);
    };
  }, []);

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    isVerified: user?.is_verified && user?.status === 'active',
    login,
    googleLogin,
    logout,
    logoutAll,
    signup,
    refreshUser,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
