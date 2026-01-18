import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

import Footer from '../components/Footer';

const renderFooter = () => {
  render(
    <MemoryRouter>
      <Footer />
    </MemoryRouter>
  );
};

describe('Footer Component', () => {
  it('renders Footer element', () => {
    renderFooter();
    expect(document.querySelector('footer')).toBeInTheDocument();
  });

  it('displays brand name DermaAI', () => {
    renderFooter();
    expect(screen.getByText('DermaAI')).toBeInTheDocument();
  });

  it('displays POC disclaimer text', () => {
    renderFooter();
    expect(
      screen.getByText(/Proof of Concept for educational purposes/i)
    ).toBeInTheDocument();
  });

  it('displays medical warning message', () => {
    renderFooter();
    expect(screen.getByText(/NOT a real medical service/i)).toBeInTheDocument();
  });

  it('contains Platform navigation links', () => {
    renderFooter();
    expect(screen.getByRole('link', { name: 'About Us' })).toHaveAttribute('href', '/about');
    expect(screen.getByRole('link', { name: 'Our Doctors' })).toHaveAttribute('href', '/doctors');
    expect(screen.getByRole('link', { name: 'Services' })).toHaveAttribute('href', '/services');
    expect(screen.getByRole('link', { name: 'Try Demo' })).toHaveAttribute('href', '/try-anonymous');
  });

  it('contains Support navigation links', () => {
    renderFooter();
    expect(screen.getByRole('link', { name: 'Contact Us' })).toHaveAttribute('href', '/contact');
    expect(screen.getByRole('link', { name: 'FAQ' })).toHaveAttribute('href', '/faq');
  });

  it('displays current year in copyright', () => {
    renderFooter();
    const currentYear = new Date().getFullYear();
    expect(screen.getByText(new RegExp(`© ${currentYear} DermaAI`))).toBeInTheDocument();
  });
});
