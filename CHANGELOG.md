# Changelog

## v1.2.0 - Terminal Checkbox and Documentation Improvements (2024-05-13)

### Major Changes

- Fixed "Do you want a Flash Terminal?" checkbox to correctly save TRUE value to database
- Revamped project documentation for better organization and comprehensiveness
- Enhanced all fallback mechanisms to ensure reliable form submissions

### Added

- **Flash Terminal Checkbox Improvements**

  - Fixed column name mismatch (`wants_terminal` vs `terminal_requested`)
  - Added explicit boolean conversion to ensure correct data type
  - Enhanced checkbox state management to prevent React Hook Form issues
  - Added comprehensive logging for debugging checkbox values

- **Documentation Enhancements**

  - Created `ISSUES_RESOLVED.md` with detailed documentation of all fixed issues
  - Created `TERMINAL_CHECKBOX.md` with comprehensive documentation of the terminal checkbox feature
  - Enhanced coordinate tracking documentation with debugging information
  - Updated README with better structure and clearer feature descriptions

- **Type Safety Improvements**
  - Enhanced null and undefined checking throughout the codebase
  - Improved type handling for boolean values
  - Fixed potential type coercion issues

### Fixed

- Issue where terminal checkbox wasn't saving TRUE values to the database
- Form state management issues with checkbox interactions
- Improved validation of checkbox values throughout form submission flow
- Enhanced field handling in all fallback submission paths

### Technical Improvements

- Added debug display for terminal checkbox state in development mode
- Improved tooltip z-index to ensure it's visible above other elements
- Enhanced error handling for checkbox state changes
- Standardized boolean handling across the codebase

## v1.1.0 - Coordinates Tracking (2024-05-13)

### Major Changes

- Added reliable location coordinates (latitude/longitude) tracking for business addresses
- Fixed account type preservation in form submissions
- Enhanced Google Maps integration with improved coordinate extraction

### Added

- **Coordinate Tracking System**

  - Added proper latitude and longitude extraction from Google Maps Places API
  - Enhanced form validation to handle coordinate data types
  - Improved database submission to reliably store coordinates
  - Added fallback handling for coordinates in all submission paths

- **Debugging and Testing**

  - Added comprehensive debug logging for coordinate tracking
  - Created test script for verifying coordinate submission
  - Added unit tests for coordinate handling in the API service

- **Documentation**
  - Added detailed documentation for the coordinate tracking feature (COORDINATE_TRACKING.md)
  - Updated README with coordinate tracking feature
  - Updated database schema documentation

### Fixed

- Issue where account type wasn't properly preserved in fallback submission modes
- Coordinate extraction and storage in all form submission paths
- Improved coordinate type handling (string vs number)
- Enhanced handling of empty or undefined coordinate values

### Technical Improvements

- Added more robust error handling for coordinate data
- Enhanced validation schema to better handle coordinate data types
- Improved form submission process to reliably include coordinate data

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
