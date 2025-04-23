'use client';

import { useFormContext } from 'react-hook-form';
import { SignupFormData } from '../../../src/types';
import PhoneInput from './PhoneInput';

type StepProps = {
  currentStep: number;
  setCurrentStep: (step: number) => void;
};

export const PersonalInfoStep: React.FC<StepProps> = ({ currentStep, setCurrentStep }) => {
  const {
    register,
    formState: { errors },
    trigger,
    watch,
    setValue,
  } = useFormContext<SignupFormData>();

  if (currentStep !== 1) return null;

  const validateAndContinue = async () => {
    // Get current values
    const name = watch('name');
    const phone = watch('phone');
    const email = watch('email');

    // Manual validation
    let isValid = true;

    if (!name || name.length < 2) {
      setValue('name', name || '', { shouldValidate: true });
      isValid = false;
    }

    if (!phone || !/^\+?[0-9]{10,15}$/.test(phone)) {
      setValue('phone', phone || '', { shouldValidate: true });
      isValid = false;
    }

    // Email is optional but must be valid if provided
    if (email && email.length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setValue('email', email || '', { shouldValidate: true });
      isValid = false;
    }

    // Show validation errors
    await trigger(['name', 'phone', 'email']);

    // Only proceed if all validations pass
    if (isValid) {
      setCurrentStep(2);
    }
  };

  return (
    <div className="bg-white rounded-lg">
      <h3 className="text-xl font-semibold text-gray-800 mb-6">Personal Information</h3>

      <div className="form-group">
        <label htmlFor="name" className="form-label">
          Full Name
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
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
          <input
            id="name"
            type="text"
            placeholder="John Doe"
            {...register('name')}
            className="form-input input-with-icon"
            aria-required="true"
            aria-invalid={errors.name ? 'true' : 'false'}
          />
        </div>
        {errors.name && (
          <p className="form-error" role="alert" id="name-error">
            {errors.name.message?.toString()}
          </p>
        )}
      </div>

      {/* Enhanced Phone Input component with international formatting */}
      <PhoneInput
        name="phone"
        label="Phone Number"
        required={true}
        placeholder="+1 (555) 123-4567"
        helpText="Enter your phone number with country code"
      />

      <div className="form-group">
        <label htmlFor="email" className="form-label">
          Email Address
          <span className="text-gray-400 text-xs ml-2">(Optional)</span>
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
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <input
            id="email"
            type="email"
            {...register('email')}
            className="form-input input-with-icon"
            placeholder="your.email@example.com"
            aria-invalid={errors.email ? 'true' : 'false'}
          />
        </div>
        {errors.email && (
          <p className="form-error" role="alert" id="email-error">
            {errors.email.message?.toString()}
          </p>
        )}
      </div>

      <div className="flex justify-end mt-8">
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
  );
};

export const AccountTypeStep: React.FC<StepProps> = ({ currentStep, setCurrentStep }) => {
  const {
    setValue,
    formState: { errors },
    clearErrors,
  } = useFormContext<SignupFormData>();

  if (currentStep !== 2) return null;

  const selectAccountType = (type: 'personal' | 'business' | 'merchant') => {
    setValue('account_type', type, { shouldValidate: true });

    // Clear validation errors for fields that might be optional based on account type
    clearErrors(['business_name', 'business_address']);

    if (type === 'personal') {
      setCurrentStep(5); // Skip to terms if personal
    } else {
      setCurrentStep(3); // Go to business info for both business and merchant
    }
  };

  return (
    <div>
      <h3 className="text-lg font-medium mb-4">Account Type</h3>
      <p className="mb-4">What type of account would you like to create?</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
        <button
          type="button"
          onClick={() => selectAccountType('personal')}
          className="p-6 border border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 focus:border-blue-500 transition-colors flex flex-col items-center justify-center shadow-sm hover:shadow group"
          aria-label="Select Personal account type"
        >
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
            <svg
              className="w-6 h-6 text-blue-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
          <span className="font-medium mb-2 text-gray-800">Personal</span>
          <span className="text-sm text-gray-500 text-center">For individual use</span>
        </button>

        <button
          type="button"
          onClick={() => selectAccountType('business')}
          className="p-6 border border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 focus:border-blue-500 transition-colors flex flex-col items-center justify-center shadow-sm hover:shadow group"
          aria-label="Select Professional account type"
        >
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
            <svg
              className="w-6 h-6 text-blue-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <span className="font-medium mb-2 text-gray-800">Professional</span>
          <span className="text-sm text-gray-500 text-center">For your professional practice</span>
        </button>

        <button
          type="button"
          onClick={() => {
            console.log('Setting account type to merchant');
            selectAccountType('merchant');
          }}
          className="p-6 border border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 focus:border-blue-500 transition-colors flex flex-col items-center justify-center shadow-sm hover:shadow group"
          aria-label="Select Merchant account type"
        >
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
            <svg
              className="w-6 h-6 text-blue-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          </div>
          <span className="font-medium mb-2 text-gray-800">Merchant</span>
          <span className="text-sm text-gray-500 text-center">Accept payments with Flash</span>
        </button>
      </div>

      {errors.account_type && (
        <p className="form-error">{errors.account_type.message?.toString()}</p>
      )}

      <div className="flex justify-between mt-6">
        <button type="button" onClick={() => setCurrentStep(1)} className="form-btn-secondary">
          Back
        </button>
      </div>
    </div>
  );
};

