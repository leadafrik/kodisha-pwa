import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { LegalConsents } from "../types/property";
import { googleAuth } from "../services/googleAuthV2";

interface GoogleLoginButtonProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
  className?: string;
  getLegalConsents?: () => Promise<LegalConsents | null>;
}

/**
 * Production-ready Google Login Button
 * Handles Google OAuth 2.0 authentication
 */
export const GoogleLoginButton: React.FC<GoogleLoginButtonProps> = ({
  onSuccess,
  onError,
  className = "",
  getLegalConsents,
}) => {
  const { loginWithGoogle } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize Google Auth on component mount
  useEffect(() => {
    const initGoogle = async () => {
      try {
        const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;

        if (!clientId) {
          setError("Google configuration missing");
          return;
        }

        await googleAuth.init(clientId);
        setIsInitialized(true);
        setError(null);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to initialize Google Auth";
        console.error("[GoogleLoginButton] Init error:", message);
        setError(message);
      }
    };

    initGoogle();
  }, []);

  const handleClick = async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (!isInitialized || !googleAuth.isInitialized()) {
        throw new Error("Google Auth not initialized");
      }

      const { user, idToken } = await googleAuth.signIn();

      if (!user.email) {
        throw new Error("Google account must have email");
      }

      try {
        // First attempt without explicit consents for existing users
        await loginWithGoogle(idToken, user.id, user.email, user.name);
      } catch (initialError: any) {
        const message = initialError?.message || "";
        if (!getLegalConsents || !message.toLowerCase().includes("accept")) {
          throw initialError;
        }

        const legalConsents = await getLegalConsents();
        if (!legalConsents) {
          return;
        }

        await loginWithGoogle(
          idToken,
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
        err instanceof Error ? err.message : "Google sign-in failed";

      console.error("[GoogleLoginButton] Sign-in error:", errorMessage);
      setError(errorMessage);

      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isLoading}
      aria-label="Sign in with Google"
      className={`
        inline-flex items-center justify-center gap-2
        w-full px-4 py-3
        bg-white hover:bg-gray-50 disabled:bg-gray-100
        text-gray-700 font-semibold text-sm
        border-2 border-gray-300 hover:border-gray-400 disabled:border-gray-300
        rounded-lg transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500
        ${className}
      `}
    >
      {/* Google Logo */}
      <svg
        className="w-5 h-5"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          fill="#4285F4"
        />
        <path
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          fill="#34A853"
        />
        <path
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          fill="#FBBC05"
        />
        <path
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          fill="#EA4335"
        />
      </svg>

      {/* Text */}
      {isLoading ? (
        <>
          <span className="inline-block animate-spin">⏳</span>
          <span>Signing in...</span>
        </>
      ) : (
        <span>Continue with Google</span>
      )}
    </button>
  );
};

export default GoogleLoginButton;
