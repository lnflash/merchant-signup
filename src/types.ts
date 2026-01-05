/**
 * API response structure
 */
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  error?: string | string[] | Record<string, string[]>;
  data?: T;
}

/**
 * Form data structure
 */
export interface SignupFormData {
  // Common fields
  username: string;
  name: string;
  email: string;
  phone: string;
  account_type: 'business' | 'merchant';
  terms_accepted: boolean;

  // Business information
  business_name?: string;
  business_address?: string;
  business_type?: string;
  business_description?: string;
  latitude?: number;
  longitude?: number;
  wants_terminal?: boolean;

  // Merchant information
  merchant_type?: string;
  bank_name?: string;
  bank_branch?: string;
  bank_account_number?: string;
  bank_account_type?: string;
  account_currency?: string;
  id_image_url?: string;

  // Created timestamp - added by the server
  created_at?: string;
}
