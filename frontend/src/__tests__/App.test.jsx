import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import App from '../App';
import { apiClient } from '../context/AuthContext';

beforeEach(() => {
  vi.spyOn(apiClient, 'get').mockResolvedValue({ data: {} });
  vi.spyOn(apiClient, 'post').mockResolvedValue({ data: {} });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('App Component', () => {
  it('renders Login Page by default', async () => {
    window.history.pushState({}, 'Test page', '/');
    render(<App />);
    expect(await screen.findByText('Log in')).toBeInTheDocument();
    const brands = await screen.findAllByText('SkinScope');
    expect(brands.length).toBeGreaterThan(0);
  });

  it('renders Patient Dashboard on /patient-dashboard', async () => {
    window.history.pushState({}, 'Test page', '/patient-dashboard');
    render(<App />);
    expect(await screen.findByText('Patient Dashboard')).toBeInTheDocument();
    expect(await screen.findByText('SkinScope')).toBeInTheDocument();
  });

  it('renders Patient Upload on /patient-upload', async () => {
    window.history.pushState({}, 'Test page', '/patient-upload');
    render(<App />);
    expect(await screen.findByText('Patient Upload')).toBeInTheDocument();
    expect(await screen.findByText('SkinScope')).toBeInTheDocument();
    expect(
      await screen.findByText(
        'This AI-generated report is not a medical diagnosis. Always consult a qualified healthcare professional.'
      )
    ).toBeInTheDocument();
  });

  it('renders Doctor Dashboard on /doctor-dashboard', async () => {
    window.history.pushState({}, 'Test page', '/doctor-dashboard');
    render(<App />);
    expect(await screen.findByText('Doctor Dashboard')).toBeInTheDocument();
    expect(await screen.findByText('SkinScope')).toBeInTheDocument();
  });

  it('renders Doctor Patient Detail on /doctor/patients/:patientId', async () => {
    window.history.pushState({}, 'Test page', '/doctor/patients/123');
    render(<App />);
    expect(await screen.findByText('Doctor Patient Detail')).toBeInTheDocument();
    expect(await screen.findByText('SkinScope')).toBeInTheDocument();
    expect(
      await screen.findByText(
        'This AI-generated report is not a medical diagnosis. Always consult a qualified healthcare professional.'
      )
    ).toBeInTheDocument();
  });

  it('renders Patient History on /patient-history', async () => {
    window.history.pushState({}, 'Test page', '/patient-history');
    render(<App />);
    expect(await screen.findByText('Patient History')).toBeInTheDocument();
    expect(await screen.findByText('SkinScope')).toBeInTheDocument();
  });
});
