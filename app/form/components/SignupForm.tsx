'use client';

import { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  signupFormSchema,
  personInfoSchema,
  businessInfoSchema,
  merchantInfoSchema,
} from '../../../lib/validators';
import { SignupFormData } from '../../../src/types';
import { apiService } from '../../../src/services/api';
import { PersonalInfoStep, AccountTypeStep, TermsStep } from './Steps';
import { BusinessInfoStep } from './BusinessInfoStep';
import { MerchantInfoStep } from './MerchantInfoStep';
import Image from 'next/image';
import FlashIcon from '../../../public/images/logos/flash_icon_transp.png';
import { logger } from '../../../src/utils/logger';
import TestSubmit from './TestSubmit';

export default function SignupForm() {
  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const methods = useForm<SignupFormData>({
    resolver: zodResolver(signupFormSchema),
    defaultValues: {
      account_type: 'personal',
      terms_accepted: false as unknown as true, // Cast to satisfy the validator
    },
  });

  const { handleSubmit, watch, trigger } = methods;
  const accountType = watch('account_type');

  // We'll remove the central nextStep function as each component now handles its own validation

  const onSubmit = async (data: SignupFormData) => {
    console.log('Form onSubmit called with data:', data);
    try {
      setSubmitting(true);
      console.log('Setting submitting state to true');

      // Do a final manual validation based on account type
      const { getValues } = methods;
      const values = getValues();
      console.log('Form values from getValues:', values);
      let isValid = true;

      // Basic fields validation
      if (!values.name || values.name.length < 2) {
        methods.setError('name', { message: 'Name is required' });
        setCurrentStep(1);
        isValid = false;
        return;
      }

      if (!values.phone || !/^\+?[0-9]{10,15}$/.test(values.phone)) {
        methods.setError('phone', { message: 'Valid phone number is required' });
        setCurrentStep(1);
        isValid = false;
        return;
      }

      // Business fields validation for Professional accounts (required)
      if (values.account_type === 'business') {
        if (!values.business_name || values.business_name.length < 2) {
          methods.setError('business_name', { message: 'Professional practice name is required' });
          setCurrentStep(3);
          isValid = false;
          return;
        }

        if (!values.business_address || values.business_address.length < 5) {
          methods.setError('business_address', { message: 'Professional address is required' });
          setCurrentStep(3);
          isValid = false;
          return;
        }
      }

      // Merchant fields validation
      if (values.account_type === 'merchant') {
        // Business fields are optional for merchants

        // Bank info is required
        if (!values.bank_name) {
          methods.setError('bank_name', { message: 'Bank name is required' });
          setCurrentStep(4);
          isValid = false;
          return;
        }

        if (!values.bank_branch) {
          methods.setError('bank_branch', { message: 'Bank branch is required' });
          setCurrentStep(4);
          isValid = false;
          return;
        }

        if (!values.bank_account_type) {
          methods.setError('bank_account_type', { message: 'Account type is required' });
          setCurrentStep(4);
          isValid = false;
          return;
        }

        if (!values.account_currency) {
          methods.setError('account_currency', { message: 'Currency is required' });
          setCurrentStep(4);
          isValid = false;
          return;
        }

        if (!values.bank_account_number) {
          methods.setError('bank_account_number', { message: 'Account number is required' });
          setCurrentStep(4);
          isValid = false;
          return;
        }

        // Check ID upload - it should be a URL string starting with http
        const idUrlValue = values.id_image_url;
        const hasIdDocument = typeof idUrlValue === 'string' && idUrlValue.startsWith('http');

        if (!hasIdDocument) {
          methods.setError('id_image_url', {
            message: 'ID image is required for merchant accounts',
          });
          setCurrentStep(4);
          isValid = false;
          return;
        }
      }

      if (!values.terms_accepted) {
        methods.setError('terms_accepted', { message: 'You must accept the terms and conditions' });
        setCurrentStep(5);
        isValid = false;
        return;
      }

      if (!isValid) {
        return;
      }

      // Log form submission with safe data (removing potentially sensitive fields)
      const safeData = {
        accountType: data.account_type,
        businessName: data.business_name,
        hasAcceptedTerms: data.terms_accepted,
      };

      logger.info('Submitting merchant registration form', safeData);
      console.log('Form data being submitted:', data);

      // Call the API service to submit the form
      const response = await apiService.submitSignupForm(data);
      console.log('API response:', response);

      if (!response.success) {
        logger.error('Form submission failed', response.error);
        const errorMessage =
          typeof response.error === 'string' ? response.error : JSON.stringify(response.error);
        throw new Error(errorMessage);
      }

      logger.info('Form submission successful', {
        timestamp: response.data?.created_at,
        accountType: data.account_type,
      });

      setSubmitSuccess(true);
    } catch (error) {
      logger.error('Error submitting form', error);
      alert('There was an error submitting your information. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitSuccess) {
    return (
      <div className="text-center py-10 max-w-md mx-auto">
        <div className="bg-blue-50 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-8">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-12 w-12 text-blue-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h2 className="text-3xl font-bold mb-4 text-gray-800">Application Successful!</h2>
        <div className="bg-blue-50 p-6 rounded-xl mb-8">
          <p className="text-gray-700">
            Congratulations! Your Flash merchant account application has been received. Download the
            Flash app to set up your account and explore our point-of-sale system.
          </p>
        </div>

        <div className="space-y-6">
          <a
            href="https://getflash.io/app"
            className="inline-block w-full px-8 py-4 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors shadow-lg transform hover:-translate-y-1 hover:shadow-xl"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Download Flash App"
          >
            <div className="flex items-center justify-center">
              <div className="mr-4 relative w-8 h-8">
                <Image
                  src={FlashIcon}
                  alt="Flash Logo"
                  width={32}
                  height={32}
                  style={{ width: 'auto', height: 'auto' }}
                  className="object-contain"
                />
              </div>
              <div className="text-left">
                <p className="text-xl font-bold leading-tight">Get the Flash App</p>
                <p className="text-sm opacity-90">App Store • Google Play • Direct Download</p>
              </div>
            </div>
          </a>

          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-600 mb-2">On our download page, you'll find:</p>
            <ul className="text-xs text-gray-600 text-left list-disc pl-5 space-y-1">
              <li>App Store and Google Play links</li>
              <li>TestFlight beta version access</li>
              <li>Direct APK download from GitHub</li>
              <li>Virtual demo of our point-of-sale system</li>
              <li>Tap-to-pay card system demonstration</li>
            </ul>
          </div>

          <p className="text-sm text-gray-500">
            Need help? Contact our support at{' '}
            <a href="mailto:support@flash.com" className="text-blue-600 hover:underline">
              support@flash.com
            </a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="mb-10">
          <div className="flex items-center justify-between mb-6 relative">
            {/* Progress line that spans across all steps */}
            <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-200 -translate-y-1/2 z-0"></div>

            {/* Color the progress line up to the current step */}
            <div
              className="absolute h-1 bg-blue-600 top-1/2 -translate-y-1/2 left-0 z-0 transition-all duration-500 ease-in-out"
              style={{ width: `${Math.min(100, ((currentStep - 1) / 4) * 100)}%` }}
            ></div>

            {/* Step indicators */}
            {[1, 2, 3, 4, 5].map(step => {
              // Determine the status of each step
              const isActive = currentStep === step;
              const isCompleted = currentStep > step;
              const isPending = currentStep < step;

              return (
                <div key={step} className="flex flex-col items-center z-10 relative">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                      isActive
                        ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                        : isCompleted
                          ? 'bg-green-500 text-white'
                          : 'bg-white text-gray-400 border-2 border-gray-200'
                    }`}
                    aria-current={isActive ? 'step' : undefined}
                    aria-label={`Step ${step} ${isCompleted ? 'completed' : isActive ? 'current' : 'pending'}`}
                  >
                    {isCompleted ? (
                      <svg
                        className="w-5 h-5"
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
                    ) : (
                      <span className="text-sm font-medium">{step}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Step label */}
          <div className="text-sm font-medium text-center text-gray-700 mb-4">
            {currentStep === 1 && 'Personal Information'}
            {currentStep === 2 && 'Account Type'}
            {currentStep === 3 && 'Business Information'}
            {currentStep === 4 && 'Merchant Information'}
            {currentStep === 5 && 'Terms & Conditions'}
          </div>

          {/* Progress percentage */}
          <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-blue-600 h-full rounded-full transition-all duration-300 ease-in-out"
              style={{ width: `${((currentStep - 1) / 4) * 100}%` }}
              role="progressbar"
              aria-valuenow={((currentStep - 1) / 4) * 100}
              aria-valuemin={0}
              aria-valuemax={100}
            ></div>
          </div>
        </div>

        <PersonalInfoStep currentStep={currentStep} setCurrentStep={setCurrentStep} />

        <AccountTypeStep currentStep={currentStep} setCurrentStep={setCurrentStep} />

        <BusinessInfoStep currentStep={currentStep} setCurrentStep={setCurrentStep} />

        {currentStep === 4 && (
          <MerchantInfoStep currentStep={currentStep} setCurrentStep={setCurrentStep} />
        )}

        <TermsStep currentStep={currentStep} setCurrentStep={setCurrentStep} />

        {/* Each step component handles its own next/back buttons now */}

        {/* Add Test Submit button for debugging */}
        <TestSubmit />
      </form>
    </FormProvider>
  );
}
