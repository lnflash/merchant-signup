import { useState, useEffect } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';
import { logger } from '../utils/logger';

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
      logger.info('Checking Supabase connection...');
      const { error } = await supabase.from('signups').select('id', { count: 'exact', head: true });

      if (error) {
        logger.error('Supabase connection failed', error);
        setIsConnected(false);
        setError(error.message);
      } else {
        logger.supabase.connectionSuccess();
        setIsConnected(true);
        setError(null);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      logger.error('Supabase connection error', err);
      setIsConnected(false);
      setError(errorMessage);
    }
  };

  /**
   * Insert data into a table with error handling
   * @param table The table name to insert data into
   * @param data The data to insert
   * @returns Promise with error or data response
   */
  const insertData = async <T = any>(
    table: string,
    data: T
  ): Promise<{ error: string | null; data: any | null }> => {
    try {
      // Safely log data without exposing sensitive fields
      let loggableData: object | undefined;

      // Only create loggableData if data is an object
      if (typeof data === 'object' && data !== null) {
        loggableData = { ...data };
        // Remove potentially sensitive fields for logging
        const sensitiveFields = ['password', 'card', 'ssn', 'secret', 'key'];
        for (const key in loggableData) {
          if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
            (loggableData as any)[key] = '[REDACTED]';
          }
        }
      } else {
        // If data is not an object, create a simple object with type information
        loggableData = { type: typeof data, isArray: Array.isArray(data) };
      }

      logger.info(`Inserting data into "${table}" table`, loggableData);
      const response = await supabase.from(table).insert([data]);

      const error = response.error;

      if (error) {
        logger.supabase.dataSubmissionFailed(table, error);
        return { error: error.message, data: null };
      }

      logger.supabase.dataSubmitted(table);
      return { error: null, data: response };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      logger.error(`Error inserting data into "${table}" table`, err);
      return {
        error: errorMessage,
        data: null,
      };
    }
  };

  // Debug method to verify connection status
  const debugConnectionStatus = () => {
    console.log('Current Supabase connection status:', {
      isConnected,
      error,
      supabaseInstance: supabase ? 'exists' : 'missing',
    });
    // Force a new connection check
    checkConnection();
  };

  // Log connection status on first render
  useEffect(() => {
    console.log('useSupabase hook initial state:', { isConnected, error });
  }, []);

  return {
    supabase,
    isConnected,
    error,
    checkConnection,
    insertData,
    debugConnectionStatus,
  };
}
