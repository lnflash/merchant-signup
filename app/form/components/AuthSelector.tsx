import { useState } from 'react';
import AuthForm from './AuthForm';
import CaptchaAuth from './CaptchaAuth';

export type AuthMethod = 'email' | 'captcha';

interface AuthSelectorProps {
  onAuthenticated: (userId?: string, identifier?: string) => void;
}

export default function AuthSelector({ onAuthenticated }: AuthSelectorProps) {
  const [method, setMethod] = useState<AuthMethod>('captcha');

  // Handle authentication from email method
  const handleEmailAuth = () => {
    onAuthenticated();
  };

  // Handle authentication from captcha method
  const handleCaptchaAuth = (userId: string) => {
    onAuthenticated(userId);
  };

  return (
    <div className="bg-white rounded-lg shadow-md">
      {/* Auth method tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setMethod('captcha')}
          className={`flex-1 py-3 text-center font-medium transition-all duration-200 ${
            method === 'captcha'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          // Using data-selected for styling purposes
          data-selected={method === 'captcha'}
          aria-controls="captcha-auth-panel"
          id="captcha-auth-tab"
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
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-9.618 5.04 11.946 11.946 0 019.618 5.04 11.955 11.955 0 019.618-5.04"
              />
            </svg>
            Quick Verify
          </div>
        </button>
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
            opacity: method === 'captcha' ? 1 : 0,
            height: method === 'captcha' ? 'auto' : 0,
            position: method === 'captcha' ? 'relative' : 'absolute',
          }}
        >
          {method === 'captcha' && (
            <div id="captcha-auth-panel" role="tabpanel" aria-labelledby="captcha-auth-tab">
              <CaptchaAuth onAuthenticated={handleCaptchaAuth} />
            </div>
          )}
        </div>
      </div>

      <div className="text-center pb-4 px-4">
        <p className="text-sm text-gray-500">
          Quick verification is the fastest way to continue.
          {method === 'captcha'
            ? ' Have an account? Switch to email authentication.'
            : ' New user? Switch to quick verification.'}
        </p>
      </div>
    </div>
  );
}
