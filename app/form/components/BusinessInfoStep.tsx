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
  } = useFormContext<SignupFormData>();

  const accountType = watch('account_type');

  // For debugging
  console.log('💼 BusinessInfoStep rendering, accountType:', accountType);

  if (currentStep !== 3) return null;

  // We used to clear errors here when they were optional, but now we need validation

  const isBusinessInfoRequired = accountType === 'business' || accountType === 'merchant';
  const validateAndContinue = () => {
    if (accountType === 'merchant') {
      // For merchants, business info is now required
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
        setCurrentStep(4); // Continue to merchant step
      }
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
      <h3 className="text-xl font-semibold text-gray-800 mb-6">Business Information</h3>

      {/* Business Name Field */}
      <div className="form-group mb-6">
        <label htmlFor="business_name" className="form-label">
          Business Name
          <span className="text-red-500 ml-1">*</span>
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
            placeholder="Your business name"
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
          <span className="text-red-500 ml-1">*</span>
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
