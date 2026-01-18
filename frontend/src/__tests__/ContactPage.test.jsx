import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

import ContactPage from '../pages/ContactPage';

const renderContactPage = () => {
  render(
    <MemoryRouter>
      <ContactPage />
    </MemoryRouter>
  );
};

describe('ContactPage', () => {
  it('renders without crashing', () => {
    renderContactPage();
    expect(document.body).toBeInTheDocument();
  });

  it('displays "Contact Us" heading', () => {
    renderContactPage();
    expect(screen.getByRole('heading', { name: 'Contact Us', level: 1 })).toBeInTheDocument();
  });

  it('displays "Send Us a Message" form heading', () => {
    renderContactPage();
    expect(screen.getByRole('heading', { name: 'Send Us a Message' })).toBeInTheDocument();
  });

  it('renders name input field', () => {
    renderContactPage();
    expect(screen.getByLabelText('Your Name')).toBeInTheDocument();
    expect(document.getElementById('name')).toBeInTheDocument();
  });

  it('renders email input field', () => {
    renderContactPage();
    expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
    expect(document.getElementById('email')).toBeInTheDocument();
  });

  it('renders subject input field', () => {
    renderContactPage();
    expect(screen.getByLabelText('Subject')).toBeInTheDocument();
    expect(document.getElementById('subject')).toBeInTheDocument();
  });

  it('renders message textarea', () => {
    renderContactPage();
    expect(screen.getByLabelText('Message')).toBeInTheDocument();
    expect(document.getElementById('message')).toBeInTheDocument();
  });

  it('renders Send Message button', () => {
    renderContactPage();
    expect(screen.getByRole('button', { name: 'Send Message' })).toBeInTheDocument();
  });

  it('shows success message on form submit', () => {
    renderContactPage();
    
    // Fill in required fields
    fireEvent.change(screen.getByLabelText('Your Name'), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByLabelText('Email Address'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText('Subject'), { target: { value: 'Test Subject' } });
    fireEvent.change(screen.getByLabelText('Message'), { target: { value: 'Test message body' } });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: 'Send Message' }));
    
    // Check for success message
    expect(screen.getByText('Thank You!')).toBeInTheDocument();
  });

  it('shows demo disclaimer', () => {
    renderContactPage();
    expect(screen.getByText(/This is a demo form/i)).toBeInTheDocument();
  });

  it('displays emergency notice', () => {
    renderContactPage();
    expect(screen.getByText('Medical Emergency')).toBeInTheDocument();
    expect(screen.getByText('Triple Zero (000)')).toBeInTheDocument();
  });

  it('displays Contact Information heading', () => {
    renderContactPage();
    expect(screen.getByRole('heading', { name: 'Contact Information' })).toBeInTheDocument();
  });

  it('displays Support Hours heading', () => {
    renderContactPage();
    expect(screen.getByRole('heading', { name: 'Support Hours' })).toBeInTheDocument();
  });
});
