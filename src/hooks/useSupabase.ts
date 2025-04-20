import { useState, useEffect } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';

type SupabaseResponse<T> = {
  data: T | null;
  error: Error | null;
};

/**
 * Custom hook for interacting with Supabase
 * Provides connection status and error handling
 */
export function useSupabase() {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Check connection on mount
  useEffect(() => {
    checkConnection();
  }, []);

  // Function to check Supabase connection
  const checkConnection = async () => {
    try {
      const { error } = await supabase.from('signups').select('id', { count: 'exact', head: true });

      if (error) {
        setIsConnected(false);
        setError(error.message);
      } else {
        setIsConnected(true);
        setError(null);
      }
    } catch (err) {
      setIsConnected(false);
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  /**
   * Insert data into a table with error handling
   */
  const insertData = async <T>(
    table: string,
    data: T
  ): Promise<{ error: string | null; data: any | null }> => {
    try {
      const response = await supabase.from(table).insert([data]);

      const error = response.error;

      if (error) {
        return { error: error.message, data: null };
      }

      return { error: null, data: response };
    } catch (err) {
      return {
        error: err instanceof Error ? err.message : 'Unknown error',
        data: null,
      };
    }
  };

  return {
    supabase,
    isConnected,
    error,
    checkConnection,
    insertData,
  };
}
