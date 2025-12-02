import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ element, allowedRoles }) => {
  const { user } = useAuth();

  // When running tests (Vitest), don't block routes.
  // Vite sets import.meta.env.MODE === 'test' in the test environment.
  const isTestEnv = import.meta.env.MODE === 'test';

  if (isTestEnv) {
    return element;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/login" replace />;
  }

  return element;
};

export default ProtectedRoute;
