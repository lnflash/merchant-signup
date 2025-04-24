'use client';

import React, { useEffect, useState } from 'react';
import { AddressAutocomplete } from './AddressAutocomplete';
import { ModernAddressAutocomplete } from './ModernAddressAutocomplete';
import { useGoogleMapsApi } from '../../../src/hooks/useGoogleMapsApi';

interface SmartAddressAutocompleteProps {
  isRequired: boolean;
  onAddressSelect?: (address: string, lat: number, lng: number) => void;
}

/**
 * Smart component that chooses between modern and classic autocomplete
 * based on what's available in the loaded Google Maps API
 */
export const SmartAddressAutocomplete: React.FC<SmartAddressAutocompleteProps> = props => {
  const [useModern, setUseModern] = useState<boolean | null>(null);
  const { isLoaded } = useGoogleMapsApi({ libraries: ['places'] });

  useEffect(() => {
    if (!isLoaded) return;

    // Check if the PlaceAutocompleteElement is available
    try {
      const hasModernApi = !!(
        window.google &&
        window.google.maps &&
        window.google.maps.places &&
        window.google.maps.places.PlaceAutocompleteElement
      );

      console.log(`🗺️ ${hasModernApi ? 'Using modern' : 'Using classic'} address autocomplete`);
      setUseModern(hasModernApi);
    } catch (error) {
      console.warn('Failed to detect modern API, falling back to classic', error);
      setUseModern(false);
    }
  }, [isLoaded]);

  // Show loading state while we determine which component to use
  if (useModern === null) {
    return <div className="form-input input-with-icon">Loading address component...</div>;
  }

  // Use the appropriate component based on what's available
  return useModern ? <ModernAddressAutocomplete {...props} /> : <AddressAutocomplete {...props} />;
};
