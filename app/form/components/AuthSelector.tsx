import { useState } from 'react';
import AuthForm from './AuthForm';
import PhoneAuth from './PhoneAuth';

export type AuthMethod = 'email' | 'phone';

interface AuthSelectorProps {
  onAuthenticated: (userId?: string, identifier?: string) => void;
}

export default function AuthSelector({ onAuthenticated }: AuthSelectorProps) {
  const [method, setMethod] = useState<AuthMethod>('email');

  // Handle authentication from email method
  const handleEmailAuth = () => {
    onAuthenticated();
  };

  // Handle authentication from phone method
  const handlePhoneAuth = (userId: string, phoneNumber: string) => {
    onAuthenticated(userId, phoneNumber);
  };

  return (
    <div className="bg-white rounded-lg shadow-md">
      {/* Auth method tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setMethod('email')}
          className={`flex-1 py-3 text-center font-medium transition-all duration-200 ${
            method === 'email'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          // Using aria-selected for styling purposes
          data-selected={method === 'email'}
          aria-controls="email-auth-panel"
          id="email-auth-tab"
        >
          <div className="flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            Email
          </div>
        </button>
        <button
          onClick={() => setMethod('phone')}
          className={`flex-1 py-3 text-center font-medium transition-all duration-200 ${
            method === 'phone'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          // Using data-selected for styling purposes
          data-selected={method === 'phone'}
          aria-controls="phone-auth-panel"
          id="phone-auth-tab"
        >
          <div className="flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
            Phone
          </div>
        </button>
      </div>

      {/* Auth method content - tabs panel with smooth transitions */}
      <div className="p-4 overflow-hidden">
        <div
          className="transition-all duration-300 transform"
          style={{
            opacity: method === 'email' ? 1 : 0,
            height: method === 'email' ? 'auto' : 0,
            position: method === 'email' ? 'relative' : 'absolute',
          }}
        >
          {method === 'email' && (
            <div id="email-auth-panel" role="tabpanel" aria-labelledby="email-auth-tab">
              <AuthForm onAuthenticated={handleEmailAuth} />
            </div>
          )}
        </div>

        <div
          className="transition-all duration-300 transform"
          style={{
            opacity: method === 'phone' ? 1 : 0,
            height: method === 'phone' ? 'auto' : 0,
            position: method === 'phone' ? 'relative' : 'absolute',
          }}
        >
          {method === 'phone' && (
            <div id="phone-auth-panel" role="tabpanel" aria-labelledby="phone-auth-tab">
              <PhoneAuth onAuthenticated={handlePhoneAuth} />
            </div>
          )}
        </div>
      </div>

      <div className="text-center pb-4 px-4">
        <p className="text-sm text-gray-500">
          Choose the authentication method that works best for you.
          {method === 'email'
            ? ' No email address? Switch to phone authentication.'
            : ' Prefer using email? Switch to email authentication.'}
        </p>
      </div>
    </div>
  );
}
