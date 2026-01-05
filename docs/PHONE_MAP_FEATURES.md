# Phone Input & Map Integration Features

This document provides detailed information about the enhanced phone input and business address map integration features of the Flash Merchant Signup portal.

## Enhanced Phone Input Component

The phone input component has been significantly upgraded to support a wide range of countries with proper formatting and validation.

### Features

- **Regional Organization**: Countries are organized by region for easier selection:
  - Most Common (US/Canada, UK, Australia, Italy, Uzbekistan)
  - Caribbean countries (Bahamas, Jamaica, Trinidad, etc.)
  - Central & South American countries
  - African countries

- **Visual Indicators**:
  - Country flags for easier identification
  - Country codes displayed with country names
  - Example formats shown when input is focused

- **Smart Formatting**:
  - Automatic formatting based on country selection
  - Validation based on libphonenumber-js
  - Visual checkmark when valid phone number is entered

- **Accessibility**:
  - Proper ARIA attributes for screen readers
  - Clear focus states
  - Semantic HTML structure

### Implementation Details

The phone input component combines:

- A country code dropdown with flags and country names
- A national number input field
- Under-the-hood integration with React Hook Form
- Real-time validation using libphonenumber-js

## Google Maps Business Address Integration

The business address integration provides an enhanced user experience with address validation and map visualization.

### Features

- **Address Autocomplete**:
  - Google Places API integration for address suggestions
  - Real-time validation as user types
  - Structured address formatting

- **Interactive Map**:
  - Visual map display of the selected location
  - Marker showing the exact position
  - Zoom and pan controls

- **Geolocation Data**:
  - Automatic capture of latitude and longitude coordinates
  - Saved to Supabase database for future use
  - Proper handling of coordinate precision

- **Mobile Optimization**:
  - Collapsible map on mobile devices
  - Responsive layout for all screen sizes
  - Touch-friendly controls

- **Error Handling**:
  - Graceful fallback when API key is missing
  - Proper error messages for invalid addresses
  - Fallback to manual entry when needed

### Implementation Details

The address feature combines:

- Google Maps JavaScript API with Places library
- React components that integrate with React Hook Form
- Responsive UI with mobile-first design
- Automatic geocoding to convert addresses to coordinates

## Setup Requirements

### Phone Input Component

No additional setup required - simply use the component in your form.

### Google Maps Integration

1. Create a Google Cloud Platform project
2. Enable Maps JavaScript API, Places API, and Geocoding API
3. Create an API key with appropriate restrictions
4. Add the API key to your environment variables:
   ```
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-api-key
   ```
5. For static deployments, ensure the API key is included at build time

See `GOOGLE_MAPS_SETUP.md` for detailed setup instructions.

## Known Limitations

### Phone Input

- Some less common country formats may not be perfectly formatted
- Validation is client-side only; server validation is recommended

### Maps Integration

- Requires an internet connection for address suggestions
- API usage is subject to Google Maps quotas and billing
- May not work correctly in regions where Google Maps has limited data
