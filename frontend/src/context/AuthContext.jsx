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
  const login = async ({ email, password }) => {
    const res = await apiClient.post('/auth/login', { email, password });
    const userData = res.data;
    
    // Normalize to { id, email, role }
    // Backend LoginResponse returns { user_id, email, role }
    const normalizedUser = {
      id: userData.user_id || userData.id,
      email: userData.email,
      role: userData.role
    };

    setUser(normalizedUser);
    return normalizedUser;
  };

  const signup = async ({ email, password, role }) => {
    const res = await apiClient.post('/auth/signup', { email, password, role });
    const userData = res.data;
    // Note: The signup endpoint returns the user object but NOT the login response structure (user_id, email, role) directly in the same shape as login if not careful.
    // Checking backend: signup returns UserResponse (id, email, role). Login returns LoginResponse (user_id, email, role).
    // We need to normalize this.
    
    // LoginResponse: { user_id, email, role }
    // UserResponse: { id, email, role }
    
    // Let's normalize to what our app expects: { id, email, role }
    const normalizedUser = {
        id: userData.id || userData.user_id,
        email: userData.email,
        role: userData.role
    };
    
    // For signup, we might want to auto-login or just return the user. 
    // Let's auto-login by setting the user.
    setUser(normalizedUser);
    return normalizedUser;
  };

  const logout = () => {
    setUser(null);
  };

  const value = { user, login, signup, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
