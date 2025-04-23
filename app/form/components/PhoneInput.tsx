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
  {
    code: '+1',
    label: 'US/Canada',
    flag: '🇺🇸',
    example: '(201) 555-0123',
    format: '(XXX) XXX-XXXX',
  },
  // Caribbean codes grouped together
  {
    code: '+1242',
    label: 'Bahamas',
    flag: '🇧🇸',
    example: '359-1234',
    format: 'XXX-XXXX',
  },
  {
    code: '+1246',
    label: 'Barbados',
    flag: '🇧🇧',
    example: '234-5678',
    format: 'XXX-XXXX',
  },
  {
    code: '+1284',
    label: 'BVI',
    flag: '🇻🇬',
    example: '340-1234',
    format: 'XXX-XXXX',
  },
  {
    code: '+1345',
    label: 'Cayman',
    flag: '🇰🇾',
    example: '916-1234',
    format: 'XXX-XXXX',
  },
  {
    code: '+1876',
    label: 'Jamaica',
    flag: '🇯🇲',
    example: '634-4321',
    format: 'XXX-XXXX',
  },
  {
    code: '+1868',
    label: 'Trinidad',
    flag: '🇹🇹',
    example: '291-1234',
    format: 'XXX-XXXX',
  },
  // Other international
  {
    code: '+44',
    label: 'UK',
    flag: '🇬🇧',
    example: '7911 123456',
    format: 'XXXX XXXXXX',
  },
  {
    code: '+61',
    label: 'Australia',
    flag: '🇦🇺',
    example: '412 345 678',
    format: 'XXX XXX XXX',
  },
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
      // Store the raw value instead of using AsYouType
      const fullNumber = `${countryCode}${nationalNumber}`;
      setValue(name, fullNumber, { shouldValidate: true });
    } else {
      // Clear the field when national number is empty
      setValue(name, '', { shouldValidate: false });
    }
  }, [countryCode, nationalNumber, name, setValue]);

  // Get example phone number and format for the selected country
  const getCountryInfo = () => {
    // Find the selected country in our predefined list
    const selectedCountry = COMMON_COUNTRY_CODES.find(country => country.code === countryCode);

    if (selectedCountry) {
      return {
        example: selectedCountry.example,
        format: selectedCountry.format,
        flag: selectedCountry.flag,
        label: selectedCountry.label,
      };
    }

    // Fallback if not found
    try {
      // Extract the country code without the +
      const countryCodeDigits = countryCode.replace('+', '');

      // Use libphonenumber-js to get an example
      const example = getExampleNumber(countryCodeDigits.substring(0, 2) as CountryCode, examples);

      return {
        example: example ? example.formatNational() : '555-1234',
        format: 'XXX-XXXX',
        flag: '🌍',
        label: 'International',
      };
    } catch (e) {
      return {
        example: '555-1234',
        format: 'XXX-XXXX',
        flag: '🌍',
        label: 'International',
      };
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

  // Simple formatting for display - prevents duplication issues
  const formatNationalNumberForDisplay = (number: string) => {
    if (!number) return '';

    // Basic formatting without using AsYouType to avoid duplication issues
    try {
      if (number.length <= 4) {
        return number;
      } else if (number.length <= 7) {
        return `${number.substring(0, 3)}-${number.substring(3)}`;
      } else if (number.length === 10) {
        // Format like (XXX) XXX-XXXX for 10 digit numbers (US/Canada style)
        return `(${number.substring(0, 3)}) ${number.substring(3, 6)}-${number.substring(6)}`;
      } else {
        // For other numbers, use groups of 2-3 digits where possible
        const groups = [];
        let remaining = number;

        // Handle groups of 2-3
        while (remaining.length > 3) {
          groups.push(remaining.substring(0, 3));
          remaining = remaining.substring(3);
        }

        // Add the final group
        if (remaining) {
          groups.push(remaining);
        }

        return groups.join('-');
      }
    } catch (e) {
      // If any error occurs, just return the raw number
      return number;
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
          {/* Country code with flag */}
          <div className="flex-shrink-0 bg-gray-50 border-r border-gray-300 flex items-center relative">
            <select
              className="bg-transparent appearance-none pl-2 pr-8 py-3 text-sm font-medium focus:outline-none"
              value={countryCode}
              onChange={handleCountryChange}
              aria-label="Country code"
            >
              {COMMON_COUNTRY_CODES.map(country => (
                <option key={country.code} value={country.code}>
                  {country.flag} {country.code}
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

          {/* Phone number field with dynamic placeholder based on country */}
          <input
            id={name}
            type="tel"
            className="block w-full px-4 py-3 focus:outline-none border-0 shadow-none bg-white"
            placeholder={getCountryInfo().example}
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

      {/* Dynamic help text based on country */}
      {errors[name] ? (
        <p className="form-error mt-1" role="alert" id={`${name}-error`}>
          {errors[name]?.message?.toString()}
        </p>
      ) : isFocused && !nationalNumber ? (
        <p className="mt-1 text-xs text-gray-500">
          Format: {getCountryInfo().flag} {getCountryInfo().format}
        </p>
      ) : null}
    </div>
  );
}
