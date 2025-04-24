# Changelog

## v1.0.0 - Production Release (2024-04-24)

### Major Changes

- Production-ready release with comprehensive improvements to Google Maps integration
- Streamlined address selection process requiring only a single selection to see the map
- Fixed type errors and enhanced type safety throughout the codebase
- Improved build process for static site deployment
- Enhanced error handling and state management

### Added

- **Enhanced Address Input Experience**

  - Fixed issue requiring double-selection of addresses in Google Maps
  - Improved state synchronization for address selection
  - Enhanced focus management for better user experience
  - Added immediate visual feedback after address selection

- **TypeScript Improvements**

  - Fixed duplicate onBlur handler issue in EnhancedAddressInput component
  - Enhanced type imports to improve build reliability
  - Fixed all TypeScript errors for production build
  - Improved component type safety

- **Build Optimizations**
  - Enhanced .gitignore to exclude test results and temporary build files
  - Improved build process for static site deployment
  - Fixed dependencies in temp build directory

### Technical Improvements

- Enhanced state management with better synchronization
- Improved React rendering cycle for map display
- Optimized event handlers to prevent conflicts
- Updated documentation with the latest changes

## v0.4.0 - Static Site Deployment Refactoring (2024-03-15)

### Major Changes

- Refactored the application to work as a static site deployed on DigitalOcean App Platform
- Fixed GitHub Actions deployment workflow to properly handle static export
- Added direct Supabase integration for static builds that works without API routes
- Enhanced credential management with multiple fallback methods

### Added

- **Direct Supabase Client Integration**

  - Created `getSupabase()` function for easy client-side Supabase access
  - Added credential detection from multiple sources (window.ENV, process.env)
  - Enhanced mock Supabase client for testing and development

- **Static API Fallbacks**

  - Implemented fallback mechanism in API service that bypasses API routes in static builds
  - Added direct Supabase form submission for static builds
  - Enhanced FileUpload component to work in static builds

- **Environment Variable Handling**

  - Improved `env-config.js` for static builds
  - Enhanced `useCredentials` hook with better fallback mechanisms
  - Added static JSON fallbacks for API credentials

- **Documentation**
  - Created `STATIC_BUILD.md` explaining the static build process
  - Added `API_ROUTES_STATIC_EXPORT.md` documenting API routes handling
  - Added `SUPABASE_STATIC_INTEGRATION.md` detailing the Supabase integration
  - Updated deployment guides

### Fixed

- Fixed `next export` command deprecation by using `output: 'export'` in next.config.js
- Fixed API routes static export issue by temporarily removing API routes during build
- Enhanced database connection status to work properly in static builds
- Improved error handling and logging throughout the application

### Technical Improvements

- Enhanced Supabase singleton pattern with credential management
- Improved developer experience with better logging and diagnostics
- Enhanced the GitHub Actions workflow for more robust deployments
- Added detailed connection status debugging

## v0.3.3 - Form Improvements and Supabase Integration

- Implemented consistent Supabase credentials across client and server
- Added comprehensive form validation
- Enhanced file upload component
- Added proper database status indicators

## v0.3.2 - Form Redesign

- Redesigned form UI with multi-step process
- Added account type selection
- Improved form validation
- Enhanced business information collection

## v0.3.1 - Initial Supabase Integration

- Added Supabase database connection
- Implemented form submission to Supabase
- Basic file upload functionality

## v0.3.0 - Initial Release

- First public version
- Basic Next.js application with signup form
- Simple database integration
