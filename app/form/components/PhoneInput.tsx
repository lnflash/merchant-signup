'use client';

import { useState, useEffect } from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { parsePhoneNumberFromString, getExampleNumber, CountryCode } from 'libphonenumber-js';
import examples from 'libphonenumber-js/examples.mobile.json';

// Country codes for the phone number dropdown - with categories
const COUNTRY_CODES = {
  // Most common codes at the top
  common: [
    {
      code: '+1',
      label: 'US/Canada',
      flag: '🇺🇸',
      example: '(201) 555-0123',
      format: '(XXX) XXX-XXXX',
    },
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
    {
      code: '+39',
      label: 'Italy',
      flag: '🇮🇹',
      example: '312 345 6789',
      format: 'XXX XXX XXXX',
    },
    {
      code: '+998',
      label: 'Uzbekistan',
      flag: '🇺🇿',
      example: '90 123 45 67',
      format: 'XX XXX XX XX',
    },
  ],

  // Caribbean codes
  caribbean: [
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
  ],

  // Central & South American countries
  latinAmerica: [
    {
      code: '+52',
      label: 'Mexico',
      flag: '🇲🇽',
      example: '222 123 4567',
      format: 'XXX XXX XXXX',
    },
    {
      code: '+501',
      label: 'Belize',
      flag: '🇧🇿',
      example: '610 1234',
      format: 'XXX XXXX',
    },
    {
      code: '+502',
      label: 'Guatemala',
      flag: '🇬🇹',
      example: '5123 4567',
      format: 'XXXX XXXX',
    },
    {
      code: '+503',
      label: 'El Salvador',
      flag: '🇸🇻',
      example: '7123 4567',
      format: 'XXXX XXXX',
    },
    {
      code: '+504',
      label: 'Honduras',
      flag: '🇭🇳',
      example: '9123 4567',
      format: 'XXXX XXXX',
    },
    {
      code: '+505',
      label: 'Nicaragua',
      flag: '🇳🇮',
      example: '8123 4567',
      format: 'XXXX XXXX',
    },
    {
      code: '+506',
      label: 'Costa Rica',
      flag: '🇨🇷',
      example: '8123 4567',
      format: 'XXXX XXXX',
    },
    {
      code: '+507',
      label: 'Panama',
      flag: '🇵🇦',
      example: '6123 4567',
      format: 'XXXX XXXX',
    },
    {
      code: '+54',
      label: 'Argentina',
      flag: '🇦🇷',
      example: '11 1234 5678',
      format: 'XX XXXX XXXX',
    },
    {
      code: '+55',
      label: 'Brazil',
      flag: '🇧🇷',
      example: '11 91234 5678',
      format: 'XX XXXXX XXXX',
    },
    {
      code: '+56',
      label: 'Chile',
      flag: '🇨🇱',
      example: '9 1234 5678',
      format: 'X XXXX XXXX',
    },
    {
      code: '+57',
      label: 'Colombia',
      flag: '🇨🇴',
      example: '321 123 4567',
      format: 'XXX XXX XXXX',
    },
    {
      code: '+58',
      label: 'Venezuela',
      flag: '🇻🇪',
      example: '412 123 4567',
      format: 'XXX XXX XXXX',
    },
    {
      code: '+591',
      label: 'Bolivia',
      flag: '🇧🇴',
      example: '7123 4567',
      format: 'XXXX XXXX',
    },
    {
      code: '+593',
      label: 'Ecuador',
      flag: '🇪🇨',
      example: '99 123 4567',
      format: 'XX XXX XXXX',
    },
    {
      code: '+595',
      label: 'Paraguay',
      flag: '🇵🇾',
      example: '961 456 789',
      format: 'XXX XXX XXX',
    },
    {
      code: '+51',
      label: 'Peru',
      flag: '🇵🇪',
      example: '912 345 678',
      format: 'XXX XXX XXX',
    },
    {
      code: '+598',
      label: 'Uruguay',
      flag: '🇺🇾',
      example: '94 231 234',
      format: 'XX XXX XXX',
    },
  ],

  // African countries
  africa: [
    {
      code: '+20',
      label: 'Egypt',
      flag: '🇪🇬',
      example: '10 1234 5678',
      format: 'XX XXXX XXXX',
    },
    {
      code: '+212',
      label: 'Morocco',
      flag: '🇲🇦',
      example: '61 234 5678',
      format: 'XX XXX XXXX',
    },
    {
      code: '+213',
      label: 'Algeria',
      flag: '🇩🇿',
      example: '551 23 45 67',
      format: 'XXX XX XX XX',
    },
    {
      code: '+216',
      label: 'Tunisia',
      flag: '🇹🇳',
      example: '20 123 456',
      format: 'XX XXX XXX',
    },
    {
      code: '+218',
      label: 'Libya',
      flag: '🇱🇾',
      example: '91 234 5678',
      format: 'XX XXX XXXX',
    },
    {
      code: '+220',
      label: 'Gambia',
      flag: '🇬🇲',
      example: '301 2345',
      format: 'XXX XXXX',
    },
    {
      code: '+221',
      label: 'Senegal',
      flag: '🇸🇳',
      example: '70 123 45 67',
      format: 'XX XXX XX XX',
    },
    {
      code: '+223',
      label: 'Mali',
      flag: '🇲🇱',
      example: '65 01 23 45',
      format: 'XX XX XX XX',
    },
    {
      code: '+225',
      label: "Côte d'Ivoire",
      flag: '🇨🇮',
      example: '01 23 45 67',
      format: 'XX XX XX XX',
    },
    {
      code: '+227',
      label: 'Niger',
      flag: '🇳🇪',
      example: '90 12 34 56',
      format: 'XX XX XX XX',
    },
    {
      code: '+229',
      label: 'Benin',
      flag: '🇧🇯',
      example: '90 12 34 56',
      format: 'XX XX XX XX',
    },
    {
      code: '+231',
      label: 'Liberia',
      flag: '🇱🇷',
      example: '4 123 4567',
      format: 'X XXX XXXX',
    },
    {
      code: '+233',
      label: 'Ghana',
      flag: '🇬🇭',
      example: '23 123 4567',
      format: 'XX XXX XXXX',
    },
    {
      code: '+234',
      label: 'Nigeria',
      flag: '🇳🇬',
      example: '701 234 5678',
      format: 'XXX XXX XXXX',
    },
    {
      code: '+237',
      label: 'Cameroon',
      flag: '🇨🇲',
      example: '6 71 23 45 67',
      format: 'X XX XX XX XX',
    },
    {
      code: '+241',
      label: 'Gabon',
      flag: '🇬🇦',
      example: '06 03 12 34',
      format: 'XX XX XX XX',
    },
    {
      code: '+243',
      label: 'DR Congo',
      flag: '🇨🇩',
      example: '991 234 567',
      format: 'XXX XXX XXX',
    },
    {
      code: '+244',
      label: 'Angola',
      flag: '🇦🇴',
      example: '923 123 456',
      format: 'XXX XXX XXX',
    },
    {
      code: '+250',
      label: 'Rwanda',
      flag: '🇷🇼',
      example: '720 123 456',
      format: 'XXX XXX XXX',
    },
    {
      code: '+251',
      label: 'Ethiopia',
      flag: '🇪🇹',
      example: '91 123 4567',
      format: 'XX XXX XXXX',
    },
    {
      code: '+254',
      label: 'Kenya',
      flag: '🇰🇪',
      example: '712 345 678',
      format: 'XXX XXX XXX',
    },
    {
      code: '+255',
      label: 'Tanzania',
      flag: '🇹🇿',
      example: '621 234 567',
      format: 'XXX XXX XXX',
    },
    {
      code: '+256',
      label: 'Uganda',
      flag: '🇺🇬',
      example: '712 345 678',
      format: 'XXX XXX XXX',
    },
    {
      code: '+260',
      label: 'Zambia',
      flag: '🇿🇲',
      example: '95 5123456',
      format: 'XX XXXXXXX',
    },
    {
      code: '+263',
      label: 'Zimbabwe',
      flag: '🇿🇼',
      example: '71 234 5678',
      format: 'XX XXX XXXX',
    },
    {
      code: '+264',
      label: 'Namibia',
      flag: '🇳🇦',
      example: '81 123 4567',
      format: 'XX XXX XXXX',
    },
    {
      code: '+265',
      label: 'Malawi',
      flag: '🇲🇼',
      example: '991 234 567',
      format: 'XXX XXX XXX',
    },
    {
      code: '+266',
      label: 'Lesotho',
      flag: '🇱🇸',
      example: '5012 3456',
      format: 'XXXX XXXX',
    },
    {
      code: '+267',
      label: 'Botswana',
      flag: '🇧🇼',
      example: '71 123 456',
      format: 'XX XXX XXX',
    },
    {
      code: '+268',
      label: 'Eswatini',
      flag: '🇸🇿',
      example: '7612 3456',
      format: 'XXXX XXXX',
    },
    {
      code: '+27',
      label: 'South Africa',
      flag: '🇿🇦',
      example: '71 123 4567',
      format: 'XX XXX XXXX',
    },
  ],
};

