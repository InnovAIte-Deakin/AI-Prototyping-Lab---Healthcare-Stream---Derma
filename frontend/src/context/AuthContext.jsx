import { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

// Shared Axios client for the whole frontend
export const apiClient = axios.create({
  baseURL: 'http://localhost:8000',
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const isAuthenticated = !!user;
  const userRole = user ? user.role : null;

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
    if (u.access_token) {
      apiClient.defaults.headers['Authorization'] = `Bearer ${u.access_token}`;
    }
  };

  const clearHeaders = () => {
    delete apiClient.defaults.headers['X-User-Id'];
    delete apiClient.defaults.headers['X-User-Role'];
    delete apiClient.defaults.headers['Authorization'];
  };

  /**
   * login({ email, password, roleOverride })
   * Authenticates with the backend and stores the JWT token.
   */
  const login = async ({ email, password, roleOverride }) => {
    const res = await apiClient.post('/auth/login', { email, password });
    const userData = res.data;

    // Normalize to { id, email, role, access_token }
    // Backend LoginResponse returns { access_token, user_id, email, role }
    const normalizedUser = {
      id: userData.user_id || userData.id,
      email: userData.email,
      role: roleOverride || userData.role,
      access_token: userData.access_token
    };

    setUser(normalizedUser);
    return normalizedUser;
  };

  const signup = async ({ email, password, role }) => {
    const res = await apiClient.post('/auth/signup', { email, password, role });
    const userData = res.data;

    // Backend returns LoginResponse: { access_token, user_id, email, role }
    const normalizedUser = {
      id: userData.user_id,
      email: userData.email,
      role: userData.role,
      access_token: userData.access_token
    };

    setUser(normalizedUser);
    return normalizedUser;
  };

  const logout = () => {
    setUser(null);
  };

  const value = { user, isAuthenticated, userRole, login, signup, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
