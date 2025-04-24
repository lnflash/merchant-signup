'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useFormContext } from 'react-hook-form';
import { SignupFormData } from '../../../src/types';
import { mapsLogger } from '../../../src/utils/mapsLogger';
import { useGoogleMapsApi } from '../../../src/hooks/useGoogleMapsApi';
import { AddressMap } from './AddressMap';

interface EnhancedAddressInputProps {
  isRequired: boolean;
}

/**
 * All-in-one address input component that combines autocomplete
 * and map view for a simple, integrated experience
 */
export const EnhancedAddressInput: React.FC<EnhancedAddressInputProps> = ({ isRequired }) => {
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
  const [focused, setFocused] = useState(false);
  const [mapExpanded, setMapExpanded] = useState(true);
  const [addressSelected, setAddressSelected] = useState(false);

  // Current address value
  const currentAddress = watch('business_address');
  const latitude = watch('latitude');
  const longitude = watch('longitude');

  // Track changes to coordinates to update address selected state
  useEffect(() => {
    // If we have coordinates, make sure address is marked as selected
    if (latitude && longitude) {
      setAddressSelected(true);
      setUserTyping(false);
      console.log('🏙️ Coordinates detected, marking address as selected:', { latitude, longitude });
    }
  }, [latitude, longitude]);

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
        setStatusMessage('Loading address suggestions...');
        break;
      case 'no-key':
        setStatusMessage('Address suggestions not available');
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
    console.log('🏙️ Address input initialization:', {
      isLoaded,
      hasInputRef: !!inputRef.current,
      hasAutocompleteRef: !!autocompleteRef.current,
      status,
      address: currentAddress,
      hasCoordinates: !!(latitude && longitude),
    });

    // Only initialize when API is loaded and we have an input element
    if (!isLoaded || !inputRef.current || autocompleteRef.current) return;

    try {
      // Create autocomplete instance with comprehensive fields
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
          const hasGeometry = !!(place && place.geometry && place.geometry.location);
          const hasAddress = !!(place && place.formatted_address);
          const formattedAddress = place && place.formatted_address ? place.formatted_address : '';
          const placeId = place && place.place_id ? place.place_id : '';

          // Log the place selection
          mapsLogger.logPlaceSelection(placeId, formattedAddress, hasGeometry);

          // Mark address as selected and clear typing state
          setUserTyping(false);
          setAddressSelected(true);

          // Don't hide focus state immediately to avoid flickering
          setTimeout(() => setFocused(false), 100);

          // Always ensure map is expanded when an address is selected
          setMapExpanded(true);

          console.log('🏙️ Place selected and address marked as selected:', {
            placeId,
            hasAddress,
            hasGeometry,
            addressSelected: true,
          });

          // If we have a place but no geometry, try to use fallback coordinates
          if (place && place.place_id && !hasGeometry) {
            console.log('🏙️ Using fallback coordinates for address without geometry');
            const manualAddress = place.formatted_address || inputRef.current?.value || '';

            if (manualAddress) {
              // Update the address in the form
              setValue('business_address', manualAddress, { shouldValidate: true });

              // Use default coordinates (center of target market)
              const defaultLat = 18.1096; // Jamaica center lat
              const defaultLng = -77.2975; // Jamaica center lng

              setValue('latitude', defaultLat, { shouldValidate: true });
              setValue('longitude', defaultLng, { shouldValidate: true });
            }
          }
          // Normal case: we have both geometry and address data
          else if (hasGeometry && hasAddress && place.geometry && place.geometry.location) {
            console.log('🏙️ Using actual coordinates from place selection');

            setValue('business_address', formattedAddress, { shouldValidate: true });
            setValue('latitude', place.geometry.location.lat() || 0, { shouldValidate: true });
            setValue('longitude', place.geometry.location.lng() || 0, { shouldValidate: true });
          } else {
            // Handle case where selection doesn't have full data
            console.warn('Address selection missing required data');

            // Still update the address field with current input value
            const manualAddress = inputRef.current?.value;
            if (manualAddress) {
              setValue('business_address', manualAddress, { shouldValidate: true });

              // Clear coordinates since we don't have valid ones
              setValue('latitude', undefined, { shouldValidate: false });
              setValue('longitude', undefined, { shouldValidate: false });
            }
          }
        } catch (error) {
          console.error('Error handling place selection:', error);
        }
      });
    } catch (error) {
      console.error('Failed to initialize Google Maps autocomplete:', error);
      mapsLogger.logPlacesInitialization(
        false,
        error instanceof Error ? error : new Error('Autocomplete initialization failed')
      );
    }

    return () => {
      // Google Maps doesn't expose a direct way to clean up an autocomplete
      autocompleteRef.current = null;
    };
  }, [isLoaded, setValue, currentAddress, latitude, longitude]);

  // Handle input changes to show user is typing
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserTyping(true);

    // Only clear address selection if user is actively changing the text
    // This prevents clearing the selection when just clicking on the field
    if (e.target.value !== currentAddress) {
      setAddressSelected(false);

      // Clear coordinates when user is actually typing new content
      if (watch('latitude') || watch('longitude')) {
        setValue('latitude', undefined, { shouldValidate: false });
        setValue('longitude', undefined, { shouldValidate: false });
      }
    }

    // Update form value as user types
    setValue('business_address', e.target.value, {
      shouldValidate: e.target.value.length > 5, // Only validate longer addresses
    });
  };

  // Register the input with react-hook-form
  const { ref, ...inputProps } = register('business_address');

  const handleFocus = () => {
    setFocused(true);
    // Don't reset typing state when just focusing the field
    // Only show typing indicator if user hasn't selected an address yet
    if (!addressSelected) {
      setUserTyping(true);
    }
  };

  return (
    <div className="space-y-3">
      {/* Input container with raised z-index when focused for autocomplete dropdown */}
      <div className={`relative ${focused ? 'z-50' : 'z-10'}`}>
        {/* Clear instructional text for users */}
        <div className="text-sm text-gray-600 mb-1 flex items-center">
          <svg className="h-4 w-4 mr-1 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
          Start typing and select your address from the dropdown suggestions
        </div>

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

          {/* Input Field - Larger with better focus state */}
          <input
            id="business_address"
            className={`form-input input-with-icon py-3 text-base ${
              !hasValidKey && 'pr-12' // Extra padding if showing warning icon
            } ${focused ? 'border-blue-500 ring-2 ring-blue-200' : ''}`}
            placeholder={isRequired ? 'Enter your business address' : 'Optional for merchants'}
            aria-required={isRequired}
            aria-invalid={errors.business_address ? 'true' : 'false'}
            onFocus={handleFocus}
            onBlur={() => {
              // When field loses focus, keep address selected state but hide the dropdown
              setTimeout(() => {
                setFocused(false);
                // Don't reset userTyping if we have coordinates (address was selected)
                if (latitude && longitude) {
                  setUserTyping(false);
                }
              }, 200); // Delay to allow selection to complete
            }}
            ref={element => {
              // Call react-hook-form's ref
              ref(element);
              // Store in our local ref
              inputRef.current = element;
            }}
            autoComplete="off" // Disable browser's autocomplete to avoid conflicts
            {...inputProps}
            // Override react-hook-form's onChange with our custom handler
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
        </div>

        {/* Status Messages */}
        {statusMessage && <div className="mt-1 text-xs text-amber-600">{statusMessage}</div>}

        {/* Typing Indicator */}
        {userTyping && isLoaded && !statusMessage && (
          <div className="mt-1 text-xs text-blue-600 flex items-center">
            <div className="mr-1 h-2 w-2 bg-blue-600 rounded-full animate-pulse"></div>
            Type your address for suggestions...
          </div>
        )}

        {/* Success Indicator - visible when address is selected with coordinates */}
        {addressSelected && currentAddress && latitude && longitude && (
          <div className="mt-1 text-xs text-green-600 flex items-center">
            <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span className="font-medium">Address verified</span> - map location shown below
          </div>
        )}
      </div>

      {/* Form Error */}
      {errors.business_address && (
        <p className="text-red-500 text-sm" role="alert">
          {errors.business_address.message?.toString()}
        </p>
      )}

      {/* Map Section - Only show after address selection with coordinates */}
      {currentAddress && latitude && longitude && (
        <div className="mt-3 bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-sm font-medium text-gray-700">Address Map Location</h4>
            <button
              type="button"
              onClick={() => setMapExpanded(!mapExpanded)}
              className="text-sm text-blue-600 hover:text-blue-800 focus:outline-none flex items-center"
            >
              {mapExpanded ? (
                <>
                  <svg
                    className="h-4 w-4 mr-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 15l7-7 7 7"
                    />
                  </svg>
                  Hide Map
                </>
              ) : (
                <>
                  <svg
                    className="h-4 w-4 mr-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                  Show Map
                </>
              )}
            </button>
          </div>

          {/* The map component */}
          <AddressMap
            latitude={latitude || null}
            longitude={longitude || null}
            isExpanded={mapExpanded}
            toggleExpand={() => setMapExpanded(!mapExpanded)}
          />
        </div>
      )}
    </div>
  );
};
