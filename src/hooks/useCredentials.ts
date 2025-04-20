import { useState, useEffect, useRef } from 'react';

/**
 * Type for Supabase credentials
 */
export interface SupabaseCredentials {
  supabaseUrl: string;
  supabaseKey: string;
  bucket: string;
  environment?: string;
  buildTime?: boolean;
  platform?: string;
  traceId?: string;
  serverTime?: string;
  debug?: {
    envKeys: string[];
    isDigitalOcean: boolean;
    isSupabaseConfigured: boolean;
    doNamespace?: string;
    doAppId?: boolean;
  };
}

/**
 * Custom hook to fetch and manage Supabase credentials
 * Ensures consistent access to credentials across components
 */
export function useCredentials() {
  const [credentials, setCredentials] = useState<SupabaseCredentials | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const hookId = useRef(
    `hook_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 5)}`
  );
  const retryCount = useRef(0);
  const maxRetries = 3;

  // Log information about the hook instance being created
  useEffect(() => {
    // Store current hookId value to avoid the cleanup function using a changed ref value
    const currentHookId = hookId.current;
    console.info(`[🔑] [${currentHookId}] useCredentials hook initialized`);

    return () => {
      console.info(`[🔑] [${currentHookId}] useCredentials hook cleanup`);
    };
  }, []);

  useEffect(() => {
    // Skip if hook is used on the server-side
    if (typeof window === 'undefined') {
      console.info(`[🔑] [${hookId.current}] Running on server-side, skipping credential fetch`);
      setLoading(false);
      return;
    }

    async function fetchCredentials() {
      try {
        // Reset any previous error
        if (error) setError(null);

        // Mark the start time for performance tracking
        const startTime = Date.now();
        console.info(
          `[🔑] [${hookId.current}] 🔄 Fetching credentials from API... (attempt: ${retryCount.current + 1}/${maxRetries + 1})`
        );

        // Fetch credentials from our secure API endpoint
        const response = await fetch('/api/credentials', {
          cache: 'no-store', // Explicitly disable caching
          headers: {
            'X-Hook-ID': hookId.current,
            'X-Client-Time': new Date().toISOString(),
          },
        });

        const fetchTime = Date.now() - startTime;

        // Check response status
        if (!response.ok) {
          throw new Error(`Failed to fetch credentials: ${response.status} ${response.statusText}`);
        }

        // Parse response to JSON
        const data = await response.json();
        const traceId = data.traceId || `manual_${Date.now().toString(36)}`;

        // Generate a detailed log of credential availability
        const credentialStatus = {
          hookId: hookId.current,
          traceId,
          timestamp: new Date().toISOString(),
          serverTime: data.serverTime,
          timeDiffMs: data.serverTime
            ? new Date().getTime() - new Date(data.serverTime).getTime()
            : null,
          fetchTimeMs: fetchTime,
          requestSuccess: response.ok,
          responseStatus: response.status,
          hasUrl: !!data.supabaseUrl,
          hasKey: !!data.supabaseKey,
          urlLength: data.supabaseUrl ? data.supabaseUrl.length : 0,
          keyLength: data.supabaseKey ? data.supabaseKey.length : 0,
          urlPrefix: data.supabaseUrl ? data.supabaseUrl.substring(0, 8) : 'none',
          bucket: data.bucket,
          environment: data.environment,
          buildTime: data.buildTime,
          platform: data.platform || 'unknown',
          debug: data.debug || null,
        };

        if (!data.supabaseUrl || !data.supabaseKey) {
          console.warn(
            `[🔑] [${hookId.current}] ⚠️ MISSING CREDENTIALS IN RESPONSE!`,
            credentialStatus
          );
          console.error(
            `[🔑] [${hookId.current}] 🚨 CRITICAL: Supabase credentials missing in API response!`
          );

          // Track missing credentials across retries
          if (retryCount.current < maxRetries) {
            retryCount.current += 1;
            console.info(
              `[🔑] [${hookId.current}] 🔄 Retrying credential fetch (${retryCount.current}/${maxRetries})...`
            );
            setTimeout(() => fetchCredentials(), 1000 * retryCount.current); // Exponential backoff
            return;
          }
        } else {
          console.info(`[🔑] [${hookId.current}] ✅ CREDENTIALS RECEIVED:`, {
            hasUrl: credentialStatus.hasUrl,
            hasKey: credentialStatus.hasKey,
            urlLength: credentialStatus.urlLength,
            keyLength: credentialStatus.keyLength,
            bucket: credentialStatus.bucket,
            platform: credentialStatus.platform,
          });
        }

        setCredentials(data);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        setError(error);
        console.error(`[🔑] [${hookId.current}] ❌ Error fetching credentials:`, {
          message: error.message,
          stack: error.stack?.substring(0, 150) + '...',
          retryCount: retryCount.current,
        });

        // Retry on failure
        if (retryCount.current < maxRetries) {
          retryCount.current += 1;
          console.info(
            `[🔑] [${hookId.current}] 🔄 Retrying after error (${retryCount.current}/${maxRetries})...`
          );
          setTimeout(() => fetchCredentials(), 1000 * retryCount.current); // Exponential backoff
          return;
        }
      } finally {
        if (retryCount.current >= maxRetries || credentials?.supabaseUrl) {
          setLoading(false);
          console.info(
            `[🔑] [${hookId.current}] ✓ Credential fetching complete. Has credentials: ${!!credentials?.supabaseUrl}`
          );
        }
      }
    }

    fetchCredentials();
  }, [error, credentials?.supabaseUrl]); // Include credential URL dependency

  return { credentials, loading, error, hookId: hookId.current };
}
