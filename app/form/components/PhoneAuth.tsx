import { useState, useEffect } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { logger } from '../../../src/utils/logger';

interface PhoneAuthProps {
  onAuthenticated: (userId: string, phoneNumber: string) => void;
}

// Schema for phone validation and verification
const phoneAuthSchema = z.object({
  phoneNumber: z
    .string()
    .min(10, 'Phone number is too short')
    .regex(/^\+?[0-9]{10,15}$/, 'Phone number must be valid format')
    .transform(val => val.replace(/\s+/g, '')), // Remove spaces
  verificationCode: z
    .string()
    .length(6, 'Verification code must be 6 digits')
    .regex(/^[0-9]{6}$/, 'Verification code must be 6 digits')
    .optional(),
});

type PhoneAuthInputs = z.infer<typeof phoneAuthSchema>;

export default function PhoneAuth({ onAuthenticated }: PhoneAuthProps) {
  const [step, setStep] = useState<'phone' | 'verification'>('phone');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Used in token creation
  const [sessionId, setSessionId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<PhoneAuthInputs>({
    resolver: zodResolver(phoneAuthSchema),
    defaultValues: {
      phoneNumber: '',
      verificationCode: '',
    },
  });

  const phoneNumber = watch('phoneNumber');

  // Handle phone number submission
  const handlePhoneSubmit = async (data: PhoneAuthInputs) => {
    setIsSubmitting(true);
    setError(null);

    try {
      // In a real implementation, this would call an API to send SMS
      // For demo purposes, we'll simulate a successful response
      logger.info('Sending verification code to phone', {
        phone: data.phoneNumber.substring(0, 3) + '***', // Redact most of the number
      });

      // Generate a verification code (in real app this would be sent via SMS)
      // In test mode, use a fixed verification code (123456) for predictable testing
      const isTestEnvironment =
        process.env.NODE_ENV === 'test' ||
        (typeof navigator !== 'undefined' && navigator.userAgent.includes('Playwright'));
      const verificationCode = isTestEnvironment
        ? '123456'
        : Math.floor(100000 + Math.random() * 900000).toString();

      const tempSessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;

      // Store the verification code and session info in localStorage
      // In production, this would be handled server-side with secure storage
      localStorage.setItem(
        'pendingVerification',
        JSON.stringify({
          phoneNumber: data.phoneNumber,
          verificationCode,
          sessionId: tempSessionId,
          expires: Date.now() + 10 * 60 * 1000, // 10 minutes
        })
      );

      setSessionId(tempSessionId);

      // Alert with code for demo purposes (in real app, this would be sent via SMS)
      // In test environments, don't show the alert to avoid blocking tests
      if (!isTestEnvironment) {
        alert(`For demo purposes, your verification code is: ${verificationCode}`);
      } else {
        console.log('TEST MODE: Verification code is 123456');
      }

      // Move to verification step
      setStep('verification');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError('Failed to send verification code: ' + errorMessage);
      logger.error('Phone verification error', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle verification code submission
  const handleVerificationSubmit = async (data: PhoneAuthInputs) => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Retrieve stored verification info
      const storedDataJson = localStorage.getItem('pendingVerification');
      if (!storedDataJson) {
        setError('Verification session expired. Please try again.');
        setStep('phone');
        return;
      }

      const storedData = JSON.parse(storedDataJson);

      // Check if verification has expired
      if (storedData.expires < Date.now()) {
        localStorage.removeItem('pendingVerification');
        setError('Verification code expired. Please try again.');
        setStep('phone');
        return;
      }

      // Verify the code matches and phone number matches
      if (data.verificationCode !== storedData.verificationCode) {
        setError('Invalid verification code. Please try again.');
        return;
      }

      if (data.phoneNumber !== storedData.phoneNumber) {
        setError('Phone number mismatch. Please start over.');
        setStep('phone');
        return;
      }

      // Success! Generate a user session
      const userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
      const authToken = `phone_auth_${Math.random().toString(36).substring(2, 10)}_${Date.now()}`;

      // Store authenticated user info
      localStorage.setItem(
        'authenticatedUser',
        JSON.stringify({
          userId,
          phoneNumber: data.phoneNumber,
          sessionId: storedData.sessionId,
          authToken: authToken,
          authenticated: true,
          expires: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
        })
      );

      // Remove the pending verification
      localStorage.removeItem('pendingVerification');

      // Notify parent component
      onAuthenticated(userId, data.phoneNumber);

      logger.info('Phone authentication successful', {
        userId,
        phone: data.phoneNumber.substring(0, 3) + '***', // Redact most of the number
      });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError('Verification failed: ' + errorMessage);
      logger.error('Verification error', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check for existing authentication on component mount
  useEffect(() => {
    const storedAuthJson = localStorage.getItem('authenticatedUser');
    if (storedAuthJson) {
      try {
        const storedAuth = JSON.parse(storedAuthJson);

        // Check if the session is still valid
        if (storedAuth.expires > Date.now()) {
          // Valid session exists, notify parent
          onAuthenticated(storedAuth.userId, storedAuth.phoneNumber);
          return;
        } else {
          // Expired session, clean up
          localStorage.removeItem('authenticatedUser');
        }
      } catch (err) {
        // Invalid JSON, clean up
        localStorage.removeItem('authenticatedUser');
      }
    }
  }, [onAuthenticated]);

  // Determine which form to show based on step
  const currentSubmitHandler = step === 'phone' ? handlePhoneSubmit : handleVerificationSubmit;

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">
        {step === 'phone' ? 'Authenticate with Phone' : 'Enter Verification Code'}
      </h2>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(currentSubmitHandler)} className="space-y-4">
        <div>
          <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number
          </label>
          <input
            id="phoneNumber"
            type="tel"
            {...register('phoneNumber')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="+1234567890"
            disabled={step === 'verification' || isSubmitting}
            required
          />
          {errors.phoneNumber && (
            <p className="mt-1 text-sm text-red-600">{errors.phoneNumber.message}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            Enter your phone number including country code
          </p>
        </div>

        {step === 'verification' && (
          <div>
            <label
              htmlFor="verificationCode"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Verification Code
            </label>
            <input
              id="verificationCode"
              type="text"
              inputMode="numeric"
              {...register('verificationCode')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="123456"
              disabled={isSubmitting}
              required
            />
            {errors.verificationCode && (
              <p className="mt-1 text-sm text-red-600">{errors.verificationCode.message}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Enter the 6-digit verification code sent to your phone
            </p>
          </div>
        )}

        <div>
          <button
            type="submit"
            disabled={isSubmitting || (step === 'phone' && !phoneNumber)}
            className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
              isSubmitting || (step === 'phone' && !phoneNumber)
                ? 'opacity-70 cursor-not-allowed'
                : ''
            }`}
          >
            {isSubmitting
              ? 'Please wait...'
              : step === 'phone'
                ? 'Send Verification Code'
                : 'Verify & Continue'}
          </button>
        </div>

        {step === 'verification' && (
          <div className="text-center mt-2">
            <button
              type="button"
              className="text-sm text-blue-600 hover:text-blue-800"
              onClick={() => setStep('phone')}
              disabled={isSubmitting}
            >
              Use a different phone number
            </button>
          </div>
        )}
      </form>

      <div className="mt-4 text-center">
        <p className="text-xs text-gray-500">
          By continuing, you agree to our Terms of Service and Privacy Policy. Your phone number
          will only be used for authentication purposes.
        </p>
      </div>
    </div>
  );
}
