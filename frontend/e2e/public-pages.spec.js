/**
 * Public Pages E2E Tests
 * 
 * Verifies the new clinic realism pages load correctly and navigation works.
 * Tests the static content pages, footer, and form interactions.
 */
import { test, expect } from '@playwright/test';

test.describe('Public Pages Navigation', () => {

  test('Landing page displays all sections', async ({ page }) => {
    await page.goto('/');
    
    // Hero section
    await expect(page.getByText('DermaAI Platform')).toBeVisible();
    await expect(page.getByRole('heading', { name: /Identify skin concerns/i })).toBeVisible();
    
    // How It Works section
    await expect(page.getByRole('heading', { name: 'How It Works' })).toBeVisible();
    
    // Partner Clinics section
    await expect(page.getByRole('heading', { name: 'Our Partner Clinics' })).toBeVisible();
    
    // Testimonials section
    await expect(page.getByRole('heading', { name: 'Trusted by Patients' })).toBeVisible();
    
    // Footer
    await expect(page.locator('footer')).toBeVisible();
  });

  test('Header shows public navigation links when not logged in', async ({ page }) => {
    await page.goto('/');
    
    // Check navigation links are visible
    await expect(page.locator('header').getByRole('link', { name: 'About' })).toBeVisible();
    await expect(page.locator('header').getByRole('link', { name: 'Doctors' })).toBeVisible();
    await expect(page.locator('header').getByRole('link', { name: 'Services' })).toBeVisible();
    await expect(page.locator('header').getByRole('link', { name: 'Contact' })).toBeVisible();
    await expect(page.locator('header').getByRole('link', { name: 'Login' })).toBeVisible();
  });

  test('Navigate to About page via header', async ({ page }) => {
    await page.goto('/');
    await page.locator('header').getByRole('link', { name: 'About' }).click();
    
    await expect(page).toHaveURL('/about');
    await expect(page.getByRole('heading', { name: 'About DermaAI', level: 1 })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Our Mission' })).toBeVisible();
  });

  test('Navigate to Doctors page via header', async ({ page }) => {
    await page.goto('/');
    await page.locator('header').getByRole('link', { name: 'Doctors' }).click();
    
    await expect(page).toHaveURL('/doctors');
    await expect(page.getByRole('heading', { name: 'Meet Our Dermatologists', level: 1 })).toBeVisible();
  });

  test('Navigate to Services page via header', async ({ page }) => {
    await page.goto('/');
    await page.locator('header').getByRole('link', { name: 'Services' }).click();
    
    await expect(page).toHaveURL('/services');
    await expect(page.getByRole('heading', { name: 'Our Services', level: 1 })).toBeVisible();
  });

  test('Navigate to Contact page via header', async ({ page }) => {
    await page.goto('/');
    await page.locator('header').getByRole('link', { name: 'Contact' }).click();
    
    await expect(page).toHaveURL('/contact');
    await expect(page.getByRole('heading', { name: 'Contact Us', level: 1 })).toBeVisible();
  });

  test('Navigate to FAQ page via footer', async ({ page }) => {
    await page.goto('/');
    
    // Scroll to footer and click FAQ link
    await page.locator('footer').scrollIntoViewIfNeeded();
    await page.locator('footer').getByRole('link', { name: 'FAQ' }).click();
    
    await expect(page).toHaveURL('/faq');
    await expect(page.getByRole('heading', { name: 'Frequently Asked Questions', level: 1 })).toBeVisible();
  });

  test('Contact form shows success message on submit', async ({ page }) => {
    await page.goto('/contact');
    
    // Fill in the form
    await page.fill('#name', 'Test User');
    await page.fill('#email', 'test@example.com');
    await page.fill('#subject', 'Test Subject');
    await page.fill('#message', 'This is a test message for the contact form.');
    
    // Submit the form
    await page.getByRole('button', { name: 'Send Message' }).click();
    
    // Check for success message
    await expect(page.getByText('Thank You!')).toBeVisible();
    await expect(page.getByText(/Your message has been received/i)).toBeVisible();
  });

  test('FAQ accordion expands on click', async ({ page }) => {
    await page.goto('/faq');
    
    // The answer should not be visible initially
    await expect(page.getByText(/AI-powered teledermatology platform/i)).not.toBeVisible();
    
    // Click the question
    await page.getByRole('button', { name: /What is DermaAI\?/i }).click();
    
    // The answer should now be visible
    await expect(page.getByText(/AI-powered teledermatology platform/i)).toBeVisible();
  });

  test('Footer displays on all public pages', async ({ page }) => {
    const publicPages = ['/about', '/doctors', '/services', '/contact', '/faq'];
    
    for (const pagePath of publicPages) {
      await page.goto(pagePath);
      await expect(page.locator('footer')).toBeVisible();
      // Use exact: true to avoid matching email addresses or copyright text containing 'DermaAI'
      await expect(page.locator('footer').getByText('DermaAI', { exact: true })).toBeVisible();
    }
  });

});
