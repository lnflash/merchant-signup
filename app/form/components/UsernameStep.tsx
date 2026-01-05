'use client';

import { useState, useEffect, useCallback } from 'react';
import { useFormContext } from 'react-hook-form';
import { SignupFormData } from '../../../src/types';
import { validateFlashUsername } from '../../../src/services/flashApi';
import Image from 'next/image';
import FlashIcon from '../../assets/flash_icon_transp.png';

type StepProps = {
  currentStep: number;
  setCurrentStep: (step: number) => void;
};

export const UsernameStep: React.FC<StepProps> = ({ currentStep, setCurrentStep }) => {
  const {
    register,
    formState: { errors },
    watch,
    setError,
    clearErrors,
  } = useFormContext<SignupFormData>();

  const [isValidating, setIsValidating] = useState(false);
  const [isValidUsername, setIsValidUsername] = useState(false);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);

  const username = watch('username');

  // Debounced validation
  const validateUsername = useCallback(
    async (value: string) => {
      if (!value || value.trim() === '') {
        setIsValidUsername(false);
        setValidationMessage(null);
        return;
      }

      setIsValidating(true);
      setValidationMessage(null);

      const result = await validateFlashUsername(value);

      setIsValidating(false);

      if (result.valid) {
        setIsValidUsername(true);
        setValidationMessage('Username verified');
        clearErrors('username');
      } else {
        setIsValidUsername(false);
        setValidationMessage(result.error || 'Username not found');
        setError('username', { message: result.error || 'Username not found' });
      }
    },
    [clearErrors, setError]
  );

  // Debounce effect for username validation
  useEffect(() => {
    if (!username || username.trim() === '') {
      setIsValidUsername(false);
      setValidationMessage(null);
      return;
    }

    const timeoutId = setTimeout(() => {
      validateUsername(username);
    }, 400);

    return () => clearTimeout(timeoutId);
  }, [username, validateUsername]);

  if (currentStep !== 1) return null;

  const handleContinue = () => {
    if (isValidUsername) {
      setCurrentStep(2);
    }
  };

  return (
    <div className="bg-white rounded-lg">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">Flash Username</h3>

      <p className="text-gray-600 mb-6">
        Enter your Flash username to continue with the merchant signup process.
      </p>

      <div className="form-group">
        <label htmlFor="username" className="form-label">
          Username
          <span className="text-red-500 ml-1">*</span>
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {/* <span className="text-gray-400 font-medium"></span> */}
          </div>
          <input
            id="username"
            type="text"
            placeholder="yourflashusername"
            {...register('username')}
            className={`form-input pl-8 pr-10 ${
              isValidUsername
                ? 'border-green-500 focus:border-green-500 focus:ring-green-500'
                : validationMessage && !isValidating
                  ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                  : ''
            }`}
            aria-required="true"
            aria-invalid={errors.username ? 'true' : 'false'}
            autoComplete="off"
            autoCapitalize="none"
            autoCorrect="off"
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            {isValidating && (
              <svg
                className="animate-spin h-5 w-5 text-blue-500"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            )}
            {!isValidating && isValidUsername && (
              <svg
                className="h-5 w-5 text-green-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            )}
            {!isValidating && validationMessage && !isValidUsername && (
              <svg
                className="h-5 w-5 text-red-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            )}
          </div>
        </div>
        {validationMessage && (
          <p
            className={`mt-2 text-sm ${isValidUsername ? 'text-green-600' : 'text-red-600'}`}
            role="alert"
          >
            {isValidUsername ? (
              <span className="flex items-center">
                <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                {validationMessage}
              </span>
            ) : (
              validationMessage
            )}
          </p>
        )}
        {errors.username && !validationMessage && (
          <p className="form-error" role="alert" id="username-error">
            {errors.username.message?.toString()}
          </p>
        )}
      </div>

      {/* Divider */}
      <div className="my-8 border-t border-gray-200"></div>

      {/* Don't have an account section */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h4 className="font-medium text-gray-800 mb-2">Don&apos;t have a Flash account?</h4>
        <p className="text-gray-600 text-sm mb-4">
          Download the Flash app to create your account and get your username.
        </p>
        <a
          href="https://getflash.io/app"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center px-4 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors shadow-sm"
        >
          <div className="mr-2 relative w-5 h-5">
            <Image
              src={FlashIcon}
              alt="Flash Logo"
              width={20}
              height={20}
              style={{ width: 'auto', height: 'auto' }}
              className="object-contain"
            />
          </div>
          Get the Flash App
          <svg className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
        </a>
      </div>

      <div className="flex justify-end mt-8">
        <button
          type="button"
          onClick={handleContinue}
          disabled={!isValidUsername || isValidating}
          className={`form-btn flex items-center ${
            !isValidUsername || isValidating ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          aria-label="Continue to next step"
        >
          <span>Continue</span>
          <svg className="ml-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default UsernameStep;
