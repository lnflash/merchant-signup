import { supabase } from '../../lib/supabase';
import { logger } from '../utils/logger';
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- Required for token flow
import { apiService } from './api';
import { config } from '../config';
import { csrfService } from './csrf';
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- Type definitions
import { User, Session } from '@supabase/supabase-js';

/**
 * Types for authentication
 */
export interface AuthResponse {
  success: boolean;
  message?: string;
  error?: string;
  user?: {
    id: string;
    email: string;
  };
  token?: string;
}

/**
 * Authentication service
 */
export const authService = {
  /**
   * Current authentication state
   */
  currentUser: null as any,

  /**
   * Get the current authenticated user
   */
  async getCurrentUser() {
    try {
      // First check if we have a phone-authenticated user
      try {
        const storedAuthJson = localStorage.getItem('authenticatedUser');
        if (storedAuthJson) {
          const storedAuth = JSON.parse(storedAuthJson);

          // Check if the session is still valid
          if (storedAuth.expires > Date.now() && storedAuth.authenticated) {
            // Valid phone auth session exists
            this.currentUser = {
              id: storedAuth.userId,
              phone: storedAuth.phoneNumber,
              email: null,
              // Add minimal required properties for compatibility
              role: 'authenticated',
              aud: 'authenticated',
            };
            return this.currentUser;
          }
        }
      } catch (err) {
        // Fall through to Supabase auth
      }

      // Try to get the session from Supabase
      try {
        const { data } = await supabase.auth.getSession();

        if (data?.session?.user) {
          this.currentUser = data.session.user;
          return data.session.user;
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        logger.warn('Error getting Supabase session', error);
      }

      return null;
    } catch (error) {
      logger.error('Error getting current user', error);
      return null;
    }
  },

  /**
   * Sign in with email and password
   */
  async signIn(email: string, password: string): Promise<AuthResponse> {
    try {
      logger.info('Attempting sign in', { email: email.substring(0, 3) + '...' });

      // Try using Supabase directly first
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        logger.error('Supabase sign in error', error);

        // Try API fallback
        try {
          // Get CSRF token
          const csrfToken = await csrfService.getToken();

          const response = await fetch(`${config.api.baseUrl || ''}/api/auth`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include', // Important to include cookies
            body: JSON.stringify({
              email,
              password,
              csrf_token: csrfToken,
            }),
          });

          const apiResult = await response.json();

          if (!apiResult.success) {
            return {
              success: false,
              error: apiResult.error || 'Authentication failed',
            };
          }

          // Store the API auth result
          this.currentUser = apiResult.data?.user;

          return {
            success: true,
            message: 'Sign in successful',
            user: apiResult.data?.user,
            token: apiResult.data?.token,
          };
        } catch (apiError) {
          logger.error('API sign in error', apiError);
          return {
            success: false,
            error: 'Authentication failed. Please try again later.',
          };
        }
      }

      // Success with Supabase
      if (data.user) {
        this.currentUser = data.user;

        return {
          success: true,
          message: 'Sign in successful',
          user: {
            id: data.user.id,
            email: data.user.email || '',
          },
          token: data.session?.access_token,
        };
      }

      // User is null (shouldn't happen on successful sign in)
      return {
        success: false,
        error: 'Authentication failed: User not found',
      };
    } catch (error) {
      logger.error('Sign in error', error);
      return {
        success: false,
        error: 'Authentication failed. Please try again later.',
      };
    }
  },

  /**
   * Sign up with email and password
   */
  async signUp(email: string, password: string): Promise<AuthResponse> {
    try {
      logger.info('Attempting registration', { email: email.substring(0, 3) + '...' });

      // Try using Supabase directly first
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        logger.error('Supabase sign up error', error);

        // Try API fallback
        try {
          // Get CSRF token
          const csrfToken = await csrfService.getToken();

          const response = await fetch(`${config.api.baseUrl || ''}/api/auth`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include', // Important to include cookies
            body: JSON.stringify({
              email,
              password,
              csrf_token: csrfToken,
            }),
          });

          const apiResult = await response.json();

          if (!apiResult.success) {
            return {
              success: false,
              error: apiResult.error || 'Registration failed',
            };
          }

          // Store the API auth result
          if (apiResult.data?.user) {
            this.currentUser = apiResult.data.user;
          }

          return {
            success: true,
            message: apiResult.data?.emailConfirmationRequired
              ? 'Registration successful. Please check your email to confirm your account.'
              : 'Registration successful',
            user: apiResult.data?.user,
            token: apiResult.data?.token,
          };
        } catch (apiError) {
          logger.error('API sign up error', apiError);
          return {
            success: false,
            error: 'Registration failed. Please try again later.',
          };
        }
      }

      // Success with Supabase
      if (data.user) {
        this.currentUser = data.user;

        // Check if email confirmation is required
        const requiresEmailConfirmation = !data.session;

        return {
          success: true,
          message: requiresEmailConfirmation
            ? 'Registration successful. Please check your email to confirm your account.'
            : 'Registration successful',
          user: {
            id: data.user.id,
            email: data.user.email || '',
          },
          token: data.session?.access_token,
        };
      }

      // User is null (shouldn't normally happen)
      return {
        success: false,
        error: 'Registration failed: User not created',
      };
    } catch (error) {
      logger.error('Sign up error', error);
      return {
        success: false,
        error: 'Registration failed. Please try again later.',
      };
    }
  },

  /**
   * Sign out the current user
   */
  async signOut(): Promise<boolean> {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        logger.error('Sign out error', error);
        return false;
      }

      this.currentUser = null;
      return true;
    } catch (error) {
      logger.error('Sign out error', error);
      return false;
    }
  },

  /**
   * Get auth token for API requests - supports both email and phone auth
   */
  async getAuthToken(): Promise<string | null> {
    // First try to get email auth token from Supabase
    try {
      const { data } = await supabase.auth.getSession();
      if (data.session?.access_token) {
        return data.session.access_token;
      }
    } catch (error) {
      logger.error('Error getting Supabase auth token', error);
    }

    // Then try phone auth token from localStorage
    try {
      const storedAuthJson = localStorage.getItem('authenticatedUser');
      if (storedAuthJson) {
        const storedAuth = JSON.parse(storedAuthJson);

        // Check if the session is still valid
        if (storedAuth.expires > Date.now() && storedAuth.authenticated) {
          // Format token for auth middleware compatibility
          return `PhoneAuth ${storedAuth.userId}:${storedAuth.phoneNumber}:${storedAuth.authToken || 'phone_auth_token'}`;
        } else {
          // Expired session, clean up
          localStorage.removeItem('authenticatedUser');
        }
      }
    } catch (err) {
      logger.error('Error checking phone authentication token', err);
    }

    return null;
  },

  /**
   * Check if user is authenticated - supports both email and phone auth
   */
  async isAuthenticated(): Promise<boolean> {
    // First try to get the current user from Supabase (email auth)
    const user = await this.getCurrentUser();
    if (user) return true;

    // Check for phone authentication in localStorage
    try {
      const storedAuthJson = localStorage.getItem('authenticatedUser');
      if (storedAuthJson) {
        const storedAuth = JSON.parse(storedAuthJson);

        // Check if the session is still valid
        if (storedAuth.expires > Date.now() && storedAuth.authenticated) {
          // Valid phone auth session exists
          this.currentUser = {
            id: storedAuth.userId,
            phone: storedAuth.phoneNumber,
            email: null,
            // Add minimal required properties for compatibility
            role: 'authenticated',
            aud: 'authenticated',
          };
          return true;
        } else {
          // Expired session, clean up
          localStorage.removeItem('authenticatedUser');
        }
      }
    } catch (err) {
      logger.error('Error checking phone authentication', err);
      // Clear invalid session data
      localStorage.removeItem('authenticatedUser');
    }

    return false;
  },
};
