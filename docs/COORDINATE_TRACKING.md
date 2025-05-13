# Coordinate Tracking Feature

This document provides a comprehensive overview of the coordinate tracking feature implemented in the Flash Merchant Signup portal for capturing precise business locations.

## Overview

The application captures and stores geographic latitude and longitude coordinates when a user selects a business address using the Google Maps integration. These coordinates provide precise location data for businesses using the Flash platform, enabling accurate mapping and geolocation services.

## Technical Implementation

### Database Schema

Coordinates are stored in the `signups` table with these columns:

```sql
ALTER TABLE signups
ADD COLUMN IF NOT EXISTS latitude FLOAT8;

ALTER TABLE signups
ADD COLUMN IF NOT EXISTS longitude FLOAT8;
```

### Google Maps Integration

The coordinate extraction happens through the Google Maps Places API. When a user selects an address from the autocomplete dropdown, we extract location data:

```typescript
// In app/form/components/EnhancedAddressInput.tsx
autocomplete.addListener('place_changed', () => {
  const place = autocomplete.getPlace();

  if (!place.geometry || !place.geometry.location) {
    console.error('No coordinates found for this place');
    return;
  }

  // Extract and store the coordinates
  setValue('business_address', place.formatted_address, { shouldValidate: true });
  setValue('latitude', place.geometry.location.lat(), { shouldValidate: true });
  setValue('longitude', place.geometry.location.lng(), { shouldValidate: true });

  // Additional logging for debugging
  console.log('📍 Coordinates extracted:', {
    lat: place.geometry.location.lat(),
    lng: place.geometry.location.lng(),
  });
});
```

### Form Components

Two main components handle address input and coordinate extraction:

- **EnhancedAddressInput.tsx**: Advanced component that combines autocomplete with map display
- **AddressAutocomplete.tsx**: Basic autocomplete component for simpler implementations
- **AddressMap.tsx**: Map display component that visualizes the selected location

### Coordinate Handling in Form Submission

The coordinates are preserved throughout the form submission process:

1. **Form State**: Coordinates are stored in the React Hook Form state
2. **Validation**: No specific validation is applied (coordinates are accepted as-is from Google)
3. **Submission**: Coordinates are included in the API payload

```typescript
// In app/form/components/SignupForm.tsx
const onSubmit = async (data: SignupFormData) => {
  console.log('📍 SUBMIT COORDINATES:', {
    latitude: data.latitude,
    longitude: data.longitude,
    latitudeType: typeof data.latitude,
    longitudeType: typeof data.longitude,
  });

  // Submit the form with coordinates
  const response = await apiService.submitSignupForm(data);
  // ...
};
```

### Backend Handling

The API service ensures coordinates are preserved in all fallback paths:

```typescript
// In src/services/api.ts
// Include coordinates in the database submission
const schemaValidData = {
  // Other fields...

  // Handle latitude with proper type conversion
  ...(data.latitude !== undefined &&
  data.latitude !== null &&
  (typeof data.latitude !== 'string' || data.latitude !== '')
    ? {
        latitude: typeof data.latitude === 'string' ? parseFloat(data.latitude) : data.latitude,
      }
    : {}),

  // Handle longitude with proper type conversion
  ...(data.longitude !== undefined &&
  data.longitude !== null &&
  (typeof data.longitude !== 'string' || data.longitude !== '')
    ? {
        longitude: typeof data.longitude === 'string' ? parseFloat(data.longitude) : data.longitude,
      }
    : {}),

  // Other fields...
};
```

### Fallback Mechanisms

The application includes multiple fallback mechanisms that preserve coordinates even when using alternative submission methods:

1. **Direct Supabase insertion**: Primary method with all fields
2. **Essential fields fallback**: Simplified payload with core fields
3. **Minimal data fallback**: Minimum required fields to successfully save data
4. **Storage fallback**: JSON file storage when database insertion fails

Each fallback mechanism includes code to properly format and preserve the coordinate values.

## User Experience

From the user's perspective, the coordinate tracking happens transparently:

