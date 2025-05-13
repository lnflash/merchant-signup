# Flash Merchant Signup Portal

A Next.js application for merchant onboarding to the Flash payment platform.

## Overview

This application provides a streamlined signup flow for merchants looking to accept Flash as a payment method. It collects necessary information based on account type (personal, business, merchant) and integrates with Supabase for data storage.

## Key Features

- **Multi-step Progressive Form**

  - Different flows for Personal, Business, and Merchant accounts
  - Progressive disclosure of relevant fields
  - Comprehensive validation with React Hook Form and Zod

- **Multiple Authentication Options**

  - Email + password authentication
  - Captcha verification for faster signup

- **Enhanced Location Services**

  - Google Maps integration with Places Autocomplete
  - Business address validation and visualization
  - Precise coordinate tracking (latitude/longitude)
  - Interactive map display

- **International Phone Support**

  - Support for 50+ countries with proper formatting
  - Smart validation with libphonenumber-js

- **Flash Terminal Integration**

  - Checkbox to request a Flash point-of-sale terminal
  - Proper boolean value persistence

- **Robust Form Submission**

  - Primary API route submission
  - Direct Supabase fallback for static builds
  - Multiple fallback mechanisms
  - Comprehensive error handling

- **Security Features**
  - CSRF protection
  - Row-level security policies in Supabase
  - Secure document upload

## Technical Stack

| Category            | Technology                                          |
| ------------------- | --------------------------------------------------- |
| **Framework**       | Next.js 14                                          |
| **Language**        | TypeScript                                          |
| **Styling**         | Tailwind CSS                                        |
| **Form Management** | React Hook Form                                     |
| **Validation**      | Zod                                                 |
| **Backend Storage** | Supabase                                            |
| **Maps API**        | Google Maps JavaScript API with Places Autocomplete |
| **Deployment**      | DigitalOcean App Platform (static export)           |
| **Testing**         | Jest, React Testing Library, Playwright             |

## Getting Started

### Prerequisites

- Node.js 18+
- NPM or Yarn
- Supabase account
- Google Maps API key with Places API enabled

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

3. Create a `.env.local` file:

   ```bash
   cp .env.example .env.local
   ```

4. Update the environment variables in `.env.local` with your Supabase credentials and Google Maps API key.

5. Run the development server:

   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) to see the application.

### Setting Up Supabase

1. Create a new Supabase project
2. Run the SQL from `db/supabase.sql` in the Supabase SQL editor to set up the base tables
3. Run the SQL from `db/alter-table.sql` to add required additional columns
4. Configure storage buckets:
   - `id-uploads`: For ID document storage
   - `formdata`: For fallback form storage

### Testing

```bash
# Run unit and component tests
npm test

# Run with coverage
npm run test:coverage

# Run E2E tests (requires development server to be running)
npm run test:e2e
```

## Project Structure

```
├── app/                  # Next.js app directory
│   ├── api/              # API routes
│   ├── form/             # Form pages and components
│   │   └── components/   # Form step components
│   └── layout.tsx        # Root layout
├── db/                   # Database schema files
├── lib/                  # Shared libraries
│   ├── supabase.ts       # Supabase client
│   └── validators.ts     # Zod validation schemas
├── src/                  # Source code
│   ├── services/         # Service layer
│   ├── hooks/            # Custom React hooks
│   ├── utils/            # Utility functions
│   ├── api/              # API client
│   └── types/            # TypeScript types
├── scripts/              # Build and deployment scripts
├── public/               # Public assets
└── e2e/                  # E2E tests
```

## Database Schema

The Supabase database contains a `signups` table with the following key columns:

| Column                  | Type        | Description                                       |
| ----------------------- | ----------- | ------------------------------------------------- |
| **id**                  | uuid        | Primary key                                       |
| **name**                | text        | User's full name                                  |
| **phone**               | text        | Phone number with country code                    |
| **email**               | text        | Email address (optional)                          |
| **account_type**        | enum        | 'personal', 'business', or 'merchant'             |
| **business_name**       | text        | Business name (for business/merchant accounts)    |
| **business_address**    | text        | Business address (for business/merchant accounts) |
| **latitude**            | float8      | Latitude coordinate from Google Maps              |
| **longitude**           | float8      | Longitude coordinate from Google Maps             |
| **wants_terminal**      | boolean     | Whether a Flash Terminal is requested             |
| **bank_name**           | text        | Bank name (for merchant accounts)                 |
| **bank_account_number** | text        | Account number (for merchant accounts)            |
| **id_image_url**        | text        | URL to uploaded ID document                       |
| **terms_accepted**      | boolean     | Whether terms were accepted                       |
| **created_at**          | timestamptz | Timestamp of submission                           |

## Environment Variables

See [ENVIRONMENT_VARIABLES.md](ENVIRONMENT_VARIABLES.md) for a complete list of required and optional environment variables.

## Deployment

The application is built as a static Next.js export and deployed to DigitalOcean App Platform. See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions.

## Google Maps Integration

For detailed setup of the Google Maps API integration, see [GOOGLE_MAPS_SETUP.md](GOOGLE_MAPS_SETUP.md).

## Additional Documentation

- [DEVELOPMENT.md](DEVELOPMENT.md) - Developer guide and contribution information
- [PHONE_MAP_FEATURES.md](PHONE_MAP_FEATURES.md) - Detailed information about enhanced phone and map features
- [STATIC_BUILD.md](STATIC_BUILD.md) - Information about static export configuration
- [SUPABASE_RLS_FIXES.md](SUPABASE_RLS_FIXES.md) - Row-level security policy configuration
- [ISSUES_RESOLVED.md](ISSUES_RESOLVED.md) - Documentation of issues fixed and solutions implemented

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -am 'Add my feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Submit a pull request

## Version History

See [CHANGELOG.md](CHANGELOG.md) for a detailed version history.

## License

This project is licensed under the [MIT License](LICENSE).
