import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import Layout from './components/Layout';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import PatientDashboard from './pages/PatientDashboard';
import PatientUpload from './pages/PatientUpload';
import DoctorDashboard from './pages/DoctorDashboard';
import DoctorPatientDetail from './pages/DoctorPatientDetail';
import PatientHistory from './pages/PatientHistory';

import { AuthProvider, useAuth } from './context/AuthContext';   // バ. FIXED PATH

import './App.css';

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

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route element={<Layout />}>
            {/* Public routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />

            {/* Patient routes */}
            <Route
              path="/patient-dashboard"
              element={<PrivateRoute element={<PatientDashboard />} allowedRoles={['patient']} />}
            />

            <Route
              path="/patient-upload"
              element={<PrivateRoute element={<PatientUpload />} allowedRoles={['patient']} />}
            />

            <Route
              path="/patient-history"
              element={<PrivateRoute element={<PatientHistory />} allowedRoles={['patient']} />}
            />

            {/* Doctor routes */}
            <Route
              path="/doctor-dashboard"
              element={<PrivateRoute element={<DoctorDashboard />} allowedRoles={['doctor']} />}
            />

            <Route
              path="/doctor/patients/:patientId"
              element={<PrivateRoute element={<DoctorPatientDetail />} allowedRoles={['doctor']} />}
            />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
