# Security Update 2: Inclusive Authentication

This update addresses the issue of authentication accessibility, providing a more inclusive experience for users without email addresses.

## Key Changes

### 1. Added Phone-Based Authentication

- Created a `PhoneAuth.tsx` component for phone number validation and verification
- Added API routes for phone verification (`/app/api/auth/phone/route.ts`)
- Implemented verification code flow with secure token generation
- Designed a user-friendly verification process

### 2. Unified Authentication Interface

- Created `AuthSelector.tsx` component to provide a tabbed UI for authentication methods
- Integrated both email and phone authentication options in a single interface
- Added smooth transitions between authentication methods
- Improved UX with clear instructions for users without email addresses

### 3. Auth Service Enhancements

- Updated `auth.ts` to support both email and phone-based authentication
- Added phone auth token generation and validation
- Modified the token handling to work with both auth methods
- Implemented secure session management for phone authentication

### 4. Auth Middleware Updates

- Enhanced authentication middleware to validate both auth methods
- Added phone authentication token handling
- Implemented proper error handling for both methods
- Preserved compatibility with existing authentication flows

### 5. SignupForm Integration

- Integrated the new authentication selector into the signup form
- Updated user info display to show either email or phone number safely
- Modified sign-out functionality to handle both auth types
- Improved the user experience with clear authentication options

## Security Considerations

- Phone verification uses 6-digit codes for authentication
- Auth tokens follow a secure format: `PhoneAuth {userId}:{phoneNumber}:{authToken}`
- Phone numbers are properly validated and securely stored
- Verification codes expire after 10 minutes
- Authentication tokens expire after 24 hours
- Authentication failures are properly logged
- Sensitive user data (phone numbers) are redacted in logs
- Proper handling of edge cases (expired tokens, invalid codes)

## Usage

Users can now choose between email and phone authentication when signing up for a merchant account. The interface automatically preserves the authentication state and allows for a seamless experience regardless of which method is chosen.

For users without email addresses, phone authentication provides a secure alternative that doesn't compromise the security profile of the application.
