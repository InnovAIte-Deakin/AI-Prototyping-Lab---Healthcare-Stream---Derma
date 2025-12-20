import { render, screen, waitFor, act } from '@testing-library/react';
import { vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import PatientCasePage from '../pages/PatientCasePage';
import { AuthProvider } from '../context/AuthContext';
import * as AuthContext from '../context/AuthContext';

// Mock API Client
const mockGet = vi.fn();
const mockPost = vi.fn();

vi.mock('../context/AuthContext', async () => {
  const actual = await vi.importActual('../context/AuthContext');
  return {
    ...actual,
    apiClient: {
      get: (...args) => mockGet(...args),
      post: (...args) => mockPost(...args),
    },
    useAuth: () => ({
      user: { id: 1, role: 'patient', email: 'test@patient.com' },
      token: 'fake-token',
      login: vi.fn(),
      logout: vi.fn(),
    }),
  };
});

describe('PatientCasePage Status Logic', () => {
  const renderPage = (imageId = '123') => {
    return render(
      <AuthProvider>
        <MemoryRouter initialEntries={[`/results/${imageId}`]}>
          <Routes>
            <Route path="/results/:imageId" element={<PatientCasePage />} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders "Pending Review" badge when status is pending', async () => {
    // Mock API response
    mockGet.mockResolvedValue({
      data: {
        report_id: 1,
        image_id: 123,
        condition: 'Acne',
        review_status: 'pending',
        doctor_active: false,
        created_at: new Date().toISOString()
      }
    });

    await act(async () => {
      renderPage();
    });

    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.queryByText(/Pending Review/i)).toBeInTheDocument();
    });
    
    // Should verify "Request Review" button is NOT present
    expect(screen.queryByText(/Request Physician Review/i)).not.toBeInTheDocument();
  });

  it('renders "Physician Active" badge when status is accepted', async () => {
    // Mock API response
    mockGet.mockResolvedValue({
      data: {
        report_id: 1,
        image_id: 123,
        condition: 'Acne',
        review_status: 'accepted',
        doctor_active: true, // Active!
        created_at: new Date().toISOString()
      }
    });

    await act(async () => {
      renderPage();
    });

    await waitFor(() => {
        expect(screen.queryByText(/Physician Active/i)).toBeInTheDocument();
    });
  });

  it('renders "Review Complete" badge when status is reviewed', async () => {
    mockGet.mockResolvedValue({
      data: {
        report_id: 1,
        image_id: 123,
        condition: 'Acne',
        review_status: 'reviewed',
        doctor_active: false, // Inactive
        created_at: new Date().toISOString()
      }
    });

    await act(async () => {
      renderPage();
    });

    await waitFor(() => {
        expect(screen.queryByText(/Review Complete/i)).toBeInTheDocument();
    });
  });
});
