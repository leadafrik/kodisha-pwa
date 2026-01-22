import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { loginWithGoogle, initializeGoogleSDK } from "../services/googleAuth";

interface GoogleLoginButtonProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
  className?: string;
}

export const GoogleLoginButton: React.FC<GoogleLoginButtonProps> = ({
  onSuccess,
  onError,
  className = "",
}) => {
  const { loginWithGoogle: authLoginWithGoogle } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Initialize Google SDK on component mount
    const googleClientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
    if (!googleClientId) {
      console.error("Google Client ID not configured");
      return;
    }

    initializeGoogleSDK(googleClientId).catch((error) => {
      console.error("Failed to initialize Google SDK:", error);
    });
  }, []);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      const googleClientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
      if (!googleClientId) {
        throw new Error("Google Client ID not configured");
      }

      await initializeGoogleSDK(googleClientId);

      // Login with Google
      const { user, idToken } = await loginWithGoogle();

      if (!user.email) {
        throw new Error("Google login requires email permission");
      }

      // Send to backend for verification and user creation
      await authLoginWithGoogle(idToken, user.id, user.email, user.name);

      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      const errorMessage =
        error?.message || "Google login failed. Please try again.";
      console.error("Google login error:", error);

      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleGoogleLogin}
      disabled={isLoading}
      className={`
        w-full flex items-center justify-center gap-2 px-4 py-2.5
        bg-white hover:bg-gray-50 disabled:bg-gray-100
        text-gray-700 font-medium text-sm rounded-lg
        border border-gray-300 hover:border-gray-400
        transition-colors duration-200
        ${className}
      `}
    >
      {isLoading ? (
        <>
          <svg
            className="animate-spin h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <span>Logging in...</span>
        </>
      ) : (
        <>
          {/* Google Icon SVG */}
          <svg
            className="w-5 h-5"
            viewBox="0 0 24 24"
            fill="none"
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
          <span>Sign in with Google</span>
        </>
      )}
    </button>
  );
};
