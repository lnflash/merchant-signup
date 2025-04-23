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

// A list of common country codes for the dropdown, with Caribbean focus
const COMMON_COUNTRY_CODES = [
  // Most common codes first
  { code: '+1', label: '🇺🇸 +1 (US/Canada)' },
  // Caribbean codes grouped together
  { code: '+1242', label: '🇧🇸 +1242 (Bahamas)' },
  { code: '+1246', label: '🇧🇧 +1246 (Barbados)' },
  { code: '+1284', label: '🇻🇬 +1284 (BVI)' },
  { code: '+1345', label: '🇰🇾 +1345 (Cayman)' },
  { code: '+1876', label: '🇯🇲 +1876 (Jamaica)' },
  { code: '+1868', label: '🇹🇹 +1868 (Trinidad)' },
  // Other international
  { code: '+44', label: '🇬🇧 +44 (UK)' },
  { code: '+61', label: '🇦🇺 +61 (Australia)' },
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
  // These props are kept for API compatibility but not directly used
  placeholder: _placeholder = '',
  helpText: _helpText = 'Enter your phone number with country code',
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
          if (country.code === countryCode && country.label) {
            const parts = country.label.split(' ');
            if (parts && parts.length > 0) {
              const countryPart = parts[0];
              if (countryPart) {
                const countryName = countryPart.trim();

                // Type-safe way to check if the example exists
                const exampleCountry = countryName as keyof typeof examples;
                if (countryName && examples[exampleCountry]) {
                  example = examples[exampleCountry];
                }
              }
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

  // Enhanced formatting for better readability
  const formatNationalNumberForDisplay = (number: string) => {
    if (!number) return '';

    try {
      // Try to use AsYouType formatter for best formatting
      const formatter = new AsYouType();
      const formatted = formatter.input(`${countryCode}${number}`);

      // Remove the country code part if present
      if (formatted.startsWith(countryCode)) {
        return formatted.substring(countryCode.length).trim();
      }

      return formatted;
    } catch (e) {
      // Fallback to simple formatting if AsYouType fails
      if (number.length <= 4) {
        return number;
      } else if (number.length <= 7) {
        return `${number.substring(0, 3)}-${number.substring(3)}`;
      } else if (number.length === 10) {
        // Format like (XXX) XXX-XXXX for 10 digit numbers (US/Canada style)
        return `(${number.substring(0, 3)}) ${number.substring(3, 6)}-${number.substring(6)}`;
      } else {
        // For other numbers, use groups of 3-4 digits where possible
        const groups = [];
        let remaining = number;

        // Handle groups of 3 or 4
        while (remaining.length > 4) {
          groups.push(remaining.substring(0, 3));
          remaining = remaining.substring(3);
        }

        // Add the final group
        if (remaining) {
          groups.push(remaining);
        }

        return groups.join('-');
      }
    }
  };

  return (
    <div className="form-group">
      <label htmlFor={name} className="form-label">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      <div className="relative">
        {/* Single integrated input field appearance */}
        <div className="flex rounded-lg border border-gray-300 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 overflow-hidden transition-colors">
          {/* Country code */}
          <div className="flex-shrink-0 bg-gray-50 border-r border-gray-300 flex items-center relative">
            <select
              className="bg-transparent appearance-none px-3 py-3 pr-6 text-sm font-medium focus:outline-none"
              value={countryCode}
              onChange={handleCountryChange}
              aria-label="Country code"
            >
              {COMMON_COUNTRY_CODES.map(country => (
                <option key={country.code} value={country.code}>
                  {country.code}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-1">
              <svg
                className="h-4 w-4 text-gray-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </div>

          {/* Phone number field with auto-format */}
          <input
            id={name}
            type="tel"
            className="block w-full px-4 py-3 focus:outline-none border-0 shadow-none bg-white"
            placeholder="(555) 123-4567"
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            value={formatNationalNumberForDisplay(nationalNumber)}
            onChange={e => {
              const digits = e.target.value.replace(/\D/g, '');
              setNationalNumber(digits);
            }}
            aria-required={required}
            aria-invalid={errors[name] ? 'true' : 'false'}
          />

          {/* Simple checkmark for valid input - appears only when valid */}
          {nationalNumber && validatePhoneNumber(`${countryCode}${nationalNumber}`) && (
            <div className="flex-shrink-0 flex items-center pr-3">
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
            </div>
          )}
        </div>
      </div>

      {/* Hidden field for React Hook Form */}
      <Controller
        name={name}
        control={control}
        render={({ field }) => <input type="hidden" {...field} />}
      />

      {/* Minimalist feedback - only show errors or very simple help when focused */}
      {errors[name] ? (
        <p className="form-error mt-1" role="alert" id={`${name}-error`}>
          {errors[name]?.message?.toString()}
        </p>
      ) : isFocused && !nationalNumber ? (
        <p className="mt-1 text-xs text-gray-500">
          Example: {getExample().substring(countryCode.length + 1)}
        </p>
      ) : null}
    </div>
  );
}
