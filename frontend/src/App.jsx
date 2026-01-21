import { createBrowserRouter, RouterProvider } from 'react-router-dom';

import Layout from './components/Layout';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import PatientDashboard from './pages/PatientDashboard';
import PatientUpload from './pages/PatientUpload';
import DoctorDashboard from './pages/DoctorDashboard';
import DoctorPatientDetail from './pages/DoctorPatientDetail';
import DoctorCasePage from './pages/DoctorCasePage';
import PatientHistory from './pages/PatientHistory';
import PatientCasePage from './pages/PatientCasePage';
import PublicTryPage from './pages/PublicTryPage';
import AboutPage from './pages/AboutPage';
import DoctorsPage from './pages/DoctorsPage';
import ServicesPage from './pages/ServicesPage';
import ContactPage from './pages/ContactPage';
import FAQPage from './pages/FAQPage';
import AdminDashboard from './pages/AdminDashboard';

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
        path: '/try-anonymous',
        element: <PublicTryPage />,
      },
      {
        path: '/about',
        element: <AboutPage />,
      },
      {
        path: '/doctors',
        element: <DoctorsPage />,
      },
      {
        path: '/services',
        element: <ServicesPage />,
      },
      {
        path: '/contact',
        element: <ContactPage />,
      },
      {
        path: '/faq',
        element: <FAQPage />,
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
        path: '/patient/case/:imageId',
        element: (
          <PrivateRoute allowedRoles={['patient']} element={<PatientCasePage />} />
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
      {
        path: '/doctor/case/:reportId',
        element: (
          <PrivateRoute allowedRoles={['doctor']} element={<DoctorCasePage />} />
        ),
      },
      {
        path: '/admin-dashboard',
        element: (
          <PrivateRoute allowedRoles={['admin']} element={<AdminDashboard />} />
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
