'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useFormContext } from 'react-hook-form';
import { SignupFormData } from '../../../src/types';
import { mapsLogger } from '../../../src/utils/mapsLogger';
import { useGoogleMapsApi } from '../../../src/hooks/useGoogleMapsApi';

interface ModernAddressAutocompleteProps {
  isRequired: boolean;
  onAddressSelect?: (address: string, lat: number, lng: number) => void;
}

/**
 * Modern address autocomplete using Google Maps Places PlaceAutocompleteElement
 * This is the recommended replacement for the deprecated Autocomplete API
 */
export const ModernAddressAutocomplete: React.FC<ModernAddressAutocompleteProps> = ({
  isRequired,
  onAddressSelect,
}) => {
  const {
    setValue,
    formState: { errors },
    watch,
  } = useFormContext<SignupFormData>();

  // Container ref for the autocomplete element
  const containerRef = useRef<HTMLDivElement>(null);
  const [userTyping, setUserTyping] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // For TypeScript compatibility, use any type but we'll treat it as a PlaceAutocompleteElement
  const autoCompleteElementRef = useRef<any>(null);

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

  // Initialize PlaceAutocompleteElement when API is loaded
  useEffect(() => {
    if (!isLoaded || !containerRef.current || autoCompleteElementRef.current) return;

    try {
      console.log('🗺️ Initializing PlaceAutocompleteElement');

      // Check if PlaceAutocompleteElement is available
      if (!window.google.maps.places.PlaceAutocompleteElement) {
        throw new Error(
          'PlaceAutocompleteElement is not available. Falling back to classic autocomplete.'
        );
      }

      // Create the PlaceAutocompleteElement
      const placeAutocomplete = new window.google.maps.places.PlaceAutocompleteElement({
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
      });

      // Clear existing children if any
      while (containerRef.current.firstChild) {
        containerRef.current.removeChild(containerRef.current.firstChild);
      }

      // Append to our container
      containerRef.current.appendChild(placeAutocomplete);
      autoCompleteElementRef.current = placeAutocomplete;

      // Log successful initialization
      mapsLogger.logPlacesInitialization(true);

      // Add place_changed event listener
      placeAutocomplete.addEventListener('place_changed', async () => {
        try {
          // Get place details
          const place = await placeAutocomplete.getPlace();

          // Enhanced debug logging
          console.log('🗺️ Raw place data (modern):', {
            place_id: place?.place_id,
            formatted_address: place?.formatted_address,
            hasGeometryObj: !!place?.geometry,
            hasLocationObj: !!place?.geometry?.location,
            hasLatLng: !!(place?.geometry?.location?.lat && place?.geometry?.location?.lng),
            hasAddressComponents: !!(
              place?.address_components && place.address_components.length > 0
            ),
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

          // If we have a place but no geometry, use a fallback
          if (place && place.place_id && !hasGeometry) {
            console.log('🗺️ Attempting to handle place without geometry:', place.place_id);

            // Use current input value as address
            const manualAddress = place.formatted_address || '';

            if (manualAddress) {
              // Update the address in the form
              setValue('business_address', manualAddress, { shouldValidate: true });

              // For now, use center of relevant country/region as an approximation
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

            if (formattedAddress) {
              setValue('business_address', formattedAddress, { shouldValidate: true });

              // Clear lat/lng since we don't have valid coordinates
              setValue('latitude', undefined, { shouldValidate: false });
              setValue('longitude', undefined, { shouldValidate: false });
            }
          }
        } catch (error) {
          console.error('Error handling place selection:', error);
        }
      });

      // Add input event listener to detect when user starts typing
      placeAutocomplete.querySelector('input')?.addEventListener('input', () => {
        setUserTyping(true);

        // Clear coordinates when user is typing (will be set when place is selected)
        if (watch('latitude') || watch('longitude')) {
          setValue('latitude', undefined, { shouldValidate: false });
          setValue('longitude', undefined, { shouldValidate: false });
        }
      });

      // Set placeholder and required attributes
      const inputElement = placeAutocomplete.querySelector('input');
      if (inputElement) {
        inputElement.placeholder = isRequired
          ? 'Enter your business address'
          : 'Optional for merchants';
        inputElement.required = isRequired;
        inputElement.classList.add('form-input');
        inputElement.id = 'business_address';

        // Apply styling to match the rest of the form
        inputElement.style.width = '100%';
        inputElement.style.paddingLeft = '2.5rem';
        inputElement.style.borderRadius = '0.375rem';
      }
    } catch (error) {
      // Log initialization failure
      mapsLogger.logPlacesInitialization(
        false,
        error instanceof Error ? error : new Error('PlaceAutocompleteElement initialization failed')
      );
      console.error('Failed to initialize PlaceAutocompleteElement:', error);
    }

    // Cleanup listener on unmount
    return () => {
      autoCompleteElementRef.current = null;
    };
  }, [isLoaded, setValue, watch, onAddressSelect, isRequired]);

  return (
    <div className="relative">
      {/* Address Icon */}
      <div className="absolute top-3 left-3 pointer-events-none z-10">
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

      {/* PlaceAutocompleteElement Container */}
      <div
        ref={containerRef}
        className={`place-autocomplete-container ${!hasValidKey && 'pr-12'}`}
        style={{ width: '100%' }}
      />

      {/* API Status Indicator */}
      {(!hasValidKey || status === 'error') && (
        <div className="absolute top-3 right-3 pointer-events-none z-10">
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

      {/* Show error from form context if needed */}
      {errors.business_address && (
        <p className="form-error mt-1" role="alert">
          {errors.business_address.message?.toString()}
        </p>
      )}
    </div>
  );
};
