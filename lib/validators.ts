import { z } from 'zod';
import { parsePhoneNumberFromString, isValidPhoneNumber } from 'libphonenumber-js';

// Advanced phone validation using libphonenumber-js
const phoneNumberSchema = z.string().refine(value => {
  // Allow empty string during form entry - other validation will catch this
  if (!value) return false;

  try {
    // Try to validate the phone number
    return isValidPhoneNumber(value) || false;
  } catch (e) {
    return false;
  }
}, 'Please enter a valid phone number');

// Fallback regex pattern for environments where libphonenumber might not work
const phoneRegex = /^\+?[0-9]{10,15}$/;

// Common fields that all account types share
const commonFields = {
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.union([
    phoneNumberSchema,
    z.string().regex(phoneRegex, 'Please enter a valid phone number with country code'),
  ]),
  email: z.string().email('Please enter a valid email').optional().or(z.literal('')),
  terms_accepted: z.literal(true, {
    errorMap: () => ({ message: 'You must accept the terms and conditions' }),
  }),
};

// Create schema with different requirements for each account type
export const signupFormSchema = z.discriminatedUnion('account_type', [
  // Schema for personal accounts
  z.object({
    account_type: z.literal('personal'),
    ...commonFields,
    // Make all other fields optional
    business_name: z.string().optional().or(z.literal('')),
    business_address: z.string().optional().or(z.literal('')),
    bank_name: z.string().optional().or(z.literal('')),
    bank_branch: z.string().optional().or(z.literal('')),
    bank_account_type: z.string().optional().or(z.literal('')),
    account_currency: z.string().optional().or(z.literal('')),
    bank_account_number: z.string().optional().or(z.literal('')),
    id_image_url: z.union([
      z.string().optional(),
      z.literal(''),
      z.custom(val => typeof window !== 'undefined' && val instanceof File).optional(),
    ]),
    latitude: z.number().optional().or(z.literal('')),
    longitude: z.number().optional().or(z.literal('')),
  }),

  // Schema for business accounts
  z.object({
    account_type: z.literal('business'),
    ...commonFields,
    // Required business fields
    business_name: z.string().min(2, 'Business name must be at least 2 characters'),
    business_address: z.string().min(5, 'Please enter a valid address'),
    latitude: z.number().optional().or(z.literal('')),
    longitude: z.number().optional().or(z.literal('')),
    // Make merchant fields optional
    bank_name: z.string().optional().or(z.literal('')),
    bank_branch: z.string().optional().or(z.literal('')),
    bank_account_type: z.string().optional().or(z.literal('')),
    account_currency: z.string().optional().or(z.literal('')),
    bank_account_number: z.string().optional().or(z.literal('')),
    id_image_url: z.union([
      z.string().optional(),
      z.literal(''),
      z.custom(val => typeof window !== 'undefined' && val instanceof File).optional(),
    ]),
  }),

  // Schema for merchant accounts
  z.object({
    account_type: z.literal('merchant'),
    ...commonFields,
    // Business fields optional for merchants
    business_name: z
      .string()
      .min(2, 'Business name must be at least 2 characters')
      .optional()
      .or(z.literal('')),
    business_address: z
      .string()
      .min(5, 'Please enter a valid address')
      .optional()
      .or(z.literal('')),
    latitude: z.number().optional().or(z.literal('')),
    longitude: z.number().optional().or(z.literal('')),
    // Required merchant fields
    bank_name: z.string().min(2, 'Bank name is required'),
    bank_branch: z.string().min(2, 'Branch is required'),
    bank_account_type: z.string().min(2, 'Account type is required'),
    account_currency: z.string().min(2, 'Currency is required'),
    bank_account_number: z.string().min(4, 'Account number is required'),
    id_image_url: z.union([
      z.string().min(1, 'ID image is required'),
      z.custom(val => typeof window !== 'undefined' && val instanceof File, {
        message: 'Valid ID image is required',
      }),
    ]),
  }),
]);

// For backward compatibility - these are used elsewhere in the codebase
export const personInfoSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.union([
    phoneNumberSchema,
    z.string().regex(phoneRegex, 'Please enter a valid phone number with country code'),
  ]),
  email: z.string().email('Please enter a valid email').optional().or(z.literal('')),
});

export const businessInfoSchema = z.object({
  business_name: z.string().min(2, 'Business name must be at least 2 characters'),
  business_address: z.string().min(5, 'Please enter a valid address'),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

export const merchantInfoSchema = z.object({
  bank_name: z.string().min(2, 'Bank name is required'),
  bank_account_type: z.string().min(2, 'Account type is required'),
  account_currency: z.string().min(2, 'Currency is required'),
  bank_account_number: z.string().min(4, 'Account number is required'),
  bank_branch: z.string().min(2, 'Branch is required'),
  id_image_url: z.string().optional(),
});
