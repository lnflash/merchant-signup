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

    // Set a timeout to ensure we don't get stuck in loading state
    const timeoutId = setTimeout(() => {
      if (useModern === null) {
        console.warn('🗺️ Detection timeout, falling back to classic autocomplete');
        setUseModern(false);
      }
    }, 2000); // 2 second timeout

    // Check if the PlaceAutocompleteElement is available
    try {
      // Force classic autocomplete for now due to CORS issues
      const hasModernApi = false;

      console.log(`🗺️ ${hasModernApi ? 'Using modern' : 'Using classic'} address autocomplete`);
      setUseModern(hasModernApi);
    } catch (error) {
      console.warn('Failed to detect modern API, falling back to classic', error);
      setUseModern(false);
    }

    return () => clearTimeout(timeoutId);
  }, [isLoaded, useModern]);

  // Show loading state while we determine which component to use
  if (useModern === null) {
    return <div className="form-input input-with-icon">Loading address component...</div>;
  }

  // Use the appropriate component based on what's available
  return useModern ? <ModernAddressAutocomplete {...props} /> : <AddressAutocomplete {...props} />;
};
