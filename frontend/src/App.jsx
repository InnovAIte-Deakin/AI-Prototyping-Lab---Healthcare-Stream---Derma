import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import PatientDashboard from './pages/PatientDashboard';
import PatientUpload from './pages/PatientUpload';
import DoctorDashboard from './pages/DoctorDashboard';
import DoctorPatientDetail from './pages/DoctorPatientDetail';

import { AuthProvider } from './context/AuthContext';   // ✅ FIXED PATH
import ProtectedRoute from './components/ProtectedRoute';

import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route element={<Layout />}>
            {/* Public route */}
            <Route path="/" element={<LoginPage />} />
            <Route path="/login" element={<LoginPage />} />

            {/* Patient routes */}
            <Route
              path="/patient-dashboard"
              element={
                <ProtectedRoute
                  element={<PatientDashboard />}
                  allowedRoles={['patient']}
                />
              }
            />

            <Route
              path="/patient-upload"
              element={
                <ProtectedRoute
                  element={<PatientUpload />}
                  allowedRoles={['patient']}
                />
              }
            />

            {/* Doctor routes */}
            <Route
              path="/doctor-dashboard"
              element={
                <ProtectedRoute
                  element={<DoctorDashboard />}
                  allowedRoles={['doctor']}
                />
              }
            />

            <Route
              path="/doctor/patients/:patientId"
              element={
                <ProtectedRoute
                  element={<DoctorPatientDetail />}
                  allowedRoles={['doctor']}
                />
              }
            />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
