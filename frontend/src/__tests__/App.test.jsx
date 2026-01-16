import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { apiClient } from '../context/AuthContext';

beforeEach(() => {
  vi.spyOn(apiClient, 'get').mockResolvedValue({ data: {} });
  vi.spyOn(apiClient, 'post').mockResolvedValue({ data: {} });
});

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { routes } from '../App';
import { AuthProvider } from '../context/AuthContext';
import { ToastProvider } from '../context/ToastContext';

// Helper to render with router
const renderWithRouter = (initialPath) => {
  const router = createMemoryRouter(routes, {
    initialEntries: [initialPath],
  });
  render(
    <ToastProvider>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </ToastProvider>
  );
};

describe('App Component', () => {
  it('renders Landing Page by default', async () => {
    renderWithRouter('/');
    expect(await screen.findByText(/Your skin tells a story/i)).toBeInTheDocument();
    const brands = await screen.findAllByText('SkinScope');
    expect(brands.length).toBeGreaterThan(0);
  });

  it('renders Patient Dashboard on /patient-dashboard', async () => {
    localStorage.setItem('authUser', JSON.stringify({ id: 1, role: 'patient', email: 'p@test.com' }));
    renderWithRouter('/patient-dashboard');
    expect(await screen.findByText('Your Dashboard')).toBeInTheDocument();
    const brands = await screen.findAllByText('SkinScope');
    expect(brands.length).toBeGreaterThan(0);
  });

  it('renders Patient Upload on /patient-upload', async () => {
    localStorage.setItem('authUser', JSON.stringify({ id: 1, role: 'patient', email: 'p@test.com' }));
    renderWithRouter('/patient-upload');
    expect(await screen.findByText('Upload Skin Image')).toBeInTheDocument();
    const brands = await screen.findAllByText('SkinScope');
    expect(brands.length).toBeGreaterThan(0);
    expect(
      await screen.findByText(
        /AI.*not.*diagnos/i
      )
    ).toBeInTheDocument();
  });

  it('renders Doctor Dashboard on /doctor-dashboard', async () => {
    localStorage.setItem('authUser', JSON.stringify({ id: 2, role: 'doctor', email: 'd@test.com' }));
    renderWithRouter('/doctor-dashboard');
    expect(await screen.findByText('Doctor Dashboard')).toBeInTheDocument();
    const brands = await screen.findAllByText('SkinScope');
    expect(brands.length).toBeGreaterThan(0);
  });

  it('renders Doctor Patient Detail on /doctor/patients/:patientId', async () => {
    localStorage.setItem('authUser', JSON.stringify({ id: 2, role: 'doctor', email: 'd@test.com' }));
    renderWithRouter('/doctor/patients/123');
    expect(await screen.findByText('Patient Reports')).toBeInTheDocument();
    const brands = await screen.findAllByText('SkinScope');
    expect(brands.length).toBeGreaterThan(0);
    expect(
      await screen.findByText(/AI.*not.*diagnos/i)
    ).toBeInTheDocument();
  });

  it('renders Patient History on /patient-history', async () => {
    localStorage.setItem('authUser', JSON.stringify({ id: 1, role: 'patient', email: 'p@test.com' }));
    renderWithRouter('/patient-history');
    expect(await screen.findByText('Scan History')).toBeInTheDocument();
    const brands = await screen.findAllByText('SkinScope');
    expect(brands.length).toBeGreaterThan(0);
  });
});
