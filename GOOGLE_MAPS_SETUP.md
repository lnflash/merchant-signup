# Setting Up Google Maps API for Address Validation

This guide will help you set up the Google Maps JavaScript API with Places Autocomplete for address validation in the Flash Merchant Signup application.

For detailed information about the map and address features, see [PHONE_MAP_FEATURES.md](PHONE_MAP_FEATURES.md).

## Prerequisites

1. Google Cloud Platform account
2. A Google Cloud Platform project
3. Billing enabled on your project (required for Google Maps APIs)

## Step 1: Create a Google Cloud Platform Project

If you don't already have a project:

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" at the top of the page
3. Click "New Project"
4. Name your project and click "Create"

## Step 2: Enable the Required APIs

1. Navigate to the [API Library](https://console.cloud.google.com/apis/library)
2. Search for and enable these APIs:
   - Google Maps JavaScript API
   - Places API
   - Geocoding API

## Step 3: Create API Key

1. Go to [Credentials](https://console.cloud.google.com/apis/credentials)
2. Click "Create Credentials" and select "API Key"
3. Copy your new API key

## Step 4: Restrict Your API Key (Recommended)

For security, restrict your API key:

1. In the credentials page, find your API key and click "Edit"
2. Under "Application restrictions":
   - Choose "HTTP referrers (websites)"
   - Add your domains (e.g., `*.yourdomain.com/*`, `localhost:*` for development)
3. Under "API restrictions":
   - Select "Restrict key"
   - Select the APIs you enabled in Step 2
4. Click "Save"

## Step 5: Add API Key to Environment Variables

1. Add your API key to `.env.local`:

```
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=YOUR_API_KEY_HERE
```

2. For production, add this environment variable to your deployment environment.

## Step 6: Billing Considerations

Google Maps Platform uses a pay-as-you-go pricing model:

- $200 monthly free credit (covers approximately 28,000 autocomplete requests)
- Autocomplete requests: $2.83 per 1,000 requests
- JavaScript Maps API: $7 per 1,000 loads
- Set up budget alerts in Google Cloud Console to monitor usage

## Troubleshooting

### Common Issues

1. **"Google Maps JavaScript API error: MissingKeyMapError"**

   - Check that your API key is correctly set in `.env.local`
   - Verify the API key is properly passed to components

2. **"This API project is not authorized to use this API"**

   - Ensure you've enabled all required APIs in Step 2

3. **"This page can't load Google Maps correctly"**

   - Check if your API key has the correct restrictions
   - Verify your domain is in the allowed referrers

4. **Map doesn't appear or "Loading..." shows indefinitely**
   - Check browser console for errors
   - Ensure the Google Maps script is loading properly

For more information, visit the [Google Maps Platform Documentation](https://developers.google.com/maps/documentation/javascript/overview).
