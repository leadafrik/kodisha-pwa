import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { loginWithFacebook, initializeFacebookSDK } from "../services/facebookAuth";

interface FacebookLoginButtonProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
  className?: string;
}

export const FacebookLoginButton: React.FC<FacebookLoginButtonProps> = ({
  onSuccess,
  onError,
  className = "",
}) => {
  const { loginWithFacebook: authLoginWithFacebook } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleFacebookLogin = async () => {
    setIsLoading(true);
    try {
      // Initialize Facebook SDK if needed
      const fbAppId = process.env.REACT_APP_FACEBOOK_APP_ID;
      if (!fbAppId) {
        throw new Error("Facebook App ID not configured");
      }

      await initializeFacebookSDK(fbAppId);

      // Login with Facebook
      const { user, accessToken } = await loginWithFacebook();

      if (!user.email) {
        throw new Error("Facebook login requires email permission");
      }

      // Send to backend for verification and user creation
      await authLoginWithFacebook(accessToken, user.id, user.email, user.name);

      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      const errorMessage =
        error?.message || "Facebook login failed. Please try again.";
      console.error("Facebook login error:", error);

      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleFacebookLogin}
      disabled={isLoading}
      className={`
        w-full flex items-center justify-center gap-2 px-4 py-2.5
        bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400
        text-white font-medium rounded-lg
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
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span>Logging in...</span>
        </>
      ) : (
        <>
          <svg
            className="w-5 h-5"
            fill="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
          <span>Login with Facebook</span>
        </>
      )}
    </button>
  );
};

export default FacebookLoginButton;
