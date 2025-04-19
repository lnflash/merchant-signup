import { z } from 'zod';
import { signupFormSchema } from '../../lib/validators';

/**
 * Form data types
 */
export type SignupFormData = z.infer<typeof signupFormSchema>;

/**
 * API response types
 */
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string | string[];
}

/**
 * Account type enum
 */
export enum AccountType {
  Personal = 'personal',
  Business = 'business',
  Merchant = 'merchant',
}