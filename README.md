# Flash Merchant Signup Portal

A Next.js application for merchant onboarding to the Flash payment platform.

## Overview

This application provides a streamlined signup flow for merchants looking to accept Flash as a payment method. It collects necessary information based on the account type selected and integrates with the Flash backend.

## Features

- Multi-step form with progressive disclosure
- Different flows for Personal, Professional, and Merchant accounts
- ID document upload for merchant verification
- Comprehensive form validation
- Integration with Supabase for data storage
- Mobile-friendly responsive design
- Flash-branded UI aligned with the design system

## Tech Stack

- **Framework**: Next.js 14
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Form Management**: React Hook Form
- **Validation**: Zod
- **Backend Storage**: Supabase
- **Deployment**: Vercel (recommended)

## Getting Started

### Prerequisites

- Node.js 18+ 
- NPM or Yarn
- Supabase account

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/lnflash/merchant-signup.git
   cd merchant-signup
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Create a `.env.local` file based on `.env.example`:
   ```bash
   cp .env.example .env.local
   ```

4. Update the environment variables in `.env.local` with your Supabase credentials.

5. Run the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) to see the application.

### Database Setup

1. Create a new Supabase project.
2. Run the SQL from `supabase.sql` in the Supabase SQL editor to set up the database schema.

## Project Structure

```
├── app/                  # Next.js app directory
│   ├── api/              # API routes
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
│   ├── services/         # API services
│   └── types/            # TypeScript types
└── supabase.sql          # Database schema
```

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

## Integration with Flash

This application is designed to integrate with the [Flash API](https://github.com/lnflash/flash). Merchant data is collected through this portal and then sent to the Flash backend for processing.

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -am 'Add my feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Submit a pull request

## Version History

- **0.2.0** - Enhanced UI with Flash design system, improved UX, and better code organization
- **0.1.0** - Initial release with basic signup functionality