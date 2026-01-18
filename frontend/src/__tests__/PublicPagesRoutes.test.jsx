import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { apiClient } from '../context/AuthContext';

beforeEach(() => {
  // Mock doctors endpoint to return empty array for DoctorsPage
  vi.spyOn(apiClient, 'get').mockImplementation((url) => {
    if (url === '/doctors') {
      return Promise.resolve({ data: [] });
    }
    return Promise.resolve({ data: {} });
  });
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

describe('Public Pages Routes', () => {
  it('renders About page on /about', async () => {
    renderWithRouter('/about');
    expect(await screen.findByRole('heading', { name: 'About DermaAI' })).toBeInTheDocument();
  });

  it('renders Doctors page on /doctors', async () => {
    renderWithRouter('/doctors');
    expect(await screen.findByRole('heading', { name: 'Meet Our Dermatologists' })).toBeInTheDocument();
  });

  it('renders Services page on /services', async () => {
    renderWithRouter('/services');
    expect(await screen.findByRole('heading', { name: 'Our Services' })).toBeInTheDocument();
  });

  it('renders Contact page on /contact', async () => {
    renderWithRouter('/contact');
    expect(await screen.findByRole('heading', { name: 'Contact Us' })).toBeInTheDocument();
  });

  it('renders FAQ page on /faq', async () => {
    renderWithRouter('/faq');
    expect(await screen.findByRole('heading', { name: 'Frequently Asked Questions' })).toBeInTheDocument();
  });
});
