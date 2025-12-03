import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from '../App';

describe('App Component', () => {
  it('renders Login Page by default', () => {
    window.history.pushState({}, 'Test page', '/');
    render(<App />);
    expect(screen.getByText('Login')).toBeInTheDocument();
    expect(screen.getByText('DermaAI')).toBeInTheDocument();
  });

  it('renders Patient Dashboard on /patient-dashboard', () => {
    window.history.pushState({}, 'Test page', '/patient-dashboard');
    render(<App />);
    expect(screen.getByText('Patient Dashboard')).toBeInTheDocument();
    expect(screen.getByText('DermaAI')).toBeInTheDocument();
  });

  it('renders Patient Upload on /patient-upload', () => {
    window.history.pushState({}, 'Test page', '/patient-upload');
    render(<App />);
    expect(screen.getByText('Patient Upload')).toBeInTheDocument();
    expect(screen.getByText('DermaAI')).toBeInTheDocument();
  });

  it('renders Doctor Dashboard on /doctor-dashboard', () => {
    window.history.pushState({}, 'Test page', '/doctor-dashboard');
    render(<App />);
    expect(screen.getByText('Doctor Dashboard')).toBeInTheDocument();
    expect(screen.getByText('DermaAI')).toBeInTheDocument();
  });

  it('renders Doctor Patient Detail on /doctor-patient-detail', () => {
    window.history.pushState({}, 'Test page', '/doctor-patient-detail');
    render(<App />);
    expect(screen.getByText('Doctor Patient Detail')).toBeInTheDocument();
    expect(screen.getByText('DermaAI')).toBeInTheDocument();
  });
});
