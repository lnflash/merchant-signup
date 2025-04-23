'use client';

import { useState, useEffect } from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import {
  AsYouType,
  parsePhoneNumberFromString,
  getExampleNumber,
  CountryCode,
} from 'libphonenumber-js';
import examples from 'libphonenumber-js/examples.mobile.json';

// A list of common country codes for the dropdown
const COMMON_COUNTRY_CODES = [
  { code: '+1', label: '🇺🇸 +1 (US/Canada)' },
  { code: '+44', label: '🇬🇧 +44 (UK)' },
  { code: '+1242', label: '🇧🇸 +1242 (Bahamas)' },
  { code: '+1246', label: '🇧🇧 +1246 (Barbados)' },
  { code: '+1868', label: '🇹🇹 +1868 (Trinidad & Tobago)' },
  { code: '+1876', label: '🇯🇲 +1876 (Jamaica)' },
  { code: '+1284', label: '🇻🇬 +1284 (British Virgin Islands)' },
  { code: '+1345', label: '🇰🇾 +1345 (Cayman Islands)' },
];

interface PhoneInputProps {
  name: string;
  label: string;
  required?: boolean;
  placeholder?: string;
  helpText?: string;
}

export default function PhoneInput({
  name,
  label,
  required = false,
  placeholder = '',
  helpText = 'Enter your phone number with country code',
}: PhoneInputProps) {
  // Use React Hook Form context
  const {
    control,
    formState: { errors },
    setValue,
    getValues,
  } = useFormContext();

  // Store both parts of the phone number separately
  const [countryCode, setCountryCode] = useState('+1');
  const [nationalNumber, setNationalNumber] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  // Format and store the complete phone number whenever either part changes
  useEffect(() => {
    // Only update if we have a national number
    if (nationalNumber) {
      const formatter = new AsYouType();
      const formattedNumber = formatter.input(`${countryCode}${nationalNumber}`);
      setValue(name, formattedNumber, { shouldValidate: true });
    }
  }, [countryCode, nationalNumber, name, setValue]);

  // Get an example phone number for the selected country
  const getExample = () => {
    try {
      // Extract the country code without the +
      const countryCodeDigits = countryCode.replace('+', '');

      // For multi-part codes like +1876, we need to check examples by country
      // Try to find an example for the specific code
      let example;

      if (countryCodeDigits.length > 1) {
        // For longer country codes, try to match with the exact code
        COMMON_COUNTRY_CODES.forEach(country => {
          if (country.code === countryCode) {
            const countryName = country.label.split(' ')[0].trim();
            if (countryName && examples[countryName as any]) {
              example = examples[countryName as any];
            }
          }
        });
      }

      // If we couldn't find a specific example, use the first 1-2 digits
      if (!example) {
        // Cast to CountryCode type since we're using country codes
        example = getExampleNumber(countryCodeDigits.substring(0, 2) as CountryCode, examples);
      }

      return example ? example.formatInternational() : `${countryCode} 555-1234`;
    } catch (e) {
      return `${countryCode} 555-1234`;
    }
  };

  // Handle country code selection change
  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCountryCode(e.target.value);
  };

  // Extract the national number from a complete phone number
  const extractNationalNumber = (fullNumber: string) => {
    if (!fullNumber) return '';

    try {
      const phoneNumber = parsePhoneNumberFromString(fullNumber);
      if (phoneNumber) {
        return phoneNumber.nationalNumber;
      }
    } catch (e) {
      // Fallback to manual extraction
    }

    // Try to manually extract by removing the country code
    const sortedCodes = [...COMMON_COUNTRY_CODES].sort((a, b) => b.code.length - a.code.length);

    for (const country of sortedCodes) {
      if (fullNumber.startsWith(country.code)) {
        return fullNumber.substring(country.code.length).replace(/\D/g, '');
      }
    }

    // If we couldn't identify a country code, just return digits
    return fullNumber.replace(/\D/g, '');
  };

  // Validate the complete phone number
  const validatePhoneNumber = (value: string) => {
    if (!value) return false;

    try {
      const phoneNumber = parsePhoneNumberFromString(value);
      return phoneNumber ? phoneNumber.isValid() : false;
    } catch (e) {
      return false;
    }
  };

  // Initialize from existing value (for edit mode)
  useEffect(() => {
    const initializeFromField = () => {
      const currentValue = getValues(name);
      if (!currentValue) return;

      // Try to parse the phone number to extract country code
      try {
        const phoneNumber = parsePhoneNumberFromString(currentValue);
        if (phoneNumber && phoneNumber.countryCallingCode) {
          // Set country code
          const extractedCountryCode = `+${phoneNumber.countryCallingCode}`;
          setCountryCode(extractedCountryCode);

          // Set national number
          setNationalNumber(phoneNumber.nationalNumber || '');
          return;
        }
      } catch (e) {
        // Fall through to manual extraction
      }

      // Manual extraction if parsing fails
      const sortedCodes = [...COMMON_COUNTRY_CODES].sort((a, b) => b.code.length - a.code.length);

      for (const country of sortedCodes) {
        if (currentValue.startsWith(country.code)) {
          setCountryCode(country.code);
          setNationalNumber(extractNationalNumber(currentValue));
          return;
        }
      }

      // If no country code detected, keep default and set entire value as national
      setNationalNumber(currentValue.replace(/\D/g, ''));
    };

    // Run once on component mount
    initializeFromField();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Format the national number for display
  const formatNationalNumberForDisplay = (number: string) => {
    if (!number) return '';

    // Simple formatting: XXX-XXX-XXXX or XXX-XXXX depending on length
    if (number.length <= 4) {
      return number;
    } else if (number.length <= 7) {
      return `${number.substring(0, 3)}-${number.substring(3)}`;
    } else {
      // For number with 10 or more digits (standard US/CA)
      const lastFour = number.substring(number.length - 4);
      const middlePart = number.substring(Math.max(0, number.length - 7), number.length - 4);
      const firstPart = number.substring(0, Math.max(0, number.length - 7));

      if (middlePart && firstPart) {
        return `${firstPart}-${middlePart}-${lastFour}`;
      } else if (middlePart) {
        return `${middlePart}-${lastFour}`;
      } else {
        return lastFour;
      }
    }
  };

  return (
    <div className="form-group">
      <label htmlFor={name} className="form-label">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      <div className="flex">
        {/* Country code selector */}
        <div className="w-1/3 mr-2">
          <select
            className="form-select w-full h-full rounded-lg border-gray-300 shadow-sm"
            value={countryCode}
            onChange={handleCountryChange}
            aria-label="Country code"
          >
            {COMMON_COUNTRY_CODES.map(country => (
              <option key={country.code} value={country.code}>
                {country.label}
              </option>
            ))}
          </select>
        </div>

        {/* Phone number input - only for the national part */}
        <div className="relative w-2/3">
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
                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
              />
            </svg>
          </div>

          <input
            id={name}
            type="tel"
            className="form-input input-with-icon w-full"
            placeholder={placeholder || getExample().substring(countryCode.length + 1)} // +1 for space
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            value={formatNationalNumberForDisplay(nationalNumber)}
            onChange={e => {
              // Only update the national number part (digits only)
              const digits = e.target.value.replace(/\D/g, '');
              setNationalNumber(digits);
            }}
            aria-required={required}
            aria-invalid={errors[name] ? 'true' : 'false'}
          />
        </div>
      </div>

      {/* Hidden field for React Hook Form - handled by useEffect */}
      <Controller
        name={name}
        control={control}
        render={({ field }) => <input type="hidden" {...field} />}
      />

      {errors[name] && (
        <p className="form-error mt-1" role="alert" id={`${name}-error`}>
          {errors[name]?.message?.toString()}
        </p>
      )}

      {/* Preview of full number */}
      <div className="mt-1 text-xs text-gray-600">
        Full number:{' '}
        <span className="font-medium">
          {countryCode} {formatNationalNumberForDisplay(nationalNumber)}
        </span>
      </div>

      {/* Validation indicator */}
      {nationalNumber && (
        <div className="mt-1 text-xs flex items-center">
          {validatePhoneNumber(`${countryCode}${nationalNumber}`) ? (
            <span className="text-green-600 flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Valid phone number
            </span>
          ) : (
            <span className="text-amber-600 flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              {nationalNumber.length < 6
                ? 'Incomplete phone number'
                : 'Invalid phone number format'}
            </span>
          )}
        </div>
      )}

      {helpText && !isFocused && !nationalNumber && (
        <p className="mt-1 text-xs text-gray-500">{helpText}</p>
      )}

      {isFocused && <p className="mt-1 text-xs text-gray-500">Example: {getExample()}</p>}
    </div>
  );
}
