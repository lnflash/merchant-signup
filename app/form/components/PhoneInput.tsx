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
  const {
    control,
    formState: { errors },
    setValue,
    watch,
  } = useFormContext();
  const [selectedCountry, setSelectedCountry] = useState('+1');
  const [isFocused, setIsFocused] = useState(false);

  // Get the current value of the phone field
  const phoneValue = watch(name) || '';

  // Get an example phone number
  const getExample = () => {
    try {
      // Try to get an example number for the current country code
      const countryCode = selectedCountry.replace('+', '');
      // Cast to CountryCode type since we're using a limited set of countries
      const example = getExampleNumber(countryCode.substring(0, 2) as CountryCode, examples);
      return example ? example.formatInternational() : '+1 (555) 123-4567';
    } catch (e) {
      return '+1 (555) 123-4567';
    }
  };

  // Detect country code from the phone number
  useEffect(() => {
    if (phoneValue && phoneValue.startsWith('+')) {
      // Find the matching country code
      const matchedCountry = COMMON_COUNTRY_CODES.find(cc => phoneValue.startsWith(cc.code));

      if (matchedCountry) {
        setSelectedCountry(matchedCountry.code);
      }
    }
  }, [phoneValue]);

  // Format phone number as user types
  const formatPhoneNumber = (value: string) => {
    // Return empty string if no value
    if (!value) return '';

    // If the value doesn't start with +, add the selected country code
    let phoneNumberToFormat = value;
    if (!value.startsWith('+')) {
      if (value.startsWith(selectedCountry.substring(1))) {
        // If value starts with country code digits but not +, just add +
        phoneNumberToFormat = `+${value}`;
      } else {
        phoneNumberToFormat = `${selectedCountry}${value}`;
      }
    }

    // Format using AsYouType formatter
    const formatter = new AsYouType();
    return formatter.input(phoneNumberToFormat);
  };

  // Validate the phone number
  const validatePhoneNumber = (value: string) => {
    if (!value) return false;

    try {
      const phoneNumber = parsePhoneNumberFromString(value);
      return phoneNumber ? phoneNumber.isValid() : false;
    } catch (e) {
      return false;
    }
  };

  // Handle country code change
  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCountryCode = e.target.value;
    setSelectedCountry(newCountryCode);

    // Update the phone number with the new country code
    let newValue = phoneValue;

    // Remove old country code if present
    if (phoneValue.startsWith('+')) {
      // Try to find the current country code
      const currentCountry = COMMON_COUNTRY_CODES.find(cc => phoneValue.startsWith(cc.code));

      if (currentCountry) {
        // Remove the old country code
        newValue = phoneValue.substring(currentCountry.code.length);
      } else {
        // If we couldn't detect the country code, just use numbers
        newValue = phoneValue.replace(/[^0-9]/g, '');
      }
    }

    // Add the new country code
    newValue = `${newCountryCode}${newValue}`;
    setValue(name, formatPhoneNumber(newValue), { shouldValidate: true });
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
            value={selectedCountry}
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

        {/* Phone number input */}
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

          <Controller
            name={name}
            control={control}
            render={({ field }) => (
              <input
                id={name}
                type="tel"
                className="form-input input-with-icon w-full"
                placeholder={placeholder || getExample()}
                onFocus={() => setIsFocused(true)}
                onBlur={() => {
                  setIsFocused(false);
                  field.onBlur();
                }}
                value={field.value || ''}
                onChange={e => {
                  const formatted = formatPhoneNumber(e.target.value);
                  field.onChange(formatted);
                }}
                aria-required={required}
                aria-invalid={errors[name] ? 'true' : 'false'}
              />
            )}
          />
        </div>
      </div>

      {errors[name] && (
        <p className="form-error mt-1" role="alert" id={`${name}-error`}>
          {errors[name]?.message?.toString()}
        </p>
      )}

      {/* Validation indicator */}
      {phoneValue && !errors[name] && (
        <div className="mt-1 text-xs flex items-center">
          {validatePhoneNumber(phoneValue) ? (
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
              Incomplete phone number
            </span>
          )}
        </div>
      )}

      {helpText && !isFocused && <p className="mt-1 text-xs text-gray-500">{helpText}</p>}

      {isFocused && <p className="mt-1 text-xs text-gray-500">Example: {getExample()}</p>}
    </div>
  );
}
