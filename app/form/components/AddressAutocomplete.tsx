'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useFormContext } from 'react-hook-form';
import { SignupFormData } from '../../../src/types';

interface AddressAutocompleteProps {
  isRequired: boolean;
  onAddressSelect?: (address: string, lat: number, lng: number) => void;
}

const loadGoogleMapsScript = (callback: () => void) => {
  // Check if Google Maps API is already loaded
  if (typeof window.google !== 'undefined' && window.google.maps) {
    callback();
    return;
  }

  // Get API key from environment variable
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    // Using silent failure to avoid console errors
    return;
  }

  // Create script element
  const script = document.createElement('script');
  script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
  script.async = true;
  script.defer = true;
  script.onload = callback;

  // Add script to document
  document.head.appendChild(script);
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

  const inputRef = useRef<HTMLInputElement>(null);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  // Autocomplete instance is only used within the effect and event listener
  const [, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);

  // Load the Google Maps script
  useEffect(() => {
    loadGoogleMapsScript(() => {
      setIsScriptLoaded(true);
    });
  }, []);

  // Initialize autocomplete when script is loaded and input is available
  useEffect(() => {
    if (isScriptLoaded && inputRef.current) {
      const options: google.maps.places.AutocompleteOptions = {
        types: ['address'],
        fields: ['address_components', 'formatted_address', 'geometry'],
      };

      const autocompleteInstance = new google.maps.places.Autocomplete(inputRef.current, options);

      autocompleteInstance.addListener('place_changed', () => {
        const place = autocompleteInstance.getPlace();

        if (place.geometry && place.formatted_address) {
          // Update form values
          setValue('business_address', place.formatted_address, { shouldValidate: true });
          setValue('latitude', place.geometry.location?.lat() || 0, { shouldValidate: true });
          setValue('longitude', place.geometry.location?.lng() || 0, { shouldValidate: true });

          // Call the callback if provided
          if (onAddressSelect) {
            onAddressSelect(
              place.formatted_address,
              place.geometry.location?.lat() || 0,
              place.geometry.location?.lng() || 0
            );
          }
        }
      });

      setAutocomplete(autocompleteInstance);
    }
  }, [isScriptLoaded, setValue, onAddressSelect]);

  // Register the input with react-hook-form
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
        ref={e => {
          ref(e);
          inputRef.current = e;
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
