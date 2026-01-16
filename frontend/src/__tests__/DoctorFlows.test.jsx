import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import DoctorDashboard from '../pages/DoctorDashboard';
import DoctorPatientDetail from '../pages/DoctorPatientDetail';
import { apiClient } from '../context/AuthContext';
import { ToastProvider } from '../context/ToastContext';

describe('Doctor flows', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows patients returned from the API on the doctor dashboard', async () => {
    vi.spyOn(apiClient, 'get').mockResolvedValue({
      data: [
        { id: 1, full_name: 'Alice Patient', email: 'alice@example.com' },
        { id: 2, full_name: 'Bob Patient', email: 'bob@example.com' },
      ],
    });

    render(
      <ToastProvider>
        <MemoryRouter>
          <DoctorDashboard />
        </MemoryRouter>
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Alice Patient')).toBeInTheDocument();
      expect(screen.getByText('Bob Patient')).toBeInTheDocument();
    });

    expect(screen.getAllByText('View Reports').length).toBeGreaterThan(0);
  });

  it('fetches patient reports and displays risk/advice on detail page', async () => {
    vi.spyOn(apiClient, 'get').mockResolvedValue({
      data: [
        {
          id: 5,
          image_url: '/media/test.png',
          risk: 'High',
          advice: 'Schedule an in-person consult',
          created_at: '2025-01-01T00:00:00Z',
        },
      ],
    });

    render(
      <MemoryRouter initialEntries={['/doctor/patients/42']}>
        <Routes>
          <Route path="/doctor/patients/:patientId" element={<DoctorPatientDetail />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith(
        '/api/analysis/doctor/patients/42/reports'
      );
    });

    await waitFor(() => {
      expect(screen.getByTestId('report-5-risk')).toHaveTextContent(/Severity:.*High/);
      expect(screen.getByTestId('report-5-advice')).toHaveTextContent(/Recommendation:.*Schedule an in-person consult/);
    });
  });
});
