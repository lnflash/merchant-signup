# Test info

- Name: Merchant Signup Form >> should display the personal information step after authentication
- Location: /Users/dread/Documents/Island-Bitcoin/Flash/merchant-signup/e2e/form.spec.ts:12:7

# Error details

```
Error: page.goto: Target page, context or browser has been closed
Call log:
  - navigating to "http://localhost:3000/form", waiting until "load"

    at /Users/dread/Documents/Island-Bitcoin/Flash/merchant-signup/e2e/form.spec.ts:6:16
```

# Test source

```ts
   1 | import { test, expect } from '@playwright/test';
   2 |
   3 | test.describe('Merchant Signup Form', () => {
   4 |   test.beforeEach(async ({ page }) => {
   5 |     // Go to the form page - authentication will be automatically bypassed in test mode
>  6 |     await page.goto('/form');
     |                ^ Error: page.goto: Target page, context or browser has been closed
   7 |
   8 |     // Wait for the Personal Information step to be visible
   9 |     await expect(page.getByText('Personal Information')).toBeVisible({ timeout: 10000 });
  10 |   });
  11 |
  12 |   test('should display the personal information step after authentication', async ({ page }) => {
  13 |     await expect(page.getByText('Personal Information')).toBeVisible();
  14 |     await expect(page.getByLabel('Full Name')).toBeVisible();
  15 |     await expect(page.getByLabel('Phone Number')).toBeVisible();
  16 |   });
  17 |
  18 |   test('should navigate through form steps for personal account', async ({ page }) => {
  19 |     // Fill Personal Info
  20 |     await page.getByLabel('Full Name').fill('John Doe');
  21 |     await page.getByLabel('Phone Number').fill('+12345678901');
  22 |     await page.getByRole('button', { name: 'Continue' }).click();
  23 |
  24 |     // Select Personal Account Type
  25 |     await expect(page.getByText('What type of account')).toBeVisible();
  26 |     await page.getByRole('button', { name: 'Personal' }).click();
  27 |
  28 |     // Should go directly to Terms for personal account
  29 |     await expect(page.getByText('Terms and Conditions')).toBeVisible();
  30 |
  31 |     // Accept terms and submit
  32 |     await page.getByLabel('I agree to the Terms').check();
  33 |     await page.getByRole('button', { name: 'Submit Application' }).click();
  34 |
  35 |     // Mock successful submission
  36 |     await expect(page.getByText('Application Successful')).toBeVisible({ timeout: 10000 });
  37 |   });
  38 |
  39 |   test('should validate required fields', async ({ page }) => {
  40 |     // Try to continue without filling required fields
  41 |     await page.getByRole('button', { name: 'Continue' }).click();
  42 |
  43 |     // Should show validation errors
  44 |     await expect(page.getByText('Name must be at least 2 characters')).toBeVisible();
  45 |     await expect(page.getByText('Please enter a valid phone number')).toBeVisible();
  46 |   });
  47 |
  48 |   test('should show business fields for business account type', async ({ page }) => {
  49 |     // Fill Personal Info
  50 |     await page.getByLabel('Full Name').fill('John Doe');
  51 |     await page.getByLabel('Phone Number').fill('+12345678901');
  52 |     await page.getByRole('button', { name: 'Continue' }).click();
  53 |
  54 |     // Select Business Account Type
  55 |     await page.getByRole('button', { name: 'Professional' }).click();
  56 |
  57 |     // Should see business info fields
  58 |     await expect(page.getByText('Business Information')).toBeVisible();
  59 |     await expect(page.getByLabel('Business Name')).toBeVisible();
  60 |     await expect(page.getByLabel('Business Address')).toBeVisible();
  61 |   });
  62 | });
  63 |
```
