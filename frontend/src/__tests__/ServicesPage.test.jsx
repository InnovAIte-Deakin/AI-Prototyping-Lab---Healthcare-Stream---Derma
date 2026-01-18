import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

import ServicesPage from '../pages/ServicesPage';

const renderServicesPage = () => {
  render(
    <MemoryRouter>
      <ServicesPage />
    </MemoryRouter>
  );
};

describe('ServicesPage', () => {
  it('renders without crashing', () => {
    renderServicesPage();
    expect(document.body).toBeInTheDocument();
  });

  it('displays "Our Services" heading', () => {
    renderServicesPage();
    expect(screen.getByRole('heading', { name: 'Our Services', level: 1 })).toBeInTheDocument();
  });

  it('displays AI-Powered Skin Analysis service', () => {
    renderServicesPage();
    expect(screen.getByText('AI-Powered Skin Analysis')).toBeInTheDocument();
  });

  it('displays Expert Dermatologist Consultation service', () => {
    renderServicesPage();
    expect(screen.getByText('Expert Dermatologist Consultation')).toBeInTheDocument();
  });

  it('displays Secure Messaging service', () => {
    renderServicesPage();
    expect(screen.getByText('Secure Messaging')).toBeInTheDocument();
  });

  it('displays Case Management & Tracking service', () => {
    renderServicesPage();
    expect(screen.getByText('Case Management & Tracking')).toBeInTheDocument();
  });

  it('displays pricing section with beta notice', () => {
    renderServicesPage();
    expect(screen.getByText('Currently Free During Beta')).toBeInTheDocument();
  });

  it('displays How It Works section', () => {
    renderServicesPage();
    expect(screen.getByRole('heading', { name: 'How It Works' })).toBeInTheDocument();
  });

  it('displays Service Disclaimer', () => {
    renderServicesPage();
    expect(screen.getByText('Service Disclaimer')).toBeInTheDocument();
  });
});
