/**
 * Flash API Service
 * Handles communication with the Flash GraphQL API for username validation
 * Uses a server-side API route to avoid CORS issues
 */

export interface UsernameValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates that a Flash username exists in the system
 * Uses our API route which proxies to the Flash GraphQL API
 */
export async function validateFlashUsername(username: string): Promise<UsernameValidationResult> {
  // Don't validate empty usernames
  if (!username || username.trim() === '') {
    return { valid: false, error: 'Username is required' };
  }

  const cleanUsername = username.trim().toLowerCase();

  try {
    const response = await fetch('/api/validate-username', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username: cleanUsername }),
    });

    const result = await response.json();

    if (result.valid) {
      return { valid: true };
    }

    return { valid: false, error: result.error || 'This Flash username does not exist' };
  } catch (error) {
    console.error('Error validating Flash username:', error);
    return { valid: false, error: 'Unable to verify username. Please check your connection.' };
  }
}
