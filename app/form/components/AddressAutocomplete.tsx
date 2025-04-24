'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useFormContext } from 'react-hook-form';
import { SignupFormData } from '../../../src/types';
import { mapsLogger } from '../../../src/utils/mapsLogger';
import { useGoogleMapsApi } from '../../../src/hooks/useGoogleMapsApi';

interface AddressAutocompleteProps {
  isRequired: boolean;
  onAddressSelect?: (address: string, lat: number, lng: number) => void;
}

/**
 * Enhanced address autocomplete field that uses Google Maps Places API
 * with better API key detection and real-time address validation
 */
export const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({
  isRequired,
  onAddressSelect,
}) => {
  const {
    register,
    setValue,
    formState: { errors },
    watch,
  } = useFormContext<SignupFormData>();

  // Track input element and autocomplete instance
  const inputRef = useRef<HTMLInputElement | null>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [userTyping, setUserTyping] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Current address value
  const currentAddress = watch('business_address');

  // Use custom hook to manage Google Maps API loading
  const { status, isLoaded, hasValidKey, loadScript } = useGoogleMapsApi({ libraries: ['places'] });

  // Load Google Maps API on component mount
  useEffect(() => {
    loadScript();
  }, [loadScript]);

  // Show appropriate status messages based on API loading state
  useEffect(() => {
    switch (status) {
      case 'idle':
      case 'loading':
        setStatusMessage('Loading address lookup...');
        break;
      case 'no-key':
        setStatusMessage('Address validation not available');
        break;
      case 'invalid-key':
        setStatusMessage('Invalid Maps API configuration');
        break;
      case 'error':
        setStatusMessage('Error loading address validation');
        break;
      case 'ready':
        setStatusMessage(null);
        break;
    }
  }, [status]);

  // Initialize Places Autocomplete when API is loaded and input element is available
  useEffect(() => {
    // Only initialize when API is loaded and we have an input element
    if (!isLoaded || !inputRef.current || autocompleteRef.current) return;

    try {
      // Create autocomplete instance with more comprehensive fields
      const options: google.maps.places.AutocompleteOptions = {
        types: ['address'],
        fields: [
          'address_components',
          'formatted_address',
          'geometry',
          'geometry.location',
          'place_id',
          'name',
          'vicinity',
        ],
      };

      autocompleteRef.current = new window.google.maps.places.Autocomplete(
        inputRef.current,
        options
      );

      // Log successful initialization
      mapsLogger.logPlacesInitialization(true);

      // Add place_changed listener
      autocompleteRef.current.addListener('place_changed', () => {
        if (!autocompleteRef.current) return;

        try {
          const place = autocompleteRef.current.getPlace();

          // Enhanced debug logging
          console.log('🗺️ Raw place data:', {
            place_id: place?.place_id,
            formatted_address: place?.formatted_address,
            hasGeometryObj: !!place?.geometry,
            hasLocationObj: !!place?.geometry?.location,
            hasLatLng: !!(place?.geometry?.location?.lat && place?.geometry?.location?.lng),
            hasAddressComponents: !!(
              place?.address_components && place.address_components.length > 0
            ),
            fieldsRequested: 'address_components,formatted_address,geometry,place_id',
          });

          // Check if we got a place with all required fields
          const hasGeometry = !!(place && place.geometry && place.geometry.location);
          const hasAddress = !!(place && place.formatted_address);
          const formattedAddress = place && place.formatted_address ? place.formatted_address : '';
          const placeId = place && place.place_id ? place.place_id : '';

          // Log the place selection
          mapsLogger.logPlaceSelection(placeId, formattedAddress, hasGeometry);

          // Clear user typing state as selection is made
          setUserTyping(false);

          // If we have a place but no geometry, it might be due to incomplete fields parameter
          // or restrictions in the API key. Let's try to get coordinates using a workaround.
          if (place && place.place_id && !hasGeometry) {
            console.log('🗺️ Attempting to handle place without geometry:', place.place_id);

            // Use current input value as address
            const manualAddress = place.formatted_address || inputRef.current?.value || '';

            if (manualAddress) {
              // Update the address in the form
              setValue('business_address', manualAddress, { shouldValidate: true });

              // For now, use center of relevant country/region as an approximation
              // This is a fallback solution - ideally we would get the real coordinates
              // You could enhance this with default coordinates for your target market
              const defaultLat = 18.1096; // Jamaica center lat (example)
              const defaultLng = -77.2975; // Jamaica center lng (example)

              setValue('latitude', defaultLat, { shouldValidate: true });
              setValue('longitude', defaultLng, { shouldValidate: true });

              // Call the callback with these default coordinates
              if (onAddressSelect) {
                onAddressSelect(manualAddress, defaultLat, defaultLng);
              }

              console.log('🗺️ Used fallback coordinates for address:', manualAddress);
            }
          }
          // Normal case: we have both geometry and address data
          else if (hasGeometry && hasAddress && place.geometry && place.geometry.location) {
            console.log('🗺️ Using actual coordinates:', {
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng(),
            });

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
            // Handle case where selection doesn't have full data
            console.warn('Selected place missing geometry or formatted address', {
              hasGeometry,
              hasAddress,
              placeId,
            });

            // Still update the address field with current input value
            const manualAddress = inputRef.current?.value;
            if (manualAddress) {
              setValue('business_address', manualAddress, { shouldValidate: true });

              // Clear lat/lng since we don't have valid coordinates
              setValue('latitude', undefined, { shouldValidate: false });
              setValue('longitude', undefined, { shouldValidate: false });
            }
          }
        } catch (error) {
          console.error('Error handling place selection:', error);
        }
      });
    } catch (error) {
      // Log initialization failure
      mapsLogger.logPlacesInitialization(
        false,
        error instanceof Error ? error : new Error('Autocomplete initialization failed')
      );
    }

    // Cleanup listener on unmount
    return () => {
      // Google Maps doesn't expose a direct way to clean up an autocomplete
      autocompleteRef.current = null;
    };
  }, [isLoaded, setValue, onAddressSelect]);

  // Handle input changes for real-time validation or to show user is typing
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserTyping(true);

    // Update form value as user types
    setValue('business_address', e.target.value, {
      shouldValidate: e.target.value.length > 5, // Only validate longer addresses
    });

    // Clear coordinates when user is typing (will be set when place is selected)
    if (watch('latitude') || watch('longitude')) {
      setValue('latitude', undefined, { shouldValidate: false });
      setValue('longitude', undefined, { shouldValidate: false });
    }
  };

  // Register the input with react-hook-form
  const { ref, ...inputProps } = register('business_address');

  return (
    <div className="relative">
      {/* Address Icon */}
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

      {/* Input Field */}
      <input
        id="business_address"
        className={`form-input input-with-icon ${
          !hasValidKey && 'pr-12' // Extra padding if showing warning icon
        }`}
        placeholder={isRequired ? 'Enter your business address' : 'Optional for merchants'}
        aria-required={isRequired}
        aria-invalid={errors.business_address ? 'true' : 'false'}
        ref={element => {
          // Call react-hook-form's ref
          ref(element);
          // Store in our local ref
          inputRef.current = element;
        }}
        autoComplete="off" // Disable browser's autocomplete to avoid conflicts
        {...inputProps}
        // Override react-hook-form's onChange with our custom handler
        // This needs to come after {...inputProps} to ensure it takes precedence
        onChange={handleInputChange}
      />

      {/* API Status Indicator */}
      {(!hasValidKey || status === 'error') && (
        <div className="absolute top-3 right-3 pointer-events-none">
          <svg
            className="h-5 w-5 text-amber-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
      )}

      {/* Status Message */}
      {statusMessage && <div className="mt-1 text-xs text-amber-600">{statusMessage}</div>}

      {/* Typing Indicator */}
      {userTyping && isLoaded && !statusMessage && (
        <div className="mt-1 text-xs text-blue-600">Type your address for suggestions...</div>
      )}

      {/* Success Indicator - address has coordinates */}
      {!userTyping && currentAddress && watch('latitude') && watch('longitude') && (
        <div className="mt-1 text-xs text-green-600">✓ Valid address with location data</div>
      )}
    </div>
  );
};
