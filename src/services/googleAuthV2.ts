/**
 * Google OAuth 2.0 Authentication Service (Production-Ready)
 * Uses Google Sign-In SDK for secure authentication
 */

declare global {
  interface Window {
    google: any;
  }
}

export interface GoogleUser {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

export interface GoogleAuthConfig {
  clientId: string;
}

class GoogleAuthService {
  private initialized = false;
  private clientId: string = "";

  /**
   * Initialize Google Auth SDK
   */
  async init(clientId: string): Promise<void> {
    if (this.initialized && window.google) {
      return;
    }

    this.clientId = clientId;

    return new Promise((resolve, reject) => {
      // Check if already loaded
      if (window.google) {
        this.initialized = true;
        resolve();
        return;
      }

      // Load Google SDK script
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;

      script.onload = () => {
        try {
          if (!window.google) {
            throw new Error("Google SDK loaded but window.google not found");
          }

          window.google.accounts.id.initialize({
            client_id: clientId,
          });

          this.initialized = true;
          resolve();
        } catch (error) {
          console.error("[GoogleAuth] Initialization error:", error);
          reject(error);
        }
      };

      script.onerror = () => {
        const error = new Error("Failed to load Google Sign-In SDK");
        console.error("[GoogleAuth] Script load error:", error);
        reject(error);
      };

      document.head.appendChild(script);
    });
  }

  /**
   * Trigger Google One Tap sign-in
   * Returns promise that resolves when user signs in or rejects if dismissed
   */
  async signIn(): Promise<{ user: GoogleUser; idToken: string }> {
    if (!this.initialized || !window.google) {
      throw new Error("Google Auth not initialized. Call init() first.");
    }

    return new Promise((resolve, reject) => {
      const callback = (response: any) => {
        try {
          if (!response.credential) {
            throw new Error("No credential received from Google");
          }

          // Decode JWT token to get user info
          const parts = response.credential.split(".");
          if (parts.length !== 3) {
            throw new Error("Invalid JWT token format");
          }

          const base64Url = parts[1];
          const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");

          try {
            const jsonPayload = JSON.parse(
              decodeURIComponent(
                atob(base64)
                  .split("")
                  .map((c: string) =>
                    "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2)
                  )
                  .join("")
              )
            );

            const user: GoogleUser = {
              id: jsonPayload.sub,
              email: jsonPayload.email,
              name: jsonPayload.name,
              picture: jsonPayload.picture,
            };

            resolve({
              user,
              idToken: response.credential,
            });
          } catch (parseError) {
            throw new Error("Failed to parse Google token");
          }
        } catch (error) {
          reject(error);
        }
      };

      // Re-initialize with callback
      window.google.accounts.id.initialize({
        client_id: this.clientId,
        callback,
      });

      // Show One Tap UI
      window.google.accounts.id.prompt((notification: any) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          // One Tap not available, could fallback to redirect flow
          reject(
            new Error("Google Sign-In unavailable. Please try again or use email/password.")
          );
        }
      });
    });
  }

  /**
   * Check if Google is initialized
   */
  isInitialized(): boolean {
    return this.initialized && !!window.google;
  }

  /**
   * Revoke Google session
   */
  logout(): void {
    if (window.google) {
      try {
        window.google.accounts.id.disableAutoSelect();
      } catch (error) {
        console.warn("[GoogleAuth] Logout warning:", error);
      }
    }
  }
}

// Singleton instance
export const googleAuth = new GoogleAuthService();
