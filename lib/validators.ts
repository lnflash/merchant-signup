import { z } from 'zod';

const phoneRegex = /^\+?[0-9]{10,15}$/;

export const personInfoSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().regex(phoneRegex, 'Please enter a valid phone number'),
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

// Helper to create conditional schemas that work with TypeScript
const createConditionalSchema = (accountTypes: ('personal' | 'business' | 'merchant')[]) => {
  return z
    .preprocess(val => val, z.any())
    .superRefine((val, ctx) => {
      // Skip validation if not validating this field specifically
      if (!ctx.path.length) return;

      // Validation for strings - only add issue if value is empty
      if (!val || (typeof val === 'string' && val.trim() === '')) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `This field is required for ${accountTypes.join('/')} accounts`,
        });
      }
    });
};

export const signupFormSchema = z.object({
  // Personal info is always required
  ...personInfoSchema.shape,

  // Account type is always required
  account_type: z.enum(['personal', 'business', 'merchant']),

  // Business fields - conditionally required (only for Professional accounts)
  business_name: z
    .string()
    .min(2, 'Professional name must be at least 2 characters')
    .optional()
    .and(createConditionalSchema(['business'])), // Required only for Professional accounts

  business_address: z
    .string()
    .min(5, 'Please enter a valid address')
    .optional()
    .and(createConditionalSchema(['business'])), // Required only for Professional accounts

  latitude: z.number().optional().or(z.literal('')), // Allow empty string that will be converted to undefined
  longitude: z.number().optional().or(z.literal('')),

  // Merchant fields - conditionally required
  bank_name: z
    .string()
    .min(2, 'Bank name must be at least 2 characters')
    .optional()
    .and(createConditionalSchema(['merchant'])),

  bank_account_type: z
    .string()
    .min(2, 'Account type must be at least 2 characters')
    .optional()
    .and(createConditionalSchema(['merchant'])),

  account_currency: z
    .string()
    .min(2, 'Currency must be at least 2 characters')
    .optional()
    .and(createConditionalSchema(['merchant'])),

  bank_account_number: z
    .string()
    .min(4, 'Account number must be at least 4 characters')
    .optional()
    .and(createConditionalSchema(['merchant'])),

  bank_branch: z
    .string()
    .min(2, 'Branch must be at least 2 characters')
    .optional()
    .and(createConditionalSchema(['merchant'])),

  id_image_url: z
    .union([
      z.string().min(1, 'ID image is required'),
      z.literal(''),
      // File is a browser-only object, so we need to handle it differently for server-side validation
      z.custom(val => typeof window !== 'undefined' && val instanceof File, {
        message: 'Invalid file type',
      }),
    ])
    .optional()
    .and(createConditionalSchema(['merchant'])),

  // Terms acceptance is always required
  terms_accepted: z.literal(true, {
    errorMap: () => ({ message: 'You must accept the terms and conditions' }),
  }),
});

// Import the type from the types directory instead
// The actual type is now exported from src/types/index.ts
