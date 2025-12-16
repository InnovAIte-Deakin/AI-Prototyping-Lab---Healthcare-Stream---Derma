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
  const login = async ({ email, password, roleOverride }) => {
    const res = await apiClient.post('/auth/login', { email, password });
    const userData = res.data;

    // Normalize to { id, email, role }
    // Backend LoginResponse returns { user_id, email, role }
    const normalizedUser = {
      id: userData.user_id || userData.id,
      email: userData.email,
      role: roleOverride || userData.role
    };

    setUser(normalizedUser);
    return normalizedUser;
  };

  const signup = async ({ email, password, role }) => {
    const res = await apiClient.post('/auth/signup', { email, password, role });
    const userData = res.data;

    // Backend now returns LoginResponse: { access_token, user_id, email, role }
    // Similar to login, we need to set the token for subsequent requests if we moved to Bearer auth.
    // For now, we normalize user object and rely on `setHeadersFromUser` which sets X-User-Id/X-User-Role.
    // TODO: Ideally, we should switch to verifying the JWT on backend for every request.

    // Normalized user object for app state
    const normalizedUser = {
      id: userData.user_id,
      email: userData.email,
      role: userData.role
    };

    // Crucial: Update the apiClient headers with the JWT token if we were using it, 
    // OR ensure the user object has the necessary fields (id, role) for header injection.

    // Since backend verify_token uses JWT from 'Authorization: Bearer ...',
    // we MUST inject this token into apiClient defaults or localStorage.
    // However, the current `setHeadersFromUser` in this file only sets X-User-Id.
    // We need to FIX `setHeadersFromUser` to also set Authorization header if we have a token.
    // But `user` state might not store the token?
    // Let's store the token in the user object for now so `setHeadersFromUser` can use it?
    // Or just manually set it.

    if (userData.access_token) {
      apiClient.defaults.headers['Authorization'] = `Bearer ${userData.access_token}`;
      normalizedUser.access_token = userData.access_token; // Store token in user state for persistence
    }

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
