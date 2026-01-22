/**
 * Google Authentication Service
 * Handles Google OAuth 2.0 initialization and login
 */

declare global {
  interface Window {
    google: any;
  }
}

export interface GoogleUser {
  id: string;
  name: string;
  email: string;
  picture?: string;
  given_name?: string;
  family_name?: string;
}

export interface GoogleCredentialResponse {
  credential: string;
  select_by?: string;
}

/**
 * Initialize Google OAuth SDK
 * Should be called once when app loads
 */
export const initializeGoogleSDK = (clientId: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Check if Google SDK is already loaded
    if (window.google) {
      resolve();
      return;
    }

    // Create script element for Google SDK
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: () => {}, // Callback handled separately
        });
        resolve();
      } catch (error) {
        console.error("[GOOGLE AUTH] SDK initialization error:", error);
        reject(error);
      }
    };
    script.onerror = () => {
      const error = new Error(
        "Failed to load Google Sign-In SDK. Check your network connection."
      );
      console.error("[GOOGLE AUTH] Script load error:", error);
      reject(error);
    };

    document.head.appendChild(script);
  });
};

/**
 * Render Google Sign-In button
 * @param elementId - ID of container element
 * @param options - Google button options
 */
export const renderGoogleSignInButton = (
  elementId: string,
  options?: any
): void => {
  if (!window.google) {
    throw new Error("Google SDK not initialized");
  }

  const defaultOptions = {
    type: "standard",
    size: "large",
    theme: "outline",
    text: "signin_with",
    ...options,
  };

  window.google.accounts.id.renderButton(
    document.getElementById(elementId),
    defaultOptions
  );
};

/**
 * Login with Google OAuth
 * Shows Google Sign-In dialog and gets ID token
 */
export const loginWithGoogle = (): Promise<{
  user: GoogleUser;
  idToken: string;
}> => {
  return new Promise((resolve, reject) => {
    if (!window.google) {
      reject(new Error("Google SDK not initialized"));
      return;
    }

    // Set up callback
    window.google.accounts.id.oneTap({
      callback: (response: GoogleCredentialResponse) => {
        try {
          // Decode JWT token to get user info
          const base64Url = response.credential.split(".")[1];
          const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
          const jsonPayload = decodeURIComponent(
            atob(base64)
              .split("")
              .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
              .join("")
          );

          const decodedToken = JSON.parse(jsonPayload);

          const user: GoogleUser = {
            id: decodedToken.sub, // Google's subject ID
            name: decodedToken.name,
            email: decodedToken.email,
            picture: decodedToken.picture,
            given_name: decodedToken.given_name,
            family_name: decodedToken.family_name,
          };

          resolve({
            user,
            idToken: response.credential,
          });
        } catch (error) {
          console.error("[GOOGLE AUTH] Token decode error:", error);
          reject(new Error("Failed to decode Google token"));
        }
      },
      error: () => {
        reject(new Error("Google One Tap sign-in was dismissed"));
      },
    });
  });
};

/**
 * Programmatic Google Sign-In (for button clicks)
 */
export const triggerGoogleSignIn = (): Promise<{
  user: GoogleUser;
  idToken: string;
}> => {
  return new Promise((resolve, reject) => {
    if (!window.google) {
      reject(new Error("Google SDK not initialized"));
      return;
    }

    window.google.accounts.id.prompt((notification: any) => {
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        // Fallback to programmatic flow
        const callback = (response: GoogleCredentialResponse) => {
          try {
            const base64Url = response.credential.split(".")[1];
            const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
            const jsonPayload = decodeURIComponent(
              atob(base64)
                .split("")
                .map(
                  (c) =>
                    "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2)
                )
                .join("")
            );

            const decodedToken = JSON.parse(jsonPayload);

            const user: GoogleUser = {
              id: decodedToken.sub,
              name: decodedToken.name,
              email: decodedToken.email,
              picture: decodedToken.picture,
              given_name: decodedToken.given_name,
              family_name: decodedToken.family_name,
            };

            resolve({
              user,
              idToken: response.credential,
            });

            // Remove callback after use
            window.google.accounts.id.cancel();
          } catch (error) {
            console.error("[GOOGLE AUTH] Token decode error:", error);
            reject(new Error("Failed to decode Google token"));
          }
        };

        window.google.accounts.id.initialize({
          client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID,
          callback,
        });

        window.google.accounts.id.prompt();
      }
    });
  });
};

/**
 * Verify Google ID Token with backend
 * Backend should verify with Google API in production
 */
export const verifyGoogleToken = async (
  idToken: string,
  clientId: string
): Promise<boolean> => {
  try {
    const response = await fetch(
      `https://www.googleapis.com/oauth2/v1/tokeninfo?id_token=${idToken}`,
      {
        method: "GET",
      }
    );

    if (!response.ok) {
      console.error("[GOOGLE AUTH] Token verification failed:", response.status);
      return false;
    }

    const data = await response.json();

    // Verify audience (client ID)
    if (data.audience !== clientId) {
      console.error("[GOOGLE AUTH] Client ID mismatch");
      return false;
    }

    return true;
  } catch (error) {
    console.error("[GOOGLE AUTH] Token verification error:", error);
    return false;
  }
};

/**
 * Get Google user profile info from ID token
 */
export const getGoogleUserFromToken = (idToken: string): GoogleUser => {
  try {
    const base64Url = idToken.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );

    const decodedToken = JSON.parse(jsonPayload);

    return {
      id: decodedToken.sub,
      name: decodedToken.name,
      email: decodedToken.email,
      picture: decodedToken.picture,
      given_name: decodedToken.given_name,
      family_name: decodedToken.family_name,
    };
  } catch (error) {
    console.error("[GOOGLE AUTH] Failed to parse token:", error);
    throw new Error("Invalid Google ID token");
  }
};

/**
 * Logout from Google
 */
export const logoutFromGoogle = (): void => {
  if (window.google) {
    try {
      window.google.accounts.id.disableAutoSelect();
      console.log("[GOOGLE AUTH] Logged out from Google");
    } catch (error) {
      console.error("[GOOGLE AUTH] Logout error:", error);
    }
  }
};

/**
 * Check if user is signed in to Google
 */
export const checkGoogleSignInState = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (!window.google) {
      resolve(false);
      return;
    }

    try {
      window.google.accounts.id.revoke("", (done: any) => {
        resolve(false);
      });
    } catch (error) {
      resolve(false);
    }
  });
};
