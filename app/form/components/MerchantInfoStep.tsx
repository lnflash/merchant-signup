'use client';

import { useFormContext } from 'react-hook-form';
import { SignupFormData } from '../../../src/types';
import FileUpload from './FileUpload';

type StepProps = {
  currentStep: number;
  setCurrentStep: (step: number) => void;
};

export const MerchantInfoStep: React.FC<StepProps> = ({ currentStep, setCurrentStep }) => {
  const { register, formState: { errors }, watch, setValue, trigger, setError, getValues } = useFormContext<SignupFormData>();
  
  if (currentStep !== 4) return null;

  const validateAndContinue = async () => {
    const bankName = watch('bank_name');
    const bankBranch = watch('bank_branch');
    const bankAccountType = watch('bank_account_type');
    const accountCurrency = watch('account_currency');
    const bankAccountNumber = watch('bank_account_number');
    const idImageUrl = watch('id_image_url');

    let isValid = true;
    
    // Validate each field manually
    if (!bankName || bankName.length < 2) {
      setValue('bank_name', bankName || '', { shouldValidate: true });
      isValid = false;
    }
    
    if (!bankBranch || bankBranch.length < 2) {
      setValue('bank_branch', bankBranch || '', { shouldValidate: true });
      isValid = false;
    }
    
    if (!bankAccountType || bankAccountType.length < 2) {
      setValue('bank_account_type', bankAccountType || '', { shouldValidate: true });
      isValid = false;
    }
    
    if (!accountCurrency || accountCurrency.length < 2) {
      setValue('account_currency', accountCurrency || '', { shouldValidate: true });
      isValid = false;
    }
    
    if (!bankAccountNumber || bankAccountNumber.length < 4) {
      setValue('bank_account_number', bankAccountNumber || '', { shouldValidate: true });
      isValid = false;
    }
    
    // Check if ID is uploaded - first ensure we're dealing with the right type
    // Handle file input validation differently - check for a string URL that was set during upload
    const idUrlValue = getValues('id_image_url');
    const hasIdDocument = typeof idUrlValue === 'string' && idUrlValue.startsWith('http');
    
    if (!hasIdDocument) {
      // Set explicit error for ID image
      setError('id_image_url', { 
        type: 'manual', 
        message: 'You must upload an ID document before proceeding'
      });
      isValid = false;
      
      // Focus or scroll to the file upload section
      document.getElementById('file-upload-section')?.scrollIntoView({ behavior: 'smooth' });
    }
    
    // Show validation errors for other fields
    await trigger([
      'bank_name', 
      'bank_branch', 
      'bank_account_type', 
      'account_currency',
      'bank_account_number'
    ]);
    
    // Only proceed if all validations pass
    if (isValid) {
      setCurrentStep(5);
    }
  };

  return (
    <div className="bg-white rounded-lg">
      <h3 className="text-xl font-semibold text-gray-800 mb-6">Banking Information</h3>
      <p className="text-sm text-gray-600 mb-6">
        Please provide your banking details to receive payments as a Flash merchant.
      </p>
      
      <div className="form-group">
        <label htmlFor="bank_name" className="form-label">
          Bank Name<span className="text-red-500 ml-1">*</span>
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
            </svg>
          </div>
          <input 
            id="bank_name" 
            {...register('bank_name')} 
            className="form-input input-with-icon" 
            placeholder="Enter your bank name"
            aria-required="true"
            aria-invalid={errors.bank_name ? "true" : "false"}
          />
        </div>
        {errors.bank_name && <p className="form-error" role="alert">{errors.bank_name.message}</p>}
      </div>

      <div className="form-group">
        <label htmlFor="bank_branch" className="form-label">
          Bank Branch<span className="text-red-500 ml-1">*</span>
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <input 
            id="bank_branch" 
            {...register('bank_branch')} 
            className="form-input input-with-icon" 
            placeholder="Enter your bank branch"
            aria-required="true"
            aria-invalid={errors.bank_branch ? "true" : "false"}
          />
        </div>
        {errors.bank_branch && <p className="form-error" role="alert">{errors.bank_branch.message}</p>}
      </div>

      <div className="form-group">
        <label htmlFor="bank_account_type" className="form-label">
          Account Type<span className="text-red-500 ml-1">*</span>
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
          <select 
            id="bank_account_type" 
            {...register('bank_account_type')} 
            className="form-input input-with-icon appearance-none"
            aria-required="true"
            aria-invalid={errors.bank_account_type ? "true" : "false"}
          >
            <option value="">Select account type</option>
            <option value="checking">Checking</option>
            <option value="savings">Savings</option>
          </select>
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
        {errors.bank_account_type && <p className="form-error" role="alert">{errors.bank_account_type.message}</p>}
      </div>

      <div className="form-group">
        <label htmlFor="account_currency" className="form-label">
          Currency<span className="text-red-500 ml-1">*</span>
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <select 
            id="account_currency" 
            {...register('account_currency')} 
            className="form-input input-with-icon appearance-none"
            aria-required="true"
            aria-invalid={errors.account_currency ? "true" : "false"}
          >
            <option value="">Select currency</option>
            <option value="USD">USD - US Dollar</option>
            <option value="EUR">EUR - Euro</option>
            <option value="JMD">JMD - Jamaican Dollar</option>
            <option value="KYD">KYD - Cayman Islands Dollar</option>
            <option value="ANG">ANG - Netherlands Antillean Guilder</option>
            <option value="XCG">XCG - Caribbean Guilder</option>
          </select>
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
        {errors.account_currency && <p className="form-error" role="alert">{errors.account_currency.message}</p>}
      </div>

      <div className="form-group">
        <label htmlFor="bank_account_number" className="form-label">
          Account Number<span className="text-red-500 ml-1">*</span>
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <input 
            id="bank_account_number" 
            {...register('bank_account_number')} 
            className="form-input input-with-icon" 
            placeholder="Enter your account number"
            aria-required="true"
            aria-invalid={errors.bank_account_number ? "true" : "false"}
            type="text" // Don't use type="number" as it can strip leading zeros
          />
        </div>
        {errors.bank_account_number && <p className="form-error" role="alert">{errors.bank_account_number.message}</p>}
        <p className="mt-1 text-xs text-gray-500">Enter your complete account number without spaces or special characters</p>
      </div>

      {/* ID Upload Component */}
      <FileUpload />
      
      <div className="mt-8 flex justify-between">
        <button 
          type="button" 
          onClick={() => setCurrentStep(3)}
          className="form-btn-secondary flex items-center"
          aria-label="Go back to previous step"
        >
          <svg className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span>Back</span>
        </button>
        
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