import { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';

export const apiClient = axios.create({
  baseURL: 'http://localhost:8000',
});

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('authUser');
    if (!stored) return null;
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  });

  useEffect(() => {
    const interceptorId = apiClient.interceptors.request.use(
      (config) => {
        if (user) {
          config.headers = {
            ...(config.headers || {}),
            'X-User-Id': user.id,
            'X-User-Role': user.role,
          };
        }
        return config;
      },
      (error) => Promise.reject(error),
    );

    return () => {
      apiClient.interceptors.request.eject(interceptorId);
    };
  }, [user]);

  const login = async (email, password) => {
    const response = await apiClient.post('/auth/login', { email, password });
    const authUser = {
      id: response.data.user_id,
      email: response.data.email,
      role: response.data.role,
    };
    localStorage.setItem('authUser', JSON.stringify(authUser));
    setUser(authUser);
  };

  const logout = () => {
    localStorage.removeItem('authUser');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
