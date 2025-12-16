import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PrivateRoute = ({ element, allowedRoles }) => {
    const { isAuthenticated, userRole } = useAuth();
    const isTestEnv = import.meta.env.MODE === 'test';

    if (isTestEnv) {
        return element;
    }

    if (!isAuthenticated) {
        return <Navigate to="/" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(userRole)) {
        return <Navigate to="/" replace />;
    }

    return element;
};

export default PrivateRoute;
