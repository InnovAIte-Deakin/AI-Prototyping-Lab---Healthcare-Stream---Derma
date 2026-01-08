import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { AuthProvider, apiClient } from '../context/AuthContext';
import { routes } from '../App';

beforeEach(() => {
  vi.spyOn(apiClient, 'get').mockResolvedValue({ data: {} });
  vi.spyOn(apiClient, 'post').mockResolvedValue({ data: {} });
  localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

// Helper to render with router
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

describe('PatientDashboard - Doctor Profile Display', () => {
  it('renders Patient Dashboard heading', async () => {
    localStorage.setItem('authUser', JSON.stringify({ id: 1, role: 'patient', email: 'p@test.com' }));
    apiClient.get.mockImplementation((url) => {
      if (url === '/patient/my-doctor') {
        return Promise.reject({ response: { status: 404 } });
      }
      return Promise.resolve({ data: [] });
    });

    renderWithRouter('/patient-dashboard');
    expect(await screen.findByText('Patient Dashboard')).toBeInTheDocument();
  });

  describe('Doctor Selection Flow', () => {
    it('displays available doctors with enriched profile data', async () => {
      localStorage.setItem('authUser', JSON.stringify({ id: 1, role: 'patient', email: 'p@test.com' }));

      const mockDoctors = [
        {
          id: 1,
          full_name: 'Dr. Jane Smith',
          clinic_name: 'DermaCare Clinic',
          bio: 'Specialized in acne and eczema treatment',
          avatar_url: 'https://example.com/avatar1.jpg',
          email: 'jane@dermacare.com',
        },
        {
          id: 2,
          full_name: 'Dr. John Doe',
          clinic_name: 'Skin Health Center',
          bio: 'Experienced in mole and melanoma screening',
          avatar_url: 'https://example.com/avatar2.jpg',
          email: 'john@skinhealth.com',
        },
      ];

      apiClient.get.mockImplementation((url) => {
        if (url === '/patient/my-doctor') {
          return Promise.reject({ response: { status: 404 } });
        }
        if (url === '/doctors') {
          return Promise.resolve({ data: mockDoctors });
        }
        return Promise.resolve({ data: {} });
      });

      renderWithRouter('/patient-dashboard');

      // Wait for doctors to load
      await waitFor(() => {
        expect(screen.getByText('Select a Doctor')).toBeInTheDocument();
      });

      // Verify first doctor's profile is displayed
      expect(screen.getByText('Dr. Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('DermaCare Clinic')).toBeInTheDocument();
      expect(screen.getByText('Specialized in acne and eczema treatment')).toBeInTheDocument();
      expect(screen.getByText('jane@dermacare.com')).toBeInTheDocument();

      // Verify second doctor's profile is displayed
      expect(screen.getByText('Dr. John Doe')).toBeInTheDocument();
      expect(screen.getByText('Skin Health Center')).toBeInTheDocument();
      expect(screen.getByText('Experienced in mole and melanoma screening')).toBeInTheDocument();
      expect(screen.getByText('john@skinhealth.com')).toBeInTheDocument();

      // Verify avatars are rendered
      const avatarImages = screen.getAllByRole('img');
      const doctorAvatars = avatarImages.filter((img) => img.src.includes('avatar'));
      expect(doctorAvatars.length).toBeGreaterThanOrEqual(2);
    });

    it('displays availability badge for doctors', async () => {
      localStorage.setItem('authUser', JSON.stringify({ id: 1, role: 'patient', email: 'p@test.com' }));

      const mockDoctors = [
        {
          id: 1,
          full_name: 'Dr. Jane Smith',
          clinic_name: 'DermaCare Clinic',
          bio: 'Specialized in acne and eczema treatment',
          avatar_url: 'https://example.com/avatar1.jpg',
          email: 'jane@dermacare.com',
        },
      ];

      apiClient.get.mockImplementation((url) => {
        if (url === '/patient/my-doctor') {
          return Promise.reject({ response: { status: 404 } });
        }
        if (url === '/doctors') {
          return Promise.resolve({ data: mockDoctors });
        }
        return Promise.resolve({ data: {} });
      });

      renderWithRouter('/patient-dashboard');

      await waitFor(() => {
        expect(screen.getByText('Select a Doctor')).toBeInTheDocument();
      });

      // Verify availability badge is present
      expect(screen.getByText('Available')).toBeInTheDocument();
    });

    it('handles doctor selection and updates state', async () => {
      localStorage.setItem('authUser', JSON.stringify({ id: 1, role: 'patient', email: 'p@test.com' }));

      const mockDoctor = {
        id: 1,
        full_name: 'Dr. Jane Smith',
        clinic_name: 'DermaCare Clinic',
        bio: 'Specialized in acne and eczema treatment',
        avatar_url: 'https://example.com/avatar1.jpg',
        email: 'jane@dermacare.com',
      };

      apiClient.get.mockImplementation((url) => {
        if (url === '/patient/my-doctor') {
          return Promise.reject({ response: { status: 404 } });
        }
        if (url === '/doctors') {
          return Promise.resolve({ data: [mockDoctor] });
        }
        return Promise.resolve({ data: {} });
      });

      apiClient.post.mockImplementation((url) => {
        if (url === '/patient/select-doctor') {
          return Promise.resolve({ data: { doctor: mockDoctor, status: 'active' } });
        }
        return Promise.resolve({ data: {} });
      });

      renderWithRouter('/patient-dashboard');

      await waitFor(() => {
        expect(screen.getByText('Dr. Jane Smith')).toBeInTheDocument();
      });

      const selectButton = screen.getByRole('button', { name: /Select Doctor/i });
      fireEvent.click(selectButton);

      // Verify the selection button shows loading state
      expect(screen.getByRole('button', { name: /Selecting.../i })).toBeInTheDocument();

      // Verify the API was called with correct doctor ID
      await waitFor(() => {
        expect(apiClient.post).toHaveBeenCalledWith('/patient/select-doctor', {
          doctor_id: 1,
        });
      });
    });
  });

  describe('Current Doctor Display', () => {
    it('displays current doctor with enriched profile when patient already has a doctor', async () => {
      localStorage.setItem('authUser', JSON.stringify({ id: 1, role: 'patient', email: 'p@test.com' }));

      const mockCurrentDoctor = {
        id: 1,
        full_name: 'Dr. Jane Smith',
        clinic_name: 'DermaCare Clinic',
        bio: 'Specialized in acne and eczema treatment with 10+ years experience',
        avatar_url: 'https://example.com/avatar1.jpg',
        email: 'jane@dermacare.com',
      };

      apiClient.get.mockImplementation((url) => {
        if (url === '/patient/my-doctor') {
          return Promise.resolve({ data: { doctor: mockCurrentDoctor } });
        }
        return Promise.resolve({ data: {} });
      });

      renderWithRouter('/patient-dashboard');

      // Verify current doctor section is displayed
      await waitFor(() => {
        expect(screen.getByText('Your doctor')).toBeInTheDocument();
      });

      expect(screen.getByText('Dr. Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('DermaCare Clinic')).toBeInTheDocument();
      expect(screen.getByText('Specialized in acne and eczema treatment with 10+ years experience')).toBeInTheDocument();
      expect(screen.getByText('jane@dermacare.com')).toBeInTheDocument();

      // Verify active status badge
      expect(screen.getByText('Active')).toBeInTheDocument();

      // Verify avatar is displayed
      const avatarImages = screen.getAllByRole('img');
      expect(avatarImages.some((img) => img.src.includes('avatar1'))).toBe(true);
    });

    it('renders gracefully when optional doctor fields are missing', async () => {
      localStorage.setItem('authUser', JSON.stringify({ id: 1, role: 'patient', email: 'p@test.com' }));

      const mockCurrentDoctor = {
        id: 1,
        full_name: 'Dr. Jane Smith',
        clinic_name: undefined,
        bio: undefined,
        avatar_url: undefined,
        email: undefined,
      };

      apiClient.get.mockImplementation((url) => {
        if (url === '/patient/my-doctor') {
          return Promise.resolve({ data: { doctor: mockCurrentDoctor } });
        }
        return Promise.resolve({ data: {} });
      });

      renderWithRouter('/patient-dashboard');

      await waitFor(() => {
        expect(screen.getByText('Your doctor')).toBeInTheDocument();
      });

      // Should display doctor name even if other fields are missing
      expect(screen.getByText('Dr. Jane Smith')).toBeInTheDocument();

      // Should not break if optional fields are undefined
      expect(screen.queryByText('undefined')).not.toBeInTheDocument();
    });

    it('displays action buttons for current doctor', async () => {
      localStorage.setItem('authUser', JSON.stringify({ id: 1, role: 'patient', email: 'p@test.com' }));

      const mockCurrentDoctor = {
        id: 1,
        full_name: 'Dr. Jane Smith',
        clinic_name: 'DermaCare Clinic',
        bio: 'Specialized in acne and eczema treatment',
        avatar_url: 'https://example.com/avatar1.jpg',
        email: 'jane@dermacare.com',
      };

      apiClient.get.mockImplementation((url) => {
        if (url === '/patient/my-doctor') {
          return Promise.resolve({ data: { doctor: mockCurrentDoctor } });
        }
        return Promise.resolve({ data: {} });
      });

      renderWithRouter('/patient-dashboard');

      await waitFor(() => {
        expect(screen.getByText('Dr. Jane Smith')).toBeInTheDocument();
      });

      // Verify action buttons are present
      const newScanButtons = screen.getAllByRole('button', { name: /New Scan/i });
      const viewHistoryButtons = screen.getAllByRole('button', { name: /View History/i });

      expect(newScanButtons.length).toBeGreaterThan(0);
      expect(viewHistoryButtons.length).toBeGreaterThan(0);
    });
  });

  describe('Email Contact', () => {
    it('renders email as clickable mailto link', async () => {
      localStorage.setItem('authUser', JSON.stringify({ id: 1, role: 'patient', email: 'p@test.com' }));

      const mockDoctors = [
        {
          id: 1,
          full_name: 'Dr. Jane Smith',
          clinic_name: 'DermaCare Clinic',
          bio: 'Specialized in acne and eczema treatment',
          avatar_url: 'https://example.com/avatar1.jpg',
          email: 'jane@dermacare.com',
        },
      ];

      apiClient.get.mockImplementation((url) => {
        if (url === '/patient/my-doctor') {
          return Promise.reject({ response: { status: 404 } });
        }
        if (url === '/doctors') {
          return Promise.resolve({ data: mockDoctors });
        }
        return Promise.resolve({ data: {} });
      });

      renderWithRouter('/patient-dashboard');

      await waitFor(() => {
        expect(screen.getByText('jane@dermacare.com')).toBeInTheDocument();
      });

      const emailLink = screen.getByText('jane@dermacare.com');
      expect(emailLink.closest('a')).toHaveAttribute('href', 'mailto:jane@dermacare.com');
    });
  });

  describe('Error Handling', () => {
    it('displays error message when doctor loading fails', async () => {
      localStorage.setItem('authUser', JSON.stringify({ id: 1, role: 'patient', email: 'p@test.com' }));

      apiClient.get.mockImplementation((url) => {
        if (url === '/patient/my-doctor') {
          return Promise.reject({ response: { status: 500 } });
        }
        return Promise.reject(new Error('Network error'));
      });

      renderWithRouter('/patient-dashboard');

      await waitFor(() => {
        expect(
          screen.getByText(/Could not load your doctor information/i)
        ).toBeInTheDocument();
      });
    });

    it('displays error message when available doctors loading fails', async () => {
      localStorage.setItem('authUser', JSON.stringify({ id: 1, role: 'patient', email: 'p@test.com' }));

      apiClient.get.mockImplementation((url) => {
        if (url === '/patient/my-doctor') {
          return Promise.reject({ response: { status: 404 } });
        }
        if (url === '/doctors') {
          return Promise.reject(new Error('Network error'));
        }
        return Promise.resolve({ data: {} });
      });

      renderWithRouter('/patient-dashboard');

      await waitFor(() => {
        expect(
          screen.getByText(/Could not load available doctors/i)
        ).toBeInTheDocument();
      });
    });
  });

  describe('No Doctors Available', () => {
    it('displays message when no doctors are available', async () => {
      localStorage.setItem('authUser', JSON.stringify({ id: 1, role: 'patient', email: 'p@test.com' }));

      apiClient.get.mockImplementation((url) => {
        if (url === '/patient/my-doctor') {
          return Promise.reject({ response: { status: 404 } });
        }
        if (url === '/doctors') {
          return Promise.resolve({ data: [] });
        }
        return Promise.resolve({ data: {} });
      });

      renderWithRouter('/patient-dashboard');

      await waitFor(() => {
        expect(
          screen.getByText(/No available doctors found yet/i)
        ).toBeInTheDocument();
      });
    });
  });
});
