import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

import FAQPage from '../pages/FAQPage';

const renderFAQPage = () => {
  render(
    <MemoryRouter>
      <FAQPage />
    </MemoryRouter>
  );
};

describe('FAQPage', () => {
  it('renders without crashing', () => {
    renderFAQPage();
    expect(document.body).toBeInTheDocument();
  });

  it('displays "Frequently Asked Questions" heading', () => {
    renderFAQPage();
    expect(
      screen.getByRole('heading', { name: 'Frequently Asked Questions', level: 1 })
    ).toBeInTheDocument();
  });

  it('displays General category', () => {
    renderFAQPage();
    expect(screen.getByRole('heading', { name: 'General' })).toBeInTheDocument();
  });

  it('displays AI Analysis category', () => {
    renderFAQPage();
    expect(screen.getByRole('heading', { name: 'AI Analysis' })).toBeInTheDocument();
  });

  it('displays Doctor Consultations category', () => {
    renderFAQPage();
    expect(screen.getByRole('heading', { name: 'Doctor Consultations' })).toBeInTheDocument();
  });

  it('displays Privacy & Security category', () => {
    renderFAQPage();
    expect(screen.getByRole('heading', { name: 'Privacy & Security' })).toBeInTheDocument();
  });

  it('displays Technical category', () => {
    renderFAQPage();
    expect(screen.getByRole('heading', { name: 'Technical' })).toBeInTheDocument();
  });

  it('renders first question button', () => {
    renderFAQPage();
    expect(screen.getByRole('button', { name: /What is DermaAI\?/i })).toBeInTheDocument();
  });

  it('expands accordion on click to show answer', () => {
    renderFAQPage();
    
    // Initially, the answer should not be visible
    expect(screen.queryByText(/AI-powered teledermatology platform/i)).not.toBeInTheDocument();
    
    // Click the question button
    fireEvent.click(screen.getByRole('button', { name: /What is DermaAI\?/i }));
    
    // Now the answer should be visible
    expect(screen.getByText(/AI-powered teledermatology platform/i)).toBeInTheDocument();
  });

  it('shows POC notice banner', () => {
    renderFAQPage();
    expect(screen.getByText(/This is a Proof of Concept/i)).toBeInTheDocument();
  });

  it('displays Still Have Questions section', () => {
    renderFAQPage();
    expect(screen.getByRole('heading', { name: 'Still Have Questions?' })).toBeInTheDocument();
  });
});
