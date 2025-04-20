import { NextResponse } from 'next/server';
import { logger } from '../../../src/utils/logger';

/**
 * CSP Report endpoint
 * Receives and logs CSP violations to help debug content security policy issues
 */
export async function POST(request: Request) {
  try {
    // Get CSP report data from request
    let report;
    try {
      report = await request.json();
      console.log('📝 CSP Violation Report Received');

      // Log the CSP violation but exclude certain common violations
      const reportData = report['csp-report'] || report;
      const blockedUri = reportData.blockedUri || reportData['blocked-uri'] || '';

      // Filter out Cloudflare related reports
      if (
        blockedUri.includes('cloudflare') ||
        (reportData.documentUri || '').includes('cloudflare') ||
        (reportData.documentURL || '').includes('cloudflare')
      ) {
        // Skip logging this report
        return NextResponse.json({ status: 'accepted but filtered' });
      }

      // Log the report
      logger.warn('CSP Violation', {
        blockedUri,
        violatedDirective: reportData.violatedDirective || reportData['violated-directive'],
        documentUri: reportData.documentUri || reportData['document-uri'],
        sourceFile: reportData.sourceFile || reportData['source-file'] || 'unknown',
      });
    } catch (parseError) {
      logger.error('Failed to parse CSP report', parseError);
      return NextResponse.json(
        { status: 'error', message: 'Invalid JSON in report body' },
        { status: 400 }
      );
    }

    return NextResponse.json({ status: 'accepted' });
  } catch (error: any) {
    logger.error('CSP report handling error', error);
    return NextResponse.json(
      { status: 'error', message: 'Server error processing report' },
      { status: 500 }
    );
  }
}
