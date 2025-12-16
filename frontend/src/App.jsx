import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';

import Layout from './components/Layout';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import PatientDashboard from './pages/PatientDashboard';
import PatientUpload from './pages/PatientUpload';
import DoctorDashboard from './pages/DoctorDashboard';
import DoctorPatientDetail from './pages/DoctorPatientDetail';
import PatientHistory from './pages/PatientHistory';

import PrivateRoute from './components/PrivateRoute';
import { AuthProvider } from './context/AuthContext';

import './App.css';

export const routes = [
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        path: '/',
        element: <LandingPage />,
      },
      {
        path: '/login',
        element: <LoginPage />,
      },
      {
        path: '/patient-dashboard',
        element: (
          <PrivateRoute allowedRoles={['patient']} element={<PatientDashboard />} />
        ),
      },
      {
        path: '/patient-upload',
        element: (
          <PrivateRoute allowedRoles={['patient']} element={<PatientUpload />} />
        ),
      },
      {
        path: '/patient-history',
        element: (
          <PrivateRoute allowedRoles={['patient']} element={<PatientHistory />} />
        ),
      },
      {
        path: '/doctor-dashboard',
        element: (
          <PrivateRoute allowedRoles={['doctor']} element={<DoctorDashboard />} />
        ),
      },
      {
        path: '/doctor/patients/:patientId',
        element: (
          <PrivateRoute allowedRoles={['doctor']} element={<DoctorPatientDetail />} />
        ),
      },
    ],
  },
];

const router = createBrowserRouter(routes);

function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}

export default App;