1. User enters a business address in the form
2. Address suggestions appear from Google Places API
3. User selects an address from the dropdown
4. A map displays showing the selected location
5. Coordinates are automatically captured without user intervention

## Testing and Verification

To test coordinate extraction:

1. Use the development environment with browser console open
2. Enter a business address and select it from the dropdown
3. Check console logs with the "📍" emoji for coordinate information
4. Complete and submit the form
5. Verify in Supabase that latitude and longitude values are saved

### Testing Methods

Two methods are available for testing coordinate functionality:

1. **Manual Testing**: Select an address in the form and submit, then check database
2. **Automated Testing**:
   - Run unit tests: `npm test -- coordinates.test.ts`
   - Run the test script: `node scripts/test-coordinate-submission.js`

## Common Issues and Solutions

### Missing Coordinates

If coordinates aren't being saved, check:

1. **Google Maps API Key**: Ensure it has Places API and Geocoding API enabled
2. **Address Selection**: Coordinates are only captured when selecting from the dropdown
3. **Network Issues**: Check for API failures in the browser console
4. **Race Conditions**: There used to be a race condition requiring double-click (now fixed)

### Double-Click Issue (Fixed)

Previously, users needed to select an address twice to get coordinates captured. This issue was fixed by:

1. Adding forced blur event handling to complete the selection process
2. Improving state management to prevent react re-renders from clearing coordinates
3. Adding comprehensive debugging to track coordinate flow

### Coordinate Type Errors

If coordinates are saved as strings or incorrect values:

1. **Type Conversion**: The application attempts to convert strings to numbers
2. **Debugging**: Check the console logs for "📍 SUPABASE DIRECT SUBMISSION COORDINATES"
3. **Browser Compatibility**: Ensure the browser supports the Places API

## API Usage

To access coordinates programmatically:

### TypeScript Interface

```typescript
interface SignupFormData {
  // Other fields...
  latitude?: number;
  longitude?: number;
}
```

### Database Query Example

```sql
-- Query merchant locations within 5km of a point
SELECT
  id,
  name,
  business_name,
  business_address,
  latitude,
  longitude,
  earth_distance(
    ll_to_earth(latitude, longitude),
    ll_to_earth(40.7128, -74.0060) -- NYC coordinates
  ) as distance
FROM
  signups
WHERE
  latitude IS NOT NULL
  AND longitude IS NOT NULL
  AND earth_distance(
    ll_to_earth(latitude, longitude),
    ll_to_earth(40.7128, -74.0060)
  ) < 5000
ORDER BY
  distance ASC;
```

## Security Considerations

- Coordinates are stored in the secured `signups` table
- Access is controlled by Supabase RLS policies
- No PII is associated with raw coordinates
- Coordinates are only available to authenticated users with appropriate permissions

## Future Improvements

Potential enhancements for the coordinate tracking feature:

1. **Coordinate Verification**: Add validation to ensure coordinates fall within expected ranges
2. **Custom Map Markers**: Allow merchants to adjust the precise location on the map
3. **Geofencing Options**: Let merchants define a service area radius
4. **Address Correction**: Offer users the ability to correct imprecise coordinates
5. **Geocoding Fallback**: Add server-side geocoding for manually entered addresses

## Related Files

- `/app/form/components/EnhancedAddressInput.tsx`
- `/app/form/components/AddressAutocomplete.tsx`
- `/app/form/components/AddressMap.tsx`
- `/app/form/components/BusinessInfoStep.tsx`
- `/app/form/components/SignupForm.tsx`
- `/src/services/api.ts`
- `/lib/validators.ts`
- `/scripts/test-coordinate-submission.js`
- `/src/__tests__/api/coordinates.test.ts`

## Related Documentation

- [GOOGLE_MAPS_SETUP.md](../GOOGLE_MAPS_SETUP.md) - Setting up the Google Maps API
- [PHONE_MAP_FEATURES.md](../PHONE_MAP_FEATURES.md) - Overview of map integration features
