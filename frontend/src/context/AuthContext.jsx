import { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

// Shared Axios client for the whole frontend
export const apiClient = axios.create({
  baseURL: 'http://localhost:8000',
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  // Load user from localStorage on first mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('authUser');
      if (stored) {
        const parsed = JSON.parse(stored);
        setUser(parsed);
        setHeadersFromUser(parsed);
      }
    } catch (err) {
      console.error('Failed to parse authUser from localStorage', err);
    }
  }, []);

  // Whenever user changes, sync to localStorage + apiClient headers
  useEffect(() => {
    if (user) {
      localStorage.setItem('authUser', JSON.stringify(user));
      setHeadersFromUser(user);
    } else {
      localStorage.removeItem('authUser');
      clearHeaders();
    }
  }, [user]);

  const setHeadersFromUser = (u) => {
    apiClient.defaults.headers['X-User-Id'] = u.id;
    apiClient.defaults.headers['X-User-Role'] = u.role;
  };

  const clearHeaders = () => {
    delete apiClient.defaults.headers['X-User-Id'];
    delete apiClient.defaults.headers['X-User-Role'];
  };

  /**
   * login({ email, role })
   * For now this is a "fake" login:
   * - we don't hit a real backend auth endpoint
   * - we just set a user object that the rest of the app can use
   *
   * If/when the backend provides /auth/login later, you can:
   *  - await apiClient.post('/auth/login', { email, password })
   *  - and then setUser(response.data.user)
   */
  const login = async ({ email, role }) => {
    if (!email || !role) {
      throw new Error('Email and role are required');
    }

    // Fake user object – id could come from backend later
    const fakeUser = {
      id: 1,
      email,
      role, // 'patient' or 'doctor'
    };

    setUser(fakeUser);
    return fakeUser;
  };

  const logout = () => {
    setUser(null);
  };

  const value = { user, login, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
