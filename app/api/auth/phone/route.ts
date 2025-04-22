import { NextResponse } from 'next/server';
import { logger } from '../../../../src/utils/logger';
import { z } from 'zod';
import { withCSRF } from '../../../../lib/csrf';

// Phone verification request schema
const phoneVerifySchema = z.object({
  phoneNumber: z
    .string()
    .min(10, 'Phone number is too short')
    .regex(/^\+?[0-9]{10,15}$/, 'Phone number must be valid format'),
  csrf_token: z.string().min(1, 'CSRF token is required'),
});

// Phone verification code submission schema
const phoneCodeSchema = z.object({
  phoneNumber: z
    .string()
    .min(10, 'Phone number is too short')
    .regex(/^\+?[0-9]{10,15}$/, 'Phone number must be valid format'),
  verificationCode: z
    .string()
    .length(6, 'Verification code must be 6 digits')
    .regex(/^[0-9]{6}$/, 'Verification code must be 6 digits'),
  sessionId: z.string().min(1, 'Session ID is required'),
  csrf_token: z.string().min(1, 'CSRF token is required'),
});

/**
 * Request phone verification - sends a verification code to the provided phone number
 */
export async function POST(request: Request) {
  return withCSRF(handlePhoneVerification)(request);
}

async function handlePhoneVerification(request: Request) {
  try {
    // Parse and validate request
    const body = await request.json();

    try {
      const { phoneNumber } = phoneVerifySchema.parse(body);

      // In a real implementation, this would connect to an SMS service
      // For demo purposes, we'll generate a verification code and return it directly
      // (in production, the code would be sent via SMS, not returned in the response)

      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;

      // In a real implementation, store this verification in a database with TTL
      // For demo, we'll include it in the response

      logger.info('Phone verification request', {
        phone: phoneNumber.substring(0, 3) + '***', // Redact most of the number
        sessionId,
      });

      return NextResponse.json({
        success: true,
        message: 'Verification code sent',
        data: {
          sessionId,
          // Only for demo purposes - in production, this would be sent via SMS
          verificationCode,
          expires: Date.now() + 10 * 60 * 1000, // 10 minutes
        },
      });
    } catch (validationError: unknown) {
      const errorMessage =
        validationError instanceof Error ? validationError.message : 'Invalid request';
      logger.error('Phone verification validation error', validationError);
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed: ' + errorMessage,
        },
        { status: 400 }
      );
    }
  } catch (error: unknown) {
    logger.error('Phone verification error', error);
    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred during verification request',
      },
      { status: 500 }
    );
  }
}

/**
 * Verify phone code - validates the verification code sent to the phone
 */
export async function PUT(request: Request) {
  return withCSRF(handlePhoneVerifyCode)(request);
}

async function handlePhoneVerifyCode(request: Request) {
  try {
    // Parse and validate request
    const body = await request.json();

    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { phoneNumber, verificationCode, sessionId } = phoneCodeSchema.parse(body);

      // In a real implementation, this would check a database for the verification request
      // For demo purposes, we'll simulate successful verification

      // Generate a user ID that will be used to associate with form submissions
      const userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;

      logger.info('Phone verification successful', {
        phone: phoneNumber.substring(0, 3) + '***', // Redact most of the number
        userId,
        sessionId,
      });

      // Generate an auth token to use for future API requests
      const authToken = `phone_auth_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;

      return NextResponse.json({
        success: true,
        message: 'Phone verified successfully',
        data: {
          userId,
          phoneNumber,
          authToken,
          expires: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
        },
      });
    } catch (validationError: unknown) {
      const errorMessage =
        validationError instanceof Error ? validationError.message : 'Invalid request';
      logger.error('Phone verification code validation error', validationError);
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed: ' + errorMessage,
        },
        { status: 400 }
      );
    }
  } catch (error: unknown) {
    logger.error('Phone verification code error', error);
    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred during verification',
      },
      { status: 500 }
    );
  }
}
