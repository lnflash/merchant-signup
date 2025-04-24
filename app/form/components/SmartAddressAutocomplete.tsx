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

  // Always initialize immediately with a fallback
  useEffect(() => {
    console.log('🗺️ SmartAddressAutocomplete mounted, isLoaded:', isLoaded);

    // Set a very short timeout to ensure rapid initialization
    // This prevents being stuck in loading state
    const timeoutId = setTimeout(() => {
      if (useModern === null) {
        console.log('🗺️ Immediate fallback to classic autocomplete');
        setUseModern(false);
      }
    }, 100); // Very short timeout for faster initialization

    // If Maps API is loaded, check capabilities
    if (isLoaded) {
      try {
        // For now, force classic mode for stability
        // In the future, can change this to auto-detect capabilities
        const hasModernApi = false;

        console.log(`🗺️ ${hasModernApi ? 'Using modern' : 'Using classic'} address autocomplete`);
        setUseModern(hasModernApi);
      } catch (error) {
        console.warn('Failed to detect modern API, using classic', error);
        setUseModern(false);
      }
    } else {
      // Don't wait for API to load, use classic immediately
      console.log('🗺️ Maps API not loaded, using classic address autocomplete');
      setUseModern(false);
    }

    return () => clearTimeout(timeoutId);
  }, [isLoaded]);

  // Show loading state while we determine which component to use
  if (useModern === null) {
    return <div className="form-input input-with-icon">Loading address component...</div>;
  }

  // Use the appropriate component based on what's available
  return useModern ? <ModernAddressAutocomplete {...props} /> : <AddressAutocomplete {...props} />;
};
