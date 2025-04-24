# Flash Merchant Signup Portal

A Next.js application for merchant onboarding to the Flash payment platform.

## Overview

This application provides a streamlined signup flow for merchants looking to accept Flash as a payment method. It collects necessary information based on the account type selected and integrates with the Flash backend.

## Features

- Multi-step form with progressive disclosure
- Different flows for Personal, Professional, and Merchant accounts
- ID document upload for merchant verification
- Comprehensive form validation
- Multiple authentication methods (email + password or captcha verification)
- Integration with Supabase for data storage
- Enhanced security with CSRF protection
- Mobile-friendly responsive design
- Flash-branded UI aligned with the design system
- **Enhanced phone input** with support for 50+ countries and smart formatting ([details](PHONE_MAP_FEATURES.md))
- **Google Maps integration** for address validation and interactive map display ([details](PHONE_MAP_FEATURES.md))

## Tech Stack

- **Framework**: Next.js 14
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Form Management**: React Hook Form
- **Validation**: Zod
- **Backend Storage**: Supabase
- **Maps API**: Google Maps JavaScript API with Places Autocomplete
- **Deployment**: DigitalOcean App Platform
- **Testing**: Jest, React Testing Library, Playwright

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
   cp .env/.env.example .env.local
   ```

4. Update the environment variables in `.env.local` with your Supabase credentials and Google Maps API key.

5. Run the development server:

   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) to see the application.

### Testing

```bash
# Run unit and component tests
npm test

# Run with coverage
npm run test:coverage

# Run E2E tests (requires development server to be running)
npm run test:e2e
```

### Database Setup

1. Create a new Supabase project.
2. Run the SQL from `supabase.sql` in the Supabase SQL editor to set up the database schema.

## Project Structure

```
├── app/                  # Next.js app directory
│   ├── api/              # API routes
│   │   ├── health/       # Health check endpoint
│   │   └── submit/       # Form submission endpoint
│   ├── form/             # Form pages and components
│   │   └── components/   # Form step components
│   └── layout.tsx        # Root layout
├── lib/                  # Shared libraries
│   ├── supabase.ts       # Supabase client
│   └── validators.ts     # Zod validation schemas
├── public/               # Public assets
│   └── images/           # Image assets
│       └── logos/        # Logo files
├── src/                  # Source code
│   ├── config/           # Application configuration
│   ├── hooks/            # Custom React hooks
│   ├── utils/            # Utility functions
│   ├── api/              # API client
│   ├── mocks/            # MSW mocks for testing
│   └── types/            # TypeScript types
├── e2e/                  # E2E tests
├── .github/              # GitHub workflows
├── .husky/               # Git hooks
├── .env/                 # Environment examples
└── jest.config.js        # Jest configuration
```

## Continuous Integration

This project uses GitHub Actions for continuous integration with the following jobs:

- Type checking
- Linting
- Unit testing
- E2E testing

## Database Schema

The Supabase database contains a `signups` table with the following schema:

- **id** (uuid, primary key)
- **name** (text)
- **phone** (text)
- **email** (text, optional)
- **account_type** (enum: personal, business, merchant)
- **business_name** (text, optional)
- **business_address** (text, optional)
- **latitude** (float8, optional)
- **longitude** (float8, optional)
- **bank_name** (text, optional)
- **bank_account_type** (text, optional)
- **account_currency** (text, optional)
- **bank_account_number** (text, optional)
- **bank_branch** (text, optional)
- **id_image_url** (text, optional)
- **terms_accepted** (boolean)
- **created_at** (timestamp with time zone, default: now())

## Environment Variables

| Variable                        | Description                                   | Required |
| ------------------------------- | --------------------------------------------- | -------- |
| NEXT_PUBLIC_SUPABASE_URL        | Your Supabase project URL                     | Yes      |
| NEXT_PUBLIC_SUPABASE_ANON_KEY   | Your Supabase anonymous key                   | Yes      |
| NEXT_PUBLIC_API_BASE_URL        | Base URL for API endpoints (defaults to /api) | No       |
| NEXT_PUBLIC_FLASH_API_URL       | URL for Flash API integration                 | No       |
| NEXT_PUBLIC_GOOGLE_MAPS_API_KEY | Google Maps API key for address validation    | Yes      |

## Integration with Flash

This application is designed to integrate with the Flash API. Merchant data is collected through this portal and then sent to the Flash backend for processing.

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -am 'Add my feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Submit a pull request

## Version History

- **1.0.0** - Production-ready release:

  - Improved Google Maps integration with streamlined address selection
  - Fixed address input UX to require only single selection
  - Optimized static build process for production deployment
  - Enhanced error handling and state management
  - Fixed all TypeScript errors and improved code quality
  - Added comprehensive logging for API interactions
  - Fully tested across all supported browsers and devices

- **0.4.0** - Enhanced features:

  - Added Google Maps integration for address validation and geolocation
  - Replaced phone verification with captcha authentication for simpler onboarding
  - Implemented international phone input with 50+ countries supported
  - Added interactive map display for business address validation
  - Improved mobile experience with responsive map controls

- **0.3.0** - Authentication improvements:

  - Added phone-based authentication
  - Improved security with CSRF protection
  - Enhanced error handling and validation

- **0.2.0** - UI/UX improvements:

  - Enhanced UI with Flash design system
  - Improved UX and form flow
  - Better code organization and performance optimization

- **0.1.0** - Initial release:
  - Basic signup functionality
  - Core form validation
  - Integration with Supabase backend
