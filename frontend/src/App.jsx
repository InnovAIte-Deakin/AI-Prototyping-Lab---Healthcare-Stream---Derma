import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import PatientDashboard from './pages/PatientDashboard';
import PatientUpload from './pages/PatientUpload';
import DoctorDashboard from './pages/DoctorDashboard';
import DoctorPatientDetail from './pages/DoctorPatientDetail';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<LoginPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/patient-dashboard"
              element={
                <ProtectedRoute
                  allowedRoles={['patient']}
                  element={<PatientDashboard />}
                />
              }
            />
            <Route
              path="/patient-upload"
              element={
                <ProtectedRoute allowedRoles={['patient']} element={<PatientUpload />} />
              }
            />
            <Route
              path="/doctor-dashboard"
              element={
                <ProtectedRoute allowedRoles={['doctor']} element={<DoctorDashboard />}
                />
              }
            />
            <Route
              path="/doctor-patient-detail"
              element={
                <ProtectedRoute
                  allowedRoles={['doctor']}
                  element={<DoctorPatientDetail />}
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