// Create a flattened list for lookup functions
const ALL_COUNTRY_CODES = [
  ...COUNTRY_CODES.common,
  ...COUNTRY_CODES.caribbean,
  ...COUNTRY_CODES.latinAmerica,
  ...COUNTRY_CODES.africa,
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
    const selectedCountry = ALL_COUNTRY_CODES.find(country => country.code === countryCode);

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
    const sortedCodes = [...ALL_COUNTRY_CODES].sort((a, b) => b.code.length - a.code.length);

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
      const sortedCodes = [...ALL_COUNTRY_CODES].sort((a, b) => b.code.length - a.code.length);

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
          {/* Country code dropdown - more compact for mobile */}
          <div className="flex-shrink-0 bg-gray-50 border-r border-gray-300 flex items-center relative">
            <select
              className="bg-transparent appearance-none pl-2 pr-6 py-3 text-sm font-medium focus:outline-none max-w-[100px] sm:max-w-none"
              value={countryCode}
              onChange={handleCountryChange}
              aria-label="Country code"
            >
              {/* Most Common */}
              <optgroup label="Most Common">
                {COUNTRY_CODES.common.map(country => (
                  <option key={country.code} value={country.code}>
                    {country.flag} {country.code}
                  </option>
                ))}
              </optgroup>

              {/* Caribbean */}
              <optgroup label="Caribbean">
                {COUNTRY_CODES.caribbean.map(country => (
                  <option key={country.code} value={country.code}>
                    {country.flag} {country.code}
                  </option>
                ))}
              </optgroup>

              {/* Central & South America */}
              <optgroup label="Central & South America">
                {COUNTRY_CODES.latinAmerica.map(country => (
                  <option key={country.code} value={country.code}>
                    {country.flag} {country.code}
                  </option>
                ))}
              </optgroup>

              {/* Africa */}
              <optgroup label="Africa">
                {COUNTRY_CODES.africa.map(country => (
                  <option key={country.code} value={country.code}>
                    {country.flag} {country.code}
                  </option>
                ))}
              </optgroup>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-0.5">
              <svg
                className="h-3 w-3 text-gray-500"
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

      {/* Minimalist feedback - only show errors or very simple help when focused */}
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
