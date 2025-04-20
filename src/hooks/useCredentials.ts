import { useState, useEffect } from 'react';
import { logger } from '../utils/logger';

/**
 * Type for Supabase credentials
 */
export interface SupabaseCredentials {
  supabaseUrl: string;
  supabaseKey: string;
  bucket: string;
  environment?: string;
  buildTime?: boolean;
}

/**
 * Custom hook to fetch and manage Supabase credentials
 * Ensures consistent access to credentials across components
 */
export function useCredentials() {
  const [credentials, setCredentials] = useState<SupabaseCredentials | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Skip if hook is used on the server-side
    if (typeof window === 'undefined') {
      setLoading(false);
      return;
    }

    async function fetchCredentials() {
      try {
        logger.info('Fetching Supabase credentials from API...');

        // Fetch credentials from our secure API endpoint
        const response = await fetch('/api/credentials');

        if (!response.ok) {
          throw new Error(`Failed to fetch credentials: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        if (!data.supabaseUrl || !data.supabaseKey) {
          logger.warn('Received incomplete credentials from API', {
            hasUrl: !!data.supabaseUrl,
            hasKey: !!data.supabaseKey,
          });
        } else {
          logger.info('Successfully received credentials', {
            bucket: data.bucket,
            environment: data.environment,
          });
        }

        setCredentials(data);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        setError(error);
        logger.error('Error fetching credentials:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchCredentials();
  }, []);

  return { credentials, loading, error };
}
