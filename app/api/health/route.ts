import { NextResponse } from 'next/server';
import { config } from '../../../src/config';
import { supabase } from '../../../lib/supabase';

/**
 * Health check endpoint for the API
 * Returns information about the application and database status
 */
export async function GET() {
  // Check if we're in build time
  if (process.env.IS_BUILD_TIME === 'true') {
    return NextResponse.json({
      status: 'healthy',
      build: true,
      version: config.app.version,
      timestamp: new Date().toISOString(),
    });
  }

  // Check Supabase connection in runtime
  try {
    // Simple test query to check DB connectivity
    const { error } = await supabase.from('signups').select('id', { count: 'exact', head: true });

    const dbStatus = error ? 'error' : 'connected';

    // Set cache control headers for this endpoint
    const headers = new Headers();
    headers.set('Cache-Control', 'public, max-age=30, s-maxage=60');

    return NextResponse.json(
      {
        status: 'healthy',
        database: dbStatus,
        version: config.app.version,
        timestamp: new Date().toISOString(),
        error: error ? error.message : null,
      },
      {
        status: 200,
        headers,
      }
    );
  } catch (e: any) {
    console.error('Health check error:', e);

    return NextResponse.json(
      {
        status: 'degraded',
        error: e?.message || 'Unknown error',
        version: config.app.version,
        timestamp: new Date().toISOString(),
      },
      {
        status: 500,
      }
    );
  }
}
