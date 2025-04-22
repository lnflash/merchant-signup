import { useState } from 'react';
import { logger } from '../../../src/utils/logger';

interface CaptchaAuthProps {
  onAuthenticated: (userId: string) => void;
}

// Simple math captcha
const generateCaptcha = () => {
  const num1 = Math.floor(Math.random() * 10) + 1;
  const num2 = Math.floor(Math.random() * 10) + 1;
  return {
    num1,
    num2,
    answer: num1 + num2,
  };
};

export default function CaptchaAuth({ onAuthenticated }: CaptchaAuthProps) {
  const [captcha] = useState(generateCaptcha());
  const [userAnswer, setUserAnswer] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    // Validate the captcha
    const parsedAnswer = parseInt(userAnswer, 10);

    if (isNaN(parsedAnswer)) {
      setError('Please enter a valid number');
      setIsSubmitting(false);
      return;
    }

    if (parsedAnswer !== captcha.answer) {
      setError('Incorrect answer, please try again');
      setIsSubmitting(false);
      return;
    }

    // Captcha is valid - create a guest user
    try {
      const userId = `guest_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;

      // Store authenticated user info
      localStorage.setItem(
        'authenticatedUser',
        JSON.stringify({
          userId,
          authenticated: true,
          expires: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
          method: 'captcha',
        })
      );

      // Notify parent component
      onAuthenticated(userId);

      logger.info('Captcha authentication successful', { userId });
    } catch (err) {
      setError('Authentication failed. Please try again.');
      logger.error('Captcha authentication error', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Quick Verification</h2>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="captcha" className="block text-sm font-medium text-gray-700 mb-1">
            Please solve this simple math problem to continue:
          </label>
          <div className="p-4 bg-gray-50 rounded-md border border-gray-200 mb-3 text-center">
            <span className="text-lg font-medium">
              {captcha.num1} + {captcha.num2} = ?
            </span>
          </div>
          <input
            id="captcha"
            type="number"
            value={userAnswer}
            onChange={e => setUserAnswer(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Your answer"
            disabled={isSubmitting}
            required
          />
        </div>

        <div>
          <button
            type="submit"
            disabled={isSubmitting || !userAnswer}
            className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
              isSubmitting || !userAnswer ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {isSubmitting ? 'Verifying...' : 'Verify & Continue'}
          </button>
        </div>
      </form>

      <div className="mt-4 text-center">
        <p className="text-xs text-gray-500">
          This helps us prevent automated submissions. By continuing, you agree to our Terms of
          Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
