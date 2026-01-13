import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { AuthProvider, apiClient } from '../context/AuthContext';
import { routes } from '../App';

const renderWithRouter = (initialPath) => {
  const router = createMemoryRouter(routes, {
    initialEntries: [initialPath],
  });
  render(
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
};

const reviewedReport = {
  report_id: 10,
  image_id: 123,
  review_status: 'reviewed',
  doctor_active: false,
  condition: 'Test',
  severity: 'Low',
  confidence: 80,
  recommendation: 'Keep skin clean.',
  created_at: new Date().toISOString(),
  patient_rating: null,
  patient_feedback: null,
};

beforeEach(() => {
  vi.spyOn(apiClient, 'get').mockResolvedValue({ data: {} });
  vi.spyOn(apiClient, 'post').mockResolvedValue({ data: {} });
  localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

describe('PatientCasePage ratings', () => {
  it('shows rating form when case is reviewed and unrated', async () => {
    localStorage.setItem('authUser', JSON.stringify({ id: 1, role: 'patient', email: 'p@test.com' }));

    apiClient.get.mockImplementation((url) => {
      if (url.startsWith('/api/analysis/image/123')) {
        return Promise.resolve({ data: reviewedReport });
      }
      return Promise.resolve({ data: {} });
    });

    renderWithRouter('/patient/case/123');

    expect(await screen.findByText('Rate Your Physician')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Submit Rating/i })).toBeInTheDocument();
  });

  it('submits rating and feedback', async () => {
    localStorage.setItem('authUser', JSON.stringify({ id: 1, role: 'patient', email: 'p@test.com' }));

    apiClient.get.mockImplementation((url) => {
      if (url.startsWith('/api/analysis/image/123')) {
        return Promise.resolve({ data: reviewedReport });
      }
      return Promise.resolve({ data: {} });
    });

    apiClient.post.mockResolvedValue({
      data: { patient_rating: 4, patient_feedback: 'Helpful review.' },
    });

    renderWithRouter('/patient/case/123');

    await screen.findByText('Rate Your Physician');

    fireEvent.click(screen.getByLabelText('4 star'));
    fireEvent.change(
      screen.getByPlaceholderText(/Optional feedback/i),
      { target: { value: 'Helpful review.' } }
    );

    fireEvent.click(screen.getByRole('button', { name: /Submit Rating/i }));

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith('/cases/10/rating', {
        rating: 4,
        feedback: 'Helpful review.',
      });
    });

    expect(await screen.findByText('Submitted')).toBeInTheDocument();
  });
});
