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

  if (currentStep !== 4) return null;

  // We used to clear errors here when they were optional, but now we need validation

  const isBusinessInfoRequired = accountType === 'business' || accountType === 'merchant';
  const validateAndContinue = () => {
    // Log the value of wants_terminal to debug
    const wantsTerminal = watch('wants_terminal');
    console.log('💻 Terminal checkbox state before validation:', {
      wantsTerminal,
      type: typeof wantsTerminal,
      checked: !!wantsTerminal,
      forcedBoolean: wantsTerminal ? true : false,
    });

    // CRITICAL: Force a proper boolean value for the terminal checkbox
    // Do this here to ensure it's set correctly before moving to the next step
    setValue('wants_terminal', wantsTerminal ? true : false, { shouldValidate: false });

    // Log again after forcing boolean
    console.log('💻 Terminal checkbox state AFTER forcing boolean:', {
      wantsTerminal: watch('wants_terminal'),
      type: typeof watch('wants_terminal'),
    });

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
        // Make sure the terminal value is a proper boolean
        if (wantsTerminal !== undefined) {
          setValue('wants_terminal', !!wantsTerminal, { shouldValidate: false });
        }
        setCurrentStep(5); // Continue to merchant step
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
        // Make sure the terminal value is a proper boolean
        if (wantsTerminal !== undefined) {
          setValue('wants_terminal', !!wantsTerminal, { shouldValidate: false });
        }
        setCurrentStep(5); // Continue to banking info for business/professional
      }
    } else {
      // For personal, go straight to terms
      // Make sure the terminal value is a proper boolean if set
      if (wantsTerminal !== undefined) {
        setValue('wants_terminal', !!wantsTerminal, { shouldValidate: false });
      }
      setCurrentStep(6);
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

      {/* Flash Terminal Checkbox */}
      <div className="form-group mb-4 mt-6">
        <div className="flex items-start">
          <div className="flex items-center h-5">
            <input
              id="wants_terminal"
              type="checkbox"
              // IMPORTANT: Don't use register here - it can cause issues with the checkbox state
              // Instead, manage the state manually
              checked={!!watch('wants_terminal')}
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              onChange={e => {
                // Explicitly set the boolean value based on checkbox state
                const isChecked = e.target.checked;
                // CRITICAL: Force true or false boolean value
                setValue('wants_terminal', isChecked ? true : false, { shouldValidate: false });
                // Log the change to help debug
                console.log('💻 Terminal checkbox changed:', {
                  isChecked,
                  forcedBoolean: isChecked ? true : false,
                  type: typeof (isChecked ? true : false),
                });
              }}
            />
          </div>
          <div className="ml-3 text-sm">
            <label htmlFor="wants_terminal" className="font-medium text-gray-700 flex items-center">
              Do you want a Flash Terminal?
              <div className="relative ml-2 group">
                <svg
                  className="w-4 h-4 text-gray-500 cursor-pointer"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
                    clipRule="evenodd"
                  />
                </svg>
                <div
                  className="absolute left-0 bottom-6 w-64 p-3 text-xs bg-gray-700 text-white rounded shadow-lg
                     opacity-0 pointer-events-none group-hover:opacity-100 transition duration-150 ease-in-out z-50"
                >
                  A Flash Terminal is a smartdevice that can accept payment via Flash for your
                  business and print receipts. A customer service representative will contact you if
                  you check this box.
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Debug display for terminal value - only visible in development */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-1 text-xs text-gray-400">
            Terminal state: {watch('wants_terminal') ? 'true' : 'false'}(
            {typeof watch('wants_terminal')})
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="mt-8 flex justify-between">
        <button
          type="button"
          onClick={() => setCurrentStep(3)}
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
