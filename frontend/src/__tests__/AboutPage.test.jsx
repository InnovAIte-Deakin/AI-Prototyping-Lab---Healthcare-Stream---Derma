import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

import AboutPage from '../pages/AboutPage';

const renderAboutPage = () => {
  render(
    <MemoryRouter>
      <AboutPage />
    </MemoryRouter>
  );
};

describe('AboutPage', () => {
  it('renders without crashing', () => {
    renderAboutPage();
    expect(document.body).toBeInTheDocument();
  });

  it('displays "About DermaAI" heading', () => {
    renderAboutPage();
    expect(screen.getByRole('heading', { name: 'About DermaAI', level: 1 })).toBeInTheDocument();
  });

  it('displays mission section', () => {
    renderAboutPage();
    expect(screen.getByRole('heading', { name: 'Our Mission' })).toBeInTheDocument();
  });

  it('displays story section', () => {
    renderAboutPage();
    expect(screen.getByRole('heading', { name: 'Our Story' })).toBeInTheDocument();
  });

  it('displays How It Works section', () => {
    renderAboutPage();
    expect(screen.getByRole('heading', { name: 'How It Works' })).toBeInTheDocument();
  });

  it('displays values section', () => {
    renderAboutPage();
    expect(screen.getByRole('heading', { name: 'Our Values' })).toBeInTheDocument();
  });

  it('displays medical disclaimer', () => {
    renderAboutPage();
    expect(screen.getByText(/Important Medical Disclaimer/i)).toBeInTheDocument();
  });

  it('contains CTA links', () => {
    renderAboutPage();
    expect(screen.getByRole('link', { name: 'Create Account' })).toHaveAttribute(
      'href',
      '/login?mode=signup'
    );
    expect(screen.getByRole('link', { name: 'Meet Our Doctors' })).toHaveAttribute(
      'href',
      '/doctors'
    );
  });
});
