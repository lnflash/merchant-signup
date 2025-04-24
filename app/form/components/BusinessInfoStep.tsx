'use client';

import { useFormContext } from 'react-hook-form';
import { SignupFormData } from '../../../src/types';
import { EnhancedAddressInput } from './EnhancedAddressInput';

type StepProps = {
  currentStep: number;
  setCurrentStep: (step: number) => void;
};

export const BusinessInfoStep: React.FC<StepProps> = ({ currentStep, setCurrentStep }) => {
  const {
    register,
    formState: { errors },
    watch,
    setValue,
    clearErrors,
  } = useFormContext<SignupFormData>();

  const accountType = watch('account_type');

  // For debugging
  console.log('💼 BusinessInfoStep rendering, accountType:', accountType);

  if (currentStep !== 3) return null;

  // Clear business field errors if account type is merchant (since they're optional)
  if (accountType === 'merchant' && (errors.business_name || errors.business_address)) {
    clearErrors(['business_name', 'business_address']);
  }

  const skipBusinessInfo = () => {
    if (accountType === 'merchant') {
      // For merchants, business info is optional, so we can skip
      clearErrors(['business_name', 'business_address']); // Ensure errors are cleared
      setCurrentStep(4);
    }
  };

  const isBusinessInfoRequired = accountType === 'business' || 'merchant';
  const validateAndContinue = () => {
    if (accountType === 'personal') {
      // For merchants, business info is optional
      clearErrors(['business_name', 'business_address']); // Ensure errors are clearedß
      setCurrentStep(4);
    } else if (accountType === 'business') {
      // For professionals, business info is required
      const businessName = watch('business_name');
      const businessAddress = watch('business_address');

      let isValid = true;

      if (!businessName || businessName.length < 2) {
        isValid = false;
        setValue('business_name', businessName || '', { shouldValidate: true });
      }

      if (!businessAddress || businessAddress.length < 5) {
        isValid = false;
        setValue('business_address', businessAddress || '', { shouldValidate: true });
      }

      if (isValid) {
        setCurrentStep(5); // Skip to terms for business/professional
      }
    } else {
      // For personal, go straight to terms
      setCurrentStep(5);
    }
  };

  return (
    <div className="bg-white rounded-lg">
      <h3 className="text-xl font-semibold text-gray-800 mb-6">
        Business Information
        {!isBusinessInfoRequired && (
          <span className="text-sm font-normal text-gray-500 ml-2">(Optional for Merchants)</span>
        )}
      </h3>

      {/* Business Name Field */}
      <div className="form-group mb-6">
        <label htmlFor="business_name" className="form-label">
          Business Name
          {isBusinessInfoRequired && <span className="text-red-500 ml-1">*</span>}
          {!isBusinessInfoRequired && (
            <span className="text-gray-400 text-xs ml-2">(Optional)</span>
          )}
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg
              className="h-5 w-5 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
          </div>
          <input
            id="business_name"
            {...register('business_name')}
            className="form-input input-with-icon"
            placeholder={isBusinessInfoRequired ? 'Your business name' : 'Optional for merchants'}
            aria-required={isBusinessInfoRequired}
            aria-invalid={errors.business_name ? 'true' : 'false'}
          />
        </div>
        {errors.business_name && (
          <p className="form-error" role="alert">
            {errors.business_name.message?.toString()}
          </p>
        )}
      </div>

      {/* Enhanced Address Input with Integrated Map */}
      <div className="form-group">
        <label htmlFor="business_address" className="form-label">
          Business Address
          {isBusinessInfoRequired && <span className="text-red-500 ml-1">*</span>}
          {!isBusinessInfoRequired && (
            <span className="text-gray-400 text-xs ml-2">(Optional)</span>
          )}
        </label>

        {/* New all-in-one address input and map component */}
        <EnhancedAddressInput isRequired={isBusinessInfoRequired} />
      </div>

      {/* Navigation Buttons */}
      <div className="mt-8 flex justify-between">
        <button
          type="button"
          onClick={() => setCurrentStep(2)}
          className="form-btn-secondary flex items-center"
          aria-label="Go back to previous step"
        >
          <svg className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          <span>Back</span>
        </button>

        <div className="flex space-x-3">
          {accountType === 'merchant' && (
            <button
              type="button"
              onClick={skipBusinessInfo}
              className="form-btn-secondary"
              aria-label="Skip business information section"
            >
              Skip
            </button>
          )}

          <button
            type="button"
            onClick={validateAndContinue}
            className="form-btn flex items-center"
            aria-label="Continue to next step"
          >
            <span>Continue</span>
            <svg className="ml-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};
