# Flash Merchant Signup - Developer Guide

This development guide provides comprehensive documentation for understanding and contributing to the Flash Merchant Signup application.

## Table of Contents

- [Project Overview](#project-overview)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Form Submission Flow](#form-submission-flow)
- [Database Schema](#database-schema)
- [Enhanced Features](#enhanced-features)
  - [Phone Input Component](#phone-input-component)
  - [Google Maps Integration](#google-maps-integration)
- [Static Build Considerations](#static-build-considerations)
- [Common Development Tasks](#common-development-tasks)
- [Testing](#testing)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [Contributing Guidelines](#contributing-guidelines)

## Project Overview

Flash Merchant Signup is a web application designed to onboard merchants to the Flash payment platform. It collects information from different types of users (personal, business, and merchant accounts) through a multi-step form and submits this data to a Supabase backend.

### Key Features

- Multi-step form with progressive validation
- Support for different account types with conditional fields
- ID document upload capability
- Works in both dynamic (with API routes) and static build environments
- Multiple fallback mechanisms for data persistence
- Responsive design for all device types

### Technical Stack

- **Frontend**: Next.js 14.x with TypeScript
- **Styling**: Tailwind CSS
- **Form Handling**: React Hook Form with Zod validation
- **Backend**: Supabase (PostgreSQL + Storage)
- **Deployment**: DigitalOcean App Platform (static build)
- **CI/CD**: GitHub Actions

## Architecture

The application follows a hybrid architecture that can operate in two modes:

1. **Dynamic Build Mode**: Uses Next.js API routes for server-side processing
2. **Static Build Mode**: Operates entirely client-side with direct Supabase connections

### Dynamic Build Flow

```
Client → Next.js API Routes → Supabase Database/Storage
```

### Static Build Flow

```
Client → Direct Supabase Connection → Supabase Database/Storage
                ↓
         Fallback Mechanisms
                ↓
         Storage as JSON Files
```

## Getting Started

### Prerequisites

- Node.js 18.x or later
- npm or yarn
- Git
- Supabase account and project

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/lnflash/merchant-signup.git
   cd merchant-signup
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Set up environment variables by creating a `.env.local` file:

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

### Environment Variables

| Variable                        | Purpose                           | Required |
| ------------------------------- | --------------------------------- | -------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Supabase project URL              | Yes      |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous API key        | Yes      |
| `NEXT_PUBLIC_API_BASE_URL`      | Custom API base URL (optional)    | No       |
| `NEXT_PUBLIC_IS_DIGITALOCEAN`   | Flag for DigitalOcean deployments | No       |

## Project Structure

### Key Directories

```
merchant-signup/
├── app/                    # Next.js app directory
│   ├── api/                # API route handlers
│   ├── form/               # Form page components
│   │   └── components/     # Form-specific components
│   ├── layout.tsx          # Root layout component
│   └── page.tsx            # Homepage component
├── db/                     # Database schema files
├── e2e/                    # End-to-end tests
├── lib/                    # Shared utilities
├── public/                 # Static assets
├── scripts/                # Build and deployment scripts
└── src/                    # Application source code
    ├── __tests__/          # Unit tests
    ├── api/                # API client code
    ├── components/         # Shared React components
    ├── hooks/              # Custom React hooks
    ├── services/           # Service layer
    ├── types/              # TypeScript type definitions
    └── utils/              # Utility functions
```

### Key Files

- `app/form/page.tsx`: The main form page
- `app/form/components/SignupForm.tsx`: The top-level form component
- `app/form/components/TestSubmit.jsx`: Component for testing submissions
- `app/api/submit/route.ts`: API route for form submissions
- `src/services/api.ts`: API service with fallback mechanisms
- `lib/supabase-singleton.ts`: Supabase client singleton
- `lib/validators.ts`: Zod validation schemas
- `db/supabase.sql`: Database schema definition
- `db/alter-table.sql`: Additional columns definition
- `SUPABASE_RLS_FIXES.md`: Documentation for RLS policy setup

## Form Submission Flow

The form submission process follows different paths depending on the build type:

### Dynamic Build (Development)

1. User completes the form
2. Client-side validation with Zod schemas
3. Form data sent to `/api/submit` endpoint via fetch
4. API route processes the data and inserts into Supabase
5. Success/error response returned to client

### Static Build (Production)

1. User completes the form
2. Client-side validation with Zod schemas
3. Direct submission to Supabase using the following fallback chain:

   a. Primary: Insert into 'signups' table with full data  
   b. Fallback 1: Insert into 'signups' table with essential fields  
   c. Fallback 2: Insert into 'signups' table with minimal data  
   d. Fallback 3: Store as JSON file in 'formdata' storage bucket  
   e. Fallback 4: Try alternative storage buckets (public, id-uploads, forms)  
   f. Final fallback: Return success to avoid user frustration

## Database Schema

### Signups Table

The primary table for storing form submissions:

```sql
CREATE TABLE signups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  account_type TEXT NOT NULL CHECK (account_type IN ('personal', 'business', 'merchant')),
  business_name TEXT,
  business_address TEXT,
  latitude FLOAT8,
  longitude FLOAT8,
  bank_name TEXT,
  bank_account_type TEXT,
  account_currency TEXT,
  bank_account_number TEXT,
  bank_branch TEXT,
  id_image_url TEXT,
  terms_accepted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Additional metadata columns
  client_version TEXT,
  submission_source TEXT,
  user_agent TEXT,
  submitted_at TIMESTAMPTZ,
  timestamp TEXT,
  attempt TEXT,
  device_info JSONB
);
```

### Storage Buckets

The application uses several storage buckets with specific purposes:

1. `id-uploads`: For storing ID document images
2. `formdata`: Public bucket for form submission JSON files (fallback)
3. `public`: General purpose public bucket (secondary fallback)
4. `forms`: Additional fallback for form data

## Enhanced Features

The application includes several enhanced features to improve user experience and data collection. For detailed user-facing documentation, see [PHONE_MAP_FEATURES.md](PHONE_MAP_FEATURES.md).

### Phone Input Component

The application includes an enhanced phone input component with support for 50+ countries.

#### Implementation

- **File**: `app/form/components/PhoneInput.tsx`
- **Dependencies**: `libphonenumber-js` for formatting and validation
- **Integration**: Used in the first step of the form

The phone component is implemented with the following features:

```typescript
// Country codes structure
const COUNTRY_CODES = {
  common: [
    {
      code: '+1',
      label: 'US/Canada',
      flag: '🇺🇸',
      example: '(201) 555-0123',
      format: '(XXX) XXX-XXXX',
    },
    // More countries...
  ],
  caribbean: [
    { code: '+1242', label: 'Bahamas', flag: '🇧🇸', example: '359-1234', format: 'XXX-XXXX' },
    // More countries...
  ],
  latinAmerica: [
    // Latin American countries...
  ],
  africa: [
    // African countries...
  ],
};
```

The component uses React Hook Form's `Controller` pattern to maintain both the country code and national number separately while providing a single combined value to the form.

#### Customization

To add or modify supported countries, edit the `COUNTRY_CODES` object in `PhoneInput.tsx`. Each country requires:

- `code`: International dialing code
- `label`: Country name
- `flag`: Emoji flag
- `example`: Example number format
- `format`: Format pattern for display

### Google Maps Integration

The application integrates Google Maps for enhanced address input with validation and geolocation.

#### Components

1. **AddressAutocomplete**:

   - **File**: `app/form/components/AddressAutocomplete.tsx`
   - **Purpose**: Provides address suggestions and validation using Google Places API

2. **AddressMap**:
   - **File**: `app/form/components/AddressMap.tsx`
   - **Purpose**: Displays a map with the selected location

#### API Key Configuration

The Google Maps integration requires an API key configured in environment variables:

```
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here
```

For static builds, this key is embedded at build time via the `env` section in `next.config.js`.

#### Implementation Details

The map integration captures latitude and longitude coordinates when an address is selected:

```typescript
// When a place is selected from autocomplete
setValue('business_address', place.formatted_address, { shouldValidate: true });
setValue('latitude', place.geometry.location?.lat() || 0, { shouldValidate: true });
setValue('longitude', place.geometry.location?.lng() || 0, { shouldValidate: true });
```

To customize or extend the map functionality, modify the following files:

- `AddressAutocomplete.tsx`: For address input behavior
- `AddressMap.tsx`: For map display options
- `BusinessInfoStep.tsx`: For integration with the form

### Row-Level Security (RLS) Policies

Critical RLS policies for the application:

1. **Signups Table**:

   ```sql
   CREATE POLICY "Allow inserts for everyone" ON signups
     FOR INSERT TO authenticated, anon WITH CHECK (true);

   CREATE POLICY "Allow reads for authenticated users only" ON signups
     FOR SELECT USING (auth.role() = 'authenticated');
   ```

2. **Storage Buckets**:

   ```sql
   CREATE POLICY "Allow anonymous uploads to formdata" ON storage.objects
     FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'formdata');

   CREATE POLICY "Allow public access to formdata" ON storage.objects
     FOR SELECT TO anon, authenticated USING (bucket_id = 'formdata');

   CREATE POLICY "Allow authenticated uploads" ON storage.objects
     FOR INSERT TO authenticated WITH CHECK (bucket_id = 'id-uploads');

   CREATE POLICY "Allow authenticated downloads" ON storage.objects
     FOR SELECT TO authenticated USING (bucket_id = 'id-uploads');
   ```

## Static Build Considerations

The application is primarily deployed as a static build on DigitalOcean App Platform, which requires special handling:

### Environment Variable Injection

Environment variables are injected into the build at build time via the `window.ENV` object. The build process sets this up in `public/env-config.js`.

### API Route Handling

Since API routes aren't available in a static build, the application uses:

1. Direct Supabase connection from the client
2. Multiple fallback mechanisms for data persistence
3. Robust error handling to ensure user success

### Routes Configuration

The `routes.json` file configures DigitalOcean App Platform routing:

```json
{
  "routes": [
    { "handle": "filesystem" },
    { "src": "/form", "dest": "/form/index.html", "status": 200 },
    { "src": "/form/", "dest": "/form/index.html", "status": 200 },
    { "src": "/form/(.*)", "dest": "/form/index.html", "status": 200 },
    { "src": "/(.*)", "dest": "/index.html", "status": 200 }
  ]
}
```

## Common Development Tasks

### Adding a New Form Field

1. **Update the TypeScript Interface**:

   ```typescript
   // src/types.ts
   export interface SignupFormData {
     // Existing fields...
     new_field?: string;
   }
   ```

2. **Add the Field to Zod Schema**:

   ```typescript
   // lib/validators.ts
   export const signupFormSchema = z.object({
     // Existing fields...
     new_field: z.string().optional(),
   });
   ```

3. **Add the Field to the Database**:

   ```sql
   -- Run in Supabase SQL Editor
   ALTER TABLE signups ADD COLUMN IF NOT EXISTS new_field TEXT;
   ```

4. **Update Form Components**:

   ```tsx
   // Add to appropriate step component
   <input {...register('new_field')} className="form-input" />
   ```

5. **Update Data Handling in API Service**:
   ```typescript
   // src/services/api.ts
   const schemaValidData = {
     // Existing fields...
     ...(data.new_field ? { new_field: data.new_field } : {}),
   };
   ```

### Modifying Validation Rules

1. **Update the Zod Schema**:

   ```typescript
   // lib/validators.ts
   export const signupFormSchema = z.object({
     // Other fields...
     email: z.string().email('Valid email is required').min(1, 'Email is required'),
   });
   ```

2. **Update Form Components for Error Display**:
   ```tsx
   {
     errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>;
   }
   ```

### Adding a New Account Type

1. **Update the Account Type Enum**:

   ```typescript
   // src/types.ts
   export interface SignupFormData {
     account_type: 'personal' | 'business' | 'merchant' | 'new_type';
   }
   ```

2. **Update Database Schema**:

   ```sql
   -- Update the check constraint
   ALTER TABLE signups DROP CONSTRAINT signups_account_type_check;
   ALTER TABLE signups ADD CONSTRAINT signups_account_type_check
     CHECK (account_type IN ('personal', 'business', 'merchant', 'new_type'));
   ```

3. **Add New Steps or Fields for the Account Type**:
   ```tsx
   {
     accountType === 'new_type' && (
       <NewTypeInfoStep currentStep={currentStep} setCurrentStep={setCurrentStep} />
     );
   }
   ```

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- src/__tests__/api/submit.test.ts

# Run e2e tests
npm run test:e2e
```

### Key Test Files

- `src/__tests__/api/submit.test.ts`: Tests for the submission API
- `src/__tests__/hooks/useFormStep.test.ts`: Tests for the form step hook
- `e2e/form.spec.ts`: End-to-end tests for the form

### Writing Tests

When adding new functionality, create appropriate tests:

```typescript
// Example test for a new field validation
test('validates new field correctly', () => {
  const result = signupFormSchema.safeParse({
    // Minimum required fields
    name: 'Test User',
    phone: '+1234567890',
    account_type: 'personal',
    terms_accepted: true,
    // New field with invalid value
    new_field: '',
  });

  expect(result.success).toBe(false);
  expect(result.error.errors[0].path).toContain('new_field');
});
```

## Deployment

### Building for Production

```bash
# Regular Next.js build
npm run build

# Static export build
npm run build:static
```

### Deployment to DigitalOcean App Platform

The application uses GitHub Actions for CI/CD to DigitalOcean:

```yaml
# Key steps in .github/workflows/deploy.yml
- name: Build Next.js
  run: npm run build:static

- name: Create routes.json
  run: node scripts/create-routes-config.js

- name: Deploy to DigitalOcean App Platform
  uses: digitalocean/app_action@v1.1.5
  with:
    app_name: ${{ secrets.DIGITALOCEAN_APP_NAME }}
    token: ${{ secrets.DIGITALOCEAN_ACCESS_TOKEN }}
    images: '[{"name": "next-app", "registry_type": "DOCR", "repository": "merchant-signup", "tag": "${{ github.sha }}"}]'
```

### Manual Deployment

If needed, you can manually deploy:

1. Build the static export: `npm run build:static`
2. Create routes.json: `node scripts/create-routes-config.js`
3. Deploy the `out` directory to your hosting platform

## Troubleshooting

### Common Issues

#### 1. Form Submission Fails in Static Build

**Symptoms**:

- Form submits successfully in development but fails in production
- Console shows: "Error inserting into signups table"

**Solution**:

- Check that Supabase RLS policies are correctly set up
- Verify environment variables are properly injected
- Check for schema mismatches between form and database

#### 2. Missing Columns Error

**Symptoms**:

- Error: "Could not find the 'column_name' column of 'signups'"

**Solution**:

- Run the ALTER TABLE commands from db/alter-table.sql
- Update the submission code to not include non-existent columns

#### 3. Storage Access Denied

**Symptoms**:

- "Error storing in bucket: Object { statusCode: '403', error: 'Unauthorized' }"

**Solution**:

- Verify RLS policies for storage buckets
- Create the required storage buckets if missing
- Check that bucket names use hyphens, not underscores (e.g., 'id-uploads')

### Debugging Tips

1. **Enable Detailed Logging**:

   ```javascript
   console.log('Form data being submitted:', data);
   ```

2. **Check Browser Network Tab**:

   - Look for failed requests to Supabase endpoints
   - Examine response codes and bodies

3. **Test with TestSubmit Component**:

   - Use the TestSubmit component for isolated submission testing
   - Check console for detailed error messages

4. **Verify Environment Variables**:
   ```javascript
   console.log('Environment: ', {
     hasUrl: !!window.ENV?.SUPABASE_URL,
     hasKey: !!window.ENV?.SUPABASE_KEY,
   });
   ```

## Contributing Guidelines

### Pull Request Process

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes with descriptive messages
4. Push to your fork and submit a pull request
5. Include details about:
   - What the change does
   - Why it's needed
   - Any testing considerations

### Code Style

- Follow TypeScript best practices
- Use ESLint and Prettier for code formatting
- Write descriptive variable and function names
- Include JSDoc comments for complex functions

### Documentation

- Keep DEVELOPMENT.md up to date as the application evolves
- Document new environment variables
- Comment complex logic sections
- Update Supabase schema documentation when table structure changes

### Testing Requirements

- Add tests for new functionality
- Ensure existing tests pass
- Test in both development and static build environments
- Verify form submissions work end-to-end

---

## For AI Agent Assistants

If you're an AI assistant helping with this codebase, here are some important aspects to note:

1. **The dual-mode architecture**: The app can run with API routes or as a static build with direct Supabase connections.

2. **Multiple fallback mechanisms**: The submission code includes several fallbacks to ensure data persistence.

3. **Type safety is critical**: The TypeScript types must align with the database schema.

4. **RLS policies matter**: Proper Supabase RLS policies are essential for the application to work.

5. **Environment variable handling**: Variables are injected at build time for static deployments.

When suggesting changes:

- Consider both dynamic and static build environments
- Ensure proper error handling
- Keep TypeScript types in sync with database schema
- Maintain the fallback chain for submissions
- Test suggestions in both environments when possible

---

This developer guide is a living document. If you find outdated information or need clarification, please submit a PR to update it.
