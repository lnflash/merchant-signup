'use client';

import React, { useEffect, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { SignupFormData } from '../../../src/types';
import { mapsLogger } from '../../../src/utils/mapsLogger';

interface AddressAutocompleteProps {
  isRequired: boolean;
  onAddressSelect?: (address: string, lat: number, lng: number) => void;
}

const loadGoogleMapsScript = (callback: () => void) => {
  // Check if Google Maps API is already loaded
  if (typeof window.google !== 'undefined' && window.google.maps) {
    mapsLogger.logScriptLoading(true);
    callback();
    return;
  }

  // Log API key status (without revealing the full key)
  mapsLogger.logApiKeyStatus();

  // Get API key from environment variable
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const isStaticBuild = process.env.IS_BUILD_TIME === 'true';
  const isDevelopment = process.env.NODE_ENV === 'development';

  // Debug output in development
  if (isDevelopment) {
    console.log('🗺️ Google Maps environment:', {
      isDevelopment,
      isStaticBuild,
      hasKey: !!apiKey,
      keyLength: apiKey ? apiKey.length : 0,
      isPlaceholder: apiKey === 'YOUR_GOOGLE_MAPS_API_KEY_HERE',
    });
  }

  if (!apiKey || apiKey === 'YOUR_GOOGLE_MAPS_API_KEY_HERE') {
    if (isDevelopment) {
      console.warn(
        'Google Maps API Key not set or invalid in .env.local. Map functionality will not work properly. Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key to .env.local'
      );
      // In development, load without key to at least show the input field
      loadScriptWithoutKey();
    } else {
      // In production, log the error but don't attempt to load without key
      mapsLogger.logScriptLoading(false, new Error('API key missing or invalid in production'));
    }
    return;
  }

  try {
    // Create script element
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.crossOrigin = 'anonymous'; // Add CORS attribute

    script.onload = () => {
      mapsLogger.logScriptLoading(true);
      callback();
    };

    script.onerror = error => {
      mapsLogger.logScriptLoading(
        false,
        error instanceof Error ? error : new Error('Script load failed')
      );
    };

    // Add script to document
    document.head.appendChild(script);
  } catch (error) {
    mapsLogger.logScriptLoading(
      false,
      error instanceof Error ? error : new Error('Failed to create script element')
    );
  }
};

// Function to load without API key (development only)
const loadScriptWithoutKey = () => {
  try {
    const script = document.createElement('script');
    script.src = 'https://maps.googleapis.com/maps/api/js?libraries=places';
    script.async = true;
    script.defer = true;
    script.crossOrigin = 'anonymous'; // Add CORS attribute

    script.onload = () => {
      console.log('🗺️ Google Maps script loaded without API key (development only)');
    };

    script.onerror = error => {
      console.error('❌ Failed to load Google Maps script without API key', error);
    };

    // No callback here as we're just showing the input without full functionality
    document.head.appendChild(script);
  } catch (error) {
    console.error('❌ Error creating script element for Google Maps', error);
  }
};

export const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({
  isRequired,
  onAddressSelect,
}) => {
  const {
    register,
    setValue,
    formState: { errors },
  } = useFormContext<SignupFormData>();

  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [inputElement, setInputElement] = useState<HTMLInputElement | null>(null);

  // Load the Google Maps script
  useEffect(() => {
    // Set up a global error listener to catch CORS issues
    const handleGlobalError = (event: ErrorEvent) => {
      // Only handle Google Maps related errors
      if (
        event.message &&
        (event.message.includes('google') ||
          event.message.includes('maps') ||
          event.message.includes('googleapis'))
      ) {
        // Log the CORS error with detailed debugging information
        mapsLogger.logCorsIssue(event);
      }
    };

    // Add the error listener
    window.addEventListener('error', handleGlobalError);

    // Load the script
    loadGoogleMapsScript(() => {
      setIsScriptLoaded(true);
    });

    // Clean up listener on unmount
    return () => {
      window.removeEventListener('error', handleGlobalError);
    };
  }, []);

  // Initialize autocomplete when script is loaded and input is available
  useEffect(() => {
    if (!isScriptLoaded || !inputElement) return;

    // Check if Google Maps and Places API is available
    if (!window.google || !window.google.maps || !window.google.maps.places) {
      mapsLogger.logPlacesInitialization(
        false,
        new Error('Google Maps Places API not loaded properly')
      );
      return;
    }

    try {
      const options: google.maps.places.AutocompleteOptions = {
        types: ['address'],
        fields: ['address_components', 'formatted_address', 'geometry', 'place_id'],
      };

      const autocompleteInstance = new google.maps.places.Autocomplete(inputElement, options);
      mapsLogger.logPlacesInitialization(true);

      autocompleteInstance.addListener('place_changed', () => {
        try {
          const place = autocompleteInstance.getPlace();
          const hasGeometry = !!(place && place.geometry && place.geometry.location);
          const hasAddress = !!(place && place.formatted_address);
          const formattedAddress = place && place.formatted_address ? place.formatted_address : '';
          const placeId = place && place.place_id ? place.place_id : '';

          // Log the place selection with enough info for debugging
          mapsLogger.logPlaceSelection(placeId, formattedAddress, hasGeometry);

          if (hasGeometry && hasAddress && place.geometry && place.geometry.location) {
            // Update form values
            setValue('business_address', formattedAddress, { shouldValidate: true });
            setValue('latitude', place.geometry.location.lat() || 0, { shouldValidate: true });
            setValue('longitude', place.geometry.location.lng() || 0, { shouldValidate: true });

            // Call the callback if provided
            if (onAddressSelect) {
              onAddressSelect(
                formattedAddress,
                place.geometry.location.lat() || 0,
                place.geometry.location.lng() || 0
              );
            }
          } else {
            // Handle case where place doesn't have geometry or formatted address
            console.warn('Selected place missing geometry or formatted address', {
              hasGeometry,
              hasAddress,
              placeId: place.place_id,
            });

            // Still update the address field with what the user entered
            const manualAddress = inputElement.value;
            if (manualAddress) {
              setValue('business_address', manualAddress, { shouldValidate: true });
            }
          }
        } catch (error) {
          console.error('Error handling place selection:', error);
        }
      });
    } catch (error) {
      mapsLogger.logPlacesInitialization(
        false,
        error instanceof Error ? error : new Error('Initialization failed')
      );
    }

    // Cleanup
    return () => {
      // Google Maps doesn't expose a direct way to clean up an autocomplete
      // but for single-page apps we generally don't need explicit cleanup
    };
  }, [isScriptLoaded, inputElement, setValue, onAddressSelect]);

  // Register the input with react-hook-form and capture element reference
  const { ref, ...rest } = register('business_address');

  return (
    <div className="relative">
      <div className="absolute top-3 left-3 pointer-events-none">
        <svg
          className="h-5 w-5 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      </div>
      <input
        id="business_address"
        className="form-input input-with-icon"
        placeholder={isRequired ? 'Enter your business address' : 'Optional for merchants'}
        aria-required={isRequired}
        aria-invalid={errors.business_address ? 'true' : 'false'}
        ref={element => {
          // Call react-hook-form's ref
          ref(element);
          // Store element in state instead of directly assigning to ref.current
          setInputElement(element);
        }}
        {...rest}
      />
    </div>
  );
};

// Add Google Maps API types to Window interface
declare global {
  interface Window {
    google: any;
  }
}
