/**
 * Flash API Service
 * Handles communication with the Flash GraphQL API for username validation
 */

const FLASH_API_URL = 'https://api.flashapp.me/graphql';

const ACCOUNT_DEFAULT_WALLET_QUERY = `
  query accountDefaultWallets($username: Username!) {
    accountDefaultWallet(username: $username) {
      id
    }
  }
`;

export interface UsernameValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates that a Flash username exists in the system
 * Uses the accountDefaultWallet query which returns wallet info if the user exists
 */
export async function validateFlashUsername(username: string): Promise<UsernameValidationResult> {
  // Don't validate empty usernames
  if (!username || username.trim() === '') {
    return { valid: false, error: 'Username is required' };
  }

  const cleanUsername = username.trim().toLowerCase();

  try {
    const response = await fetch(FLASH_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: ACCOUNT_DEFAULT_WALLET_QUERY,
        variables: { username: cleanUsername },
      }),
    });

    if (!response.ok) {
      console.error('Flash API request failed:', response.status, response.statusText);
      return { valid: false, error: 'Unable to verify username. Please try again.' };
    }

    const result = await response.json();

    // Check for GraphQL errors
    if (result.errors && result.errors.length > 0) {
      const errorMessage = result.errors[0]?.message || 'Username not found';
      // Common error messages from the Flash API
      if (
        errorMessage.includes('not found') ||
        errorMessage.includes('does not exist') ||
        errorMessage.includes('No user')
      ) {
        return { valid: false, error: 'This Flash username does not exist' };
      }
      return { valid: false, error: errorMessage };
    }

    // If we get a valid wallet response, the username exists
    if (result.data?.accountDefaultWallet?.id) {
      return { valid: true };
    }

    // No wallet found means the username doesn't exist
    return { valid: false, error: 'This Flash username does not exist' };
  } catch (error) {
    console.error('Error validating Flash username:', error);
    return { valid: false, error: 'Unable to verify username. Please check your connection.' };
  }
}
