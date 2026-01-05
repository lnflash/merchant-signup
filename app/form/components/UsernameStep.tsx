'use client';

import { useFormContext } from 'react-hook-form';
import { SignupFormData } from '../../../src/types';
import Image from 'next/image';
import FlashIcon from '../../assets/flash_icon_transp.png';

// TODO: Re-enable username validation once CORS issue is resolved
// import { validateFlashUsername } from '../../../src/services/flashApi';
//
// Currently disabled due to CORS restrictions when calling api.flashapp.me directly
// Options to fix:
// 1. Deploy as Node.js server (not static export) to enable /api/validate-username route
// 2. Ask Flash team to add CORS headers for signup.getflash.io
// 3. Set up an external proxy (DigitalOcean Functions, Cloudflare Workers)
//
// When re-enabling validation:
// - Uncomment the validateFlashUsername import
// - Add useState for isValidating, isValidUsername, validationMessage
// - Add useCallback for validateUsername function
// - Add useEffect with debounce for real-time validation
// - Update handleContinue to check isValidUsername
// - Add loading spinner and success/error icons to the input
// - Add validation message display below input

type StepProps = {
  currentStep: number;
  setCurrentStep: (step: number) => void;
};

export const UsernameStep: React.FC<StepProps> = ({ currentStep, setCurrentStep }) => {
  const {
    register,
    formState: { errors },
    watch,
  } = useFormContext<SignupFormData>();

  const username = watch('username');

  if (currentStep !== 1) return null;

  const handleContinue = () => {
    // TODO: Replace this simple check with proper Flash API validation
    // Currently just checking if username is not empty
    if (username && username.trim().length > 0) {
      setCurrentStep(2);
    }
  };

  const isUsernameEmpty = !username || username.trim().length === 0;

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
            <span className="text-gray-400 font-medium">@</span>
          </div>
          <input
            id="username"
            type="text"
            placeholder="yourflashusername"
            {...register('username')}
            className="form-input pl-8"
            aria-required="true"
            aria-invalid={errors.username ? 'true' : 'false'}
            autoComplete="off"
            autoCapitalize="none"
            autoCorrect="off"
          />
        </div>
        {errors.username && (
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
          disabled={isUsernameEmpty}
          className={`form-btn flex items-center ${
            isUsernameEmpty ? 'opacity-50 cursor-not-allowed' : ''
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
