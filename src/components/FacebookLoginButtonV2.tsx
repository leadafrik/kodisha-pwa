import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LegalConsents } from '../types/property';
import { facebookAuth } from '../services/facebookAuthV2';

interface FacebookLoginButtonProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
  className?: string;
  getLegalConsents?: () => Promise<LegalConsents | null>;
}

/**
 * Professional Facebook Login Button
 * Handles Facebook OAuth 2.0 authentication
 */
export const FacebookLoginButton: React.FC<FacebookLoginButtonProps> = ({
  onSuccess,
  onError,
  className = '',
  getLegalConsents,
}) => {
  const { loginWithFacebook } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize Facebook Auth on component mount
  useEffect(() => {
    const initFacebook = async () => {
      try {
        const appId = process.env.REACT_APP_FACEBOOK_APP_ID;

        if (!appId) {
          setError('Facebook configuration missing');
          return;
        }

        await facebookAuth.init(appId);
        setIsInitialized(true);
        setError(null);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to initialize Facebook Auth';
        console.error('[FacebookLoginButton] Init error:', message);
        setError(message);
      }
    };

    initFacebook();
  }, []);

  const handleClick = async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (!isInitialized || !facebookAuth.isInitialized()) {
        throw new Error('Facebook Auth not initialized');
      }

      const { user, accessToken } = await facebookAuth.login();

      if (!user.email) {
        throw new Error('Facebook account must have email');
      }

      try {
        // First attempt without explicit consents for existing users
        await loginWithFacebook(accessToken, user.id, user.email, user.name);
      } catch (initialError: any) {
        const message = initialError?.message || "";
        if (!getLegalConsents || !message.toLowerCase().includes("accept")) {
          throw initialError;
        }

        const legalConsents = await getLegalConsents();
        if (!legalConsents) {
          return;
        }

        await loginWithFacebook(
          accessToken,
          user.id,
          user.email,
          user.name,
          legalConsents
        );
      }

      // Success - trigger callback
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Facebook sign-in failed';

      console.error('[FacebookLoginButton] Sign-in error:', errorMessage);
      setError(errorMessage);

      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const isDisabled = isLoading || !isInitialized;
  const isConfigError = error && !isInitialized;

  return (
    <>
      {isConfigError && (
        <div className="mb-2 p-2 text-xs text-red-600 bg-red-50 rounded border border-red-200">
          Facebook login unavailable. Please contact support.
        </div>
      )}
      <button
        type="button"
        onClick={handleClick}
        disabled={isDisabled}
        aria-label="Sign in with Facebook"
        title={isConfigError ? "Facebook login not configured" : undefined}
        className={`
          inline-flex items-center justify-center gap-2
          w-full px-4 py-3
          bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400
          text-white font-semibold text-sm
          border-2 border-blue-600 hover:border-blue-700 disabled:border-gray-400
          rounded-lg transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
          ${className}
        `}
      >
      {/* Facebook Logo */}
      <svg
        className="w-5 h-5"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
        fill="currentColor"
      >
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>

      {/* Text */}
      {isLoading ? (
        <>
          <span className="inline-block animate-spin">⟳</span>
          <span>Signing in...</span>
        </>
      ) : (
        <span>Continue with Facebook</span>
      )}
    </button>
    </>
  );
};

export default FacebookLoginButton;
