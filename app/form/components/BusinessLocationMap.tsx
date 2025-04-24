'use client';

import React, { useState, useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { SignupFormData } from '../../../src/types';
import { AddressMap } from './AddressMap';
import { SmartAddressAutocomplete } from './SmartAddressAutocomplete';

interface BusinessLocationMapProps {
  isRequired?: boolean;
}

/**
 * Component that shows the business location map and address lookup
 * Uses SmartAddressAutocomplete for address selection
 */
export const BusinessLocationMap: React.FC<BusinessLocationMapProps> = ({ isRequired = false }) => {
  const { setValue, watch } = useFormContext<SignupFormData>();
  const [mapExpanded, setMapExpanded] = useState(true);

  // Watch latitude and longitude values
  const latitude = watch('latitude');
  const longitude = watch('longitude');
  const address = watch('business_address');

  // Use console warnings for debugging
  useEffect(() => {
    console.log('🗺️ BusinessLocationMap rendering:', {
      address,
      latitude,
      longitude,
      mapExpanded,
    });
  }, [address, latitude, longitude, mapExpanded]);

  if (!address) {
    return null; // Only show this component if there's an address entered
  }

  return (
    <div className="mt-3 bg-gray-50 p-4 rounded-lg border border-gray-200">
      <h4 className="text-sm font-medium text-gray-700 mb-2">Location Map</h4>

      {/* Allow users to update location */}
      <div className="mb-3">
        <SmartAddressAutocomplete
          isRequired={isRequired}
          onAddressSelect={(address, lat, lng) => {
            setValue('business_address', address, { shouldValidate: true });
            setValue('latitude', lat, { shouldValidate: true });
            setValue('longitude', lng, { shouldValidate: true });

            // Ensure map is expanded when address is selected
            setMapExpanded(true);
          }}
        />
      </div>

      {/* Map visibility controls */}
      {latitude && longitude && (
        <div className="md:hidden flex justify-between items-center mb-2">
          <span className="text-sm text-gray-600">
            {mapExpanded ? 'Business location:' : 'Location set ✓'}
          </span>
          <button
            type="button"
            onClick={() => setMapExpanded(!mapExpanded)}
            className="text-sm text-blue-600 underline focus:outline-none"
          >
            {mapExpanded ? 'Hide map' : 'Show map'}
          </button>
        </div>
      )}

      {/* The map component */}
      <AddressMap
        latitude={latitude || null}
        longitude={longitude || null}
        isExpanded={mapExpanded}
        toggleExpand={() => setMapExpanded(!mapExpanded)}
      />

      {/* Status indicator */}
      {latitude && longitude && (
        <div className="mt-1 text-xs text-green-600">✓ Location coordinates recorded</div>
      )}
    </div>
  );
};
