import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import PatientDashboard from './pages/PatientDashboard';
import PatientUpload from './pages/PatientUpload';
import DoctorDashboard from './pages/DoctorDashboard';
import DoctorPatientDetail from './pages/DoctorPatientDetail';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<LoginPage />} />
          <Route path="/patient-dashboard" element={<PatientDashboard />} />
          <Route path="/patient-upload" element={<PatientUpload />} />
          <Route path="/doctor-dashboard" element={<DoctorDashboard />} />
          <Route path="/doctor-patient-detail" element={<DoctorPatientDetail />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