export const TermsStep: React.FC<StepProps> = ({ currentStep, setCurrentStep }) => {
  const {
    register,
    formState: { errors },
    watch,
    setValue,
  } = useFormContext<SignupFormData>();
  const accountType = watch('account_type');

  if (currentStep !== 5) return null;

  return (
    <div className="bg-white rounded-lg">
      <h3 className="text-xl font-semibold text-gray-800 mb-6">Terms and Conditions</h3>

      <div className="bg-blue-50 p-6 rounded-lg mb-6 max-h-60 overflow-y-auto text-sm border border-blue-100 shadow-sm">
        <p className="font-medium text-gray-800 mb-4">
          By checking the box below, you agree to our Terms of Service and Privacy Policy.
        </p>
        <p className="mb-3 text-gray-700">These terms include:</p>
        <ul className="list-disc ml-5 space-y-2 text-gray-700">
          <li>Flash will collect and store the information you provide.</li>
          <li>You certify that the information provided is accurate and complete.</li>
          <li>You authorize Flash to conduct necessary verification procedures.</li>
          <li>
            For merchant accounts, you agree to comply with all applicable laws and regulations
            related to payment processing.
          </li>
          <li>
            Flash may update these terms from time to time. You will be notified of any significant
            changes.
          </li>
        </ul>
        <div className="mt-4 pt-4 border-t border-blue-200">
          <p className="text-gray-700">
            For the complete terms, please visit our{' '}
            <a href="#" className="text-blue-600 hover:underline">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="#" className="text-blue-600 hover:underline">
              Privacy Policy
            </a>
            .
          </p>
        </div>
      </div>

      <div className="form-group">
        <label className="flex items-start cursor-pointer group">
          <div className="relative flex items-start">
            <div className="flex items-center h-5">
              <input
                type="checkbox"
                id="terms_accepted"
                {...register('terms_accepted')}
                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 transition-colors"
                aria-describedby="terms-description"
                aria-required="true"
                aria-invalid={errors.terms_accepted ? 'true' : 'false'}
              />
            </div>
            <div className="ml-3 text-sm">
              <label
                htmlFor="terms_accepted"
                className="font-medium text-gray-700 cursor-pointer group-hover:text-gray-900"
              >
                I agree to the Terms of Service and Privacy Policy
                <span className="text-red-500 ml-1">*</span>
              </label>
              <p id="terms-description" className="text-gray-500 mt-1">
                By checking this box, you are creating a legally binding agreement.
              </p>
            </div>
          </div>
        </label>
        {errors.terms_accepted && (
          <p className="form-error mt-2" role="alert">
            {errors.terms_accepted.message?.toString()}
          </p>
        )}
      </div>

      <div className="mt-8 flex justify-between">
        <button
          type="button"
          onClick={() => {
            if (accountType === 'personal') {
              setCurrentStep(2); // Back to account type
            } else if (accountType === 'business') {
              setCurrentStep(3); // Back to business info
            } else if (accountType === 'merchant') {
              setCurrentStep(4); // Back to merchant banking
            } else {
              setCurrentStep(2); // Fallback
            }
          }}
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

        <button
          type="button" // Change to button type to handle submission manually
          className="form-btn group relative flex items-center"
          aria-label="Submit signup form"
          onClick={() => {
            console.log('Submit button clicked');

            // Manually trigger form submission
            const formValues = watch();
            console.log('Current form values:', formValues);

            // Set terms to true to pass validation
            setValue('terms_accepted', true as unknown as true, { shouldValidate: false });

            // Get the form element and submit it
            const form = document.querySelector('form');
            if (form) {
              console.log('Form found, submitting...');
              form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
            } else {
              console.error('Form element not found');
            }
          }}
        >
          <span className="flex items-center">
            Submit Application
            <svg
              className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </span>
        </button>
      </div>
    </div>
  );
};
