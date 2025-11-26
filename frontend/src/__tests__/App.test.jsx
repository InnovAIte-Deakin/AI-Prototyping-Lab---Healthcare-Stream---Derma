import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from '../App';

describe('App Component', () => {
  it('renders without crashing', () => {
    render(<App />);
    // Since App.jsx currently just has routing or basic layout, 
    // we just check if it renders. We can add more specific assertions later.
    expect(true).toBe(true);
  });
});
