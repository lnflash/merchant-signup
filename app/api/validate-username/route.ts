import { NextRequest, NextResponse } from 'next/server';

/**
 * TODO: This API route is ready for use but requires server deployment
 *
 * Currently the app is deployed as a static export (IS_BUILD_TIME=true),
 * which doesn't support API routes. To enable username validation:
 *
 * 1. Change deployment to Node.js server (not static export)
 *    - Remove IS_BUILD_TIME=true from build command
 *    - Use DigitalOcean Web Service instead of Static Site
 *    - Build command: npm run build
 *    - Run command: npm start
 *
 * 2. Update UsernameStep.tsx to use the validation:
 *    - Uncomment the validateFlashUsername import
 *    - Add back the validation state and effects
 *    - See TODO comments in that file for details
 */

const FLASH_API_URL = 'https://api.flashapp.me/graphql';

const ACCOUNT_DEFAULT_WALLET_QUERY = `
  query accountDefaultWallets($username: Username!) {
    accountDefaultWallet(username: $username) {
      id
    }
  }
`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username } = body;

    if (!username || typeof username !== 'string' || username.trim() === '') {
      return NextResponse.json({ valid: false, error: 'Username is required' }, { status: 400 });
    }

    const cleanUsername = username.trim().toLowerCase();

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
      return NextResponse.json(
        { valid: false, error: 'Unable to verify username. Please try again.' },
        { status: 502 }
      );
    }

    const result = await response.json();

    // Check for GraphQL errors
    if (result.errors && result.errors.length > 0) {
      const errorMessage = result.errors[0]?.message || 'Username not found';
      if (
        errorMessage.includes('not found') ||
        errorMessage.includes('does not exist') ||
        errorMessage.includes('No user')
      ) {
        return NextResponse.json({ valid: false, error: 'This Flash username does not exist' });
      }
      return NextResponse.json({ valid: false, error: errorMessage });
    }

    // If we get a valid wallet response, the username exists
    if (result.data?.accountDefaultWallet?.id) {
      return NextResponse.json({ valid: true });
    }

    // No wallet found means the username doesn't exist
    return NextResponse.json({ valid: false, error: 'This Flash username does not exist' });
  } catch (error) {
    console.error('Error validating Flash username:', error);
    return NextResponse.json(
      { valid: false, error: 'Unable to verify username. Please check your connection.' },
      { status: 500 }
    );
  }
}
