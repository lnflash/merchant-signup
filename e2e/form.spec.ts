import { test, expect } from '@playwright/test';

test.describe('Merchant Signup Form', () => {
  test.beforeEach(async ({ page }) => {
    // Go to the form page - authentication will be automatically bypassed in test mode
    await page.goto('/form');

    // Wait for the Personal Information step to be visible
    await expect(page.getByText('Personal Information')).toBeVisible({ timeout: 10000 });
  });

  test('should display the personal information step after authentication', async ({ page }) => {
    await expect(page.getByText('Personal Information')).toBeVisible();
    await expect(page.getByLabel('Full Name')).toBeVisible();
    await expect(page.getByLabel('Phone Number')).toBeVisible();
  });

  test('should navigate through form steps for personal account', async ({ page }) => {
    // Fill Personal Info
    await page.getByLabel('Full Name').fill('John Doe');
    await page.getByLabel('Phone Number').fill('+12345678901');
    await page.getByRole('button', { name: 'Continue' }).click();

    // Select Personal Account Type
    await expect(page.getByText('What type of account')).toBeVisible();
    await page.getByRole('button', { name: 'Personal' }).click();

    // Should go directly to Terms for personal account
    await expect(page.getByText('Terms and Conditions')).toBeVisible();

    // Accept terms and submit
    await page.getByLabel('I agree to the Terms').check();
    await page.getByRole('button', { name: 'Submit Application' }).click();

    // Mock successful submission
    await expect(page.getByText('Application Successful')).toBeVisible({ timeout: 10000 });
  });

  test('should validate required fields', async ({ page }) => {
    // Try to continue without filling required fields
    await page.getByRole('button', { name: 'Continue' }).click();

    // Should show validation errors
    await expect(page.getByText('Name must be at least 2 characters')).toBeVisible();
    await expect(page.getByText('Please enter a valid phone number')).toBeVisible();
  });

  test('should show business fields for business account type', async ({ page }) => {
    // Fill Personal Info
    await page.getByLabel('Full Name').fill('John Doe');
    await page.getByLabel('Phone Number').fill('+12345678901');
    await page.getByRole('button', { name: 'Continue' }).click();

    // Select Business Account Type
    await page.getByRole('button', { name: 'Professional' }).click();

    // Should see business info fields
    await expect(page.getByText('Business Information')).toBeVisible();
    await expect(page.getByLabel('Business Name')).toBeVisible();
    await expect(page.getByLabel('Business Address')).toBeVisible();
  });
});
