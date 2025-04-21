import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase-singleton';
import { logger } from '../utils/logger';

/**
 * Custom hook for interacting with Supabase
 * Provides connection status and error handling
 */
export function useSupabase() {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isStaticBuild, setIsStaticBuild] = useState<boolean>(false);
  const hookId = useRef(
    `supabase_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 5)}`
  );

  // Detect if we're in a static build
  useEffect(() => {
    const inStaticBuild = typeof window !== 'undefined' && window.ENV && window.ENV.BUILD_TIME;
    setIsStaticBuild(!!inStaticBuild);
    
    logger.info(`[🔌] [${hookId.current}] useSupabase hook initialized`, {
      isStaticBuild: !!inStaticBuild,
      timestamp: new Date().toISOString(),
    });
    
    // Check connection on mount
    checkConnection();
    
    return () => {
      logger.info(`[🔌] [${hookId.current}] useSupabase hook cleanup`);
    };
  }, []);

  // Function to check Supabase connection
  const checkConnection = async () => {
    try {
      logger.info(`[🔌] [${hookId.current}] Checking Supabase connection...`);
      
      // If this is a static build, check for window.ENV credentials
      if (isStaticBuild) {
        if (typeof window !== 'undefined' && window.ENV && window.ENV.SUPABASE_URL && window.ENV.SUPABASE_KEY) {
          logger.info(`[🔌] [${hookId.current}] Static build with valid credentials`, {
            hasUrl: true,
            hasKey: true,
            source: 'window.ENV',
          });
          setIsConnected(true);
          setError(null);
          return;
        }
      }
      
      // Try a simple query to test the connection
      const testTable = 'signups'; // or any table you have in your Supabase
      const { error } = await supabase.from(testTable).select('id', { count: 'exact', head: true });

      if (error) {
        logger.error(`[🔌] [${hookId.current}] Supabase connection failed`, {
          error: error.message,
          code: error.code,
          details: error.details,
        });
        setIsConnected(false);
        setError(error.message);
      } else {
        logger.info(`[🔌] [${hookId.current}] Supabase connection successful`);
        setIsConnected(true);
        setError(null);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      logger.error(`[🔌] [${hookId.current}] Supabase connection error`, {
        error: errorMessage,
        stack: err instanceof Error ? err.stack?.substring(0, 150) : 'No stack',
      });
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
    // Get client details for diagnostics (safely)
    const credentials = typeof window !== 'undefined' && window.ENV 
      ? { 
          source: 'window.ENV',
          hasUrl: !!window.ENV.SUPABASE_URL, 
          hasKey: !!window.ENV.SUPABASE_KEY,
          isStaticBuild: !!window.ENV.BUILD_TIME
        }
      : { 
          source: 'process.env',
          hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
          hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          isStaticBuild: process.env.IS_BUILD_TIME === 'true'
        };
    
    console.log(`[🔌] [${hookId.current}] Current Supabase connection status:`, {
      isConnected,
      error,
      isStaticBuild,
      supabaseInstance: supabase ? 'exists' : 'missing',
      credentials
    });
    
    // Force a new connection check
    checkConnection();
  };

  // Log connection status on changes
  useEffect(() => {
    logger.info(`[🔌] [${hookId.current}] Supabase connection status changed:`, { 
      isConnected, 
      hasError: !!error,
      isStaticBuild 
    });
  }, [isConnected, error, isStaticBuild]);

  return {
    supabase,
    isConnected,
    error,
    isStaticBuild,
    checkConnection,
    insertData,
    debugConnectionStatus,
    hookId: hookId.current,
  };
}
