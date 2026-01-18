import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

import { apiClient } from '../context/AuthContext';
import DoctorsPage from '../pages/DoctorsPage';

// Mock the API client
beforeEach(() => {
  vi.spyOn(apiClient, 'get').mockResolvedValue({ data: [] });
});

afterEach(() => {
  vi.restoreAllMocks();
});

const renderDoctorsPage = () => {
  render(
    <MemoryRouter>
      <DoctorsPage />
    </MemoryRouter>
  );
};

describe('DoctorsPage', () => {
  it('renders without crashing', () => {
    renderDoctorsPage();
    expect(document.body).toBeInTheDocument();
  });

  it('displays "Meet Our Dermatologists" heading', async () => {
    renderDoctorsPage();
    expect(
      await screen.findByRole('heading', { name: 'Meet Our Dermatologists', level: 1 })
    ).toBeInTheDocument();
  });

  it('shows loading spinner initially', () => {
    // Reset mock to not resolve immediately
    vi.spyOn(apiClient, 'get').mockImplementation(() => new Promise(() => {}));
    renderDoctorsPage();
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('displays error message when API fails', async () => {
    vi.spyOn(apiClient, 'get').mockRejectedValue(new Error('Network error'));
    renderDoctorsPage();
    await waitFor(() => {
      expect(
        screen.getByText('Unable to load doctor information at this time.')
      ).toBeInTheDocument();
    });
  });

  it('renders doctor cards when API succeeds', async () => {
    const mockDoctors = [
      { id: 1, full_name: 'Dr. Jane Smith', clinic_name: 'Test Clinic', bio: 'Test bio' },
      { id: 2, full_name: 'Dr. John Doe', clinic_name: 'Another Clinic', bio: 'Another bio' },
    ];
    vi.spyOn(apiClient, 'get').mockResolvedValue({ data: mockDoctors });
    renderDoctorsPage();
    
    await waitFor(() => {
      expect(screen.getByText('Dr. Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('Dr. John Doe')).toBeInTheDocument();
    });
  });

  it('displays "Select This Doctor" CTA links', async () => {
    const mockDoctors = [
      { id: 1, full_name: 'Dr. Test', clinic_name: 'Clinic', bio: 'Bio' },
    ];
    vi.spyOn(apiClient, 'get').mockResolvedValue({ data: mockDoctors });
    renderDoctorsPage();
    
    await waitFor(() => {
      expect(screen.getByRole('link', { name: 'Select This Doctor' })).toBeInTheDocument();
    });
  });

  it('displays credentials banner statistics', async () => {
    renderDoctorsPage();
    expect(screen.getByText('100%')).toBeInTheDocument();
    expect(screen.getByText('15+ Years')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
  });

  it('displays Our Specialist Team heading', async () => {
    renderDoctorsPage();
    expect(screen.getByRole('heading', { name: 'Our Specialist Team' })).toBeInTheDocument();
  });
});
