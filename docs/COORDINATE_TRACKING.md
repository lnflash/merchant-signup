# Coordinates Tracking Documentation

This document describes how location coordinates (latitude and longitude) are captured and stored in the Merchant Signup application.

## Overview

The application captures location coordinates when a user selects an address using the Google Maps autocomplete feature. These coordinates are stored in the Supabase `signups` table for each submission, allowing precise location data for business and merchant accounts.

## Technical Implementation

### 1. Database Schema

The Supabase `signups` table includes the following fields for storing coordinates:

```sql
latitude FLOAT8,
longitude FLOAT8,
```

### 2. Form Components

Two main components handle address input and coordinate extraction:

- **AddressAutocomplete.tsx**: Basic autocomplete component
- **EnhancedAddressInput.tsx**: Advanced component that combines autocomplete with map display

Both components use the Google Maps Places API to extract coordinates from selected addresses.

### 3. Coordinate Extraction Process

When a user selects an address from the autocomplete dropdown:

1. The Google Places API returns a `place` object containing location data
2. The component extracts latitude and longitude using:
   ```typescript
   const lat = place.geometry.location.lat() || 0;
   const lng = place.geometry.location.lng() || 0;
   ```
3. Values are stored in the form state using React Hook Form's `setValue`:
   ```typescript
   setValue('latitude', lat, { shouldValidate: true });
   setValue('longitude', lng, { shouldValidate: true });
   ```

### 4. Form Submission

When the form is submitted:

1. The `SignupForm` component collects all form data including coordinates
2. Data is passed to the `apiService.submitSignupForm` method
3. The API service submits the data to Supabase, including coordinate values

### 5. Fallback Mechanisms

The application includes fallback mechanisms that preserve coordinates even when using alternative submission methods:

- Direct Supabase insertion fallback
- Essential fields fallback
- Minimal data fallback
- Storage fallback (storing JSON data files)

Each fallback mechanism includes code to properly format and preserve the coordinate values.

### 6. Data Type Handling

Coordinates may be received as either:

- Numeric values (e.g., `18.0179`)
- String values (e.g., `"18.0179"`)

The API service handles both formats and ensures values are properly converted to numeric format before storage:

```typescript
latitude: typeof data.latitude === 'string' ? parseFloat(data.latitude) : data.latitude;
```

## Troubleshooting

If coordinates aren't being saved correctly:

1. Check browser console logs (look for logs with 📍 emoji)
2. Verify the Google Maps API is loading correctly (check for API key issues)
3. Confirm the address selection is triggering the Place API's location data
4. Run the coordinate submission test script to verify database connectivity

## Testing

Two methods are available for testing coordinate functionality:

1. **Manual Testing**: Select an address in the form and submit, then check database
2. **Automated Testing**:
   - Run unit tests: `npm test -- coordinates.test.ts`
   - Run the test script: `node scripts/test-coordinate-submission.js`

## Related Files

- `/app/form/components/EnhancedAddressInput.tsx`
- `/app/form/components/AddressAutocomplete.tsx`
- `/app/form/components/AddressMap.tsx`
- `/src/services/api.ts`
- `/lib/validators.ts`
- `/scripts/test-coordinate-submission.js`
- `/src/__tests__/api/coordinates.test.ts`
