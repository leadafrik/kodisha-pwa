/**
 * Facebook OAuth 2.0 Authentication Service (Production-Ready)
 * Uses Facebook Login SDK for secure authentication
 */

declare global {
  interface Window {
    FB: any;
    fbAsyncInit: () => void;
  }
}

export interface FacebookUser {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

class FacebookAuthService {
  private initialized = false;
  private appId: string = '';

  /**
   * Initialize Facebook SDK
   */
  async init(appId: string): Promise<void> {
    if (this.initialized && window.FB) {
      return;
    }

    this.appId = appId;

    return new Promise((resolve, reject) => {
      if (window.FB) {
        this.initialized = true;
        resolve();
        return;
      }

      // Set up async init callback
      window.fbAsyncInit = () => {
        try {
          window.FB.init({
            appId: appId,
            cookie: true,
            xfbml: false,
            version: 'v18.0',
          });

          this.initialized = true;
          resolve();
        } catch (error) {
          console.error('[FacebookAuth] Initialization error:', error);
          reject(error);
        }
      };

      // Load Facebook SDK script
      const script = document.createElement('script');
      script.src = 'https://connect.facebook.net/en_US/sdk.js';
      script.async = true;
      script.defer = true;

      script.onerror = () => {
        const error = new Error('Failed to load Facebook SDK');
        console.error('[FacebookAuth] Script load error:', error);
        reject(error);
      };

      document.head.appendChild(script);
    });
  }

  /**
   * Trigger Facebook login
   * Returns promise that resolves when user logs in or rejects if cancelled
   */
  async login(): Promise<{ user: FacebookUser; accessToken: string }> {
    if (!this.initialized || !window.FB) {
      throw new Error('Facebook Auth not initialized. Call init() first.');
    }

    return new Promise((resolve, reject) => {
      window.FB.login(
        (response: any) => {
          if (response.authResponse) {
            // User logged in
            this.getUserProfile(response.authResponse.accessToken)
              .then((user) => {
                resolve({
                  user,
                  accessToken: response.authResponse.accessToken,
                });
              })
              .catch((error) => {
                reject(new Error('Failed to get user profile'));
              });
          } else {
            // User cancelled login
            reject(new Error('Facebook login cancelled'));
          }
        },
        { scope: 'public_profile,email' }
      );
    });
  }

  /**
   * Get user profile from Facebook
   */
  private async getUserProfile(accessToken: string): Promise<FacebookUser> {
    return new Promise((resolve, reject) => {
      window.FB.api(
        '/me',
        { fields: 'id,name,email,picture.width(200).height(200)', access_token: accessToken },
        (response: any) => {
          if (response.error) {
            reject(new Error(response.error.message || 'Failed to get user profile'));
            return;
          }

          resolve({
            id: response.id,
            email: response.email || '',
            name: response.name || '',
            picture: response.picture?.data?.url,
          });
        }
      );
    });
  }

  /**
   * Check if user is logged in
   */
  async checkLoginStatus(): Promise<boolean> {
    if (!this.initialized || !window.FB) {
      return false;
    }

    return new Promise((resolve) => {
      window.FB.getLoginStatus((response: any) => {
        resolve(response.authResponse !== null);
      });
    });
  }

  /**
   * Logout from Facebook
   */
  logout(): void {
    if (window.FB) {
      window.FB.logout();
    }
  }

  /**
   * Check if Facebook is initialized
   */
  isInitialized(): boolean {
    return this.initialized && !!window.FB;
  }
}

// Singleton instance
export const facebookAuth = new FacebookAuthService();
