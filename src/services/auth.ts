import { supabase } from '../../lib/supabase';
import { logger } from '../utils/logger';
import { apiService } from './api';
import { config } from '../config';
import { csrfService } from './csrf';

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
      // Try to get the session from Supabase
      const { data } = await supabase.auth.getSession();

      if (data.session?.user) {
        this.currentUser = data.session.user;
        return data.session.user;
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
          this.currentUser = apiResult.data.user;

          return {
            success: true,
            message: 'Sign in successful',
            user: apiResult.data.user,
            token: apiResult.data.token,
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
          this.currentUser = apiResult.data.user;

          return {
            success: true,
            message: apiResult.data.emailConfirmationRequired
              ? 'Registration successful. Please check your email to confirm your account.'
              : 'Registration successful',
            user: apiResult.data.user,
            token: apiResult.data.token,
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
   * Get auth token for API requests
   */
  async getAuthToken(): Promise<string | null> {
    try {
      const { data } = await supabase.auth.getSession();
      return data.session?.access_token || null;
    } catch (error) {
      logger.error('Error getting auth token', error);
      return null;
    }
  },

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const user = await this.getCurrentUser();
    return !!user;
  },
};
