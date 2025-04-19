import { NextResponse } from 'next/server';
import { config } from '../../../src/config';

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    version: config.app.version,
    timestamp: new Date().toISOString()
  });
}