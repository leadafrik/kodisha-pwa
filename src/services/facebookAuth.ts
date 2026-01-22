/**
 * Facebook Authentication Service
 * Handles Facebook SDK initialization and login
 * Includes data deletion callback and advanced features
 */

declare global {
  interface Window {
    FB: any;
    fbAsyncInit: () => void;
  }
}

export interface FacebookUser {
  id: string;
  name: string;
  email: string;
  picture?: {
    data: {
      height: number;
      is_silhouette: boolean;
      url: string;
      width: number;
    };
  };
}

export interface FacebookLoginResponse {
  authResponse: {
    accessToken: string;
    expiresIn: number;
    reauthorize_required_in: number;
    signedRequest: string;
    userID: string;
  };
  status: 'connected' | 'not_authorized' | 'unknown';
}

/**
 * Initialize Facebook SDK
 * Should be called once when app loads
 */
export const initializeFacebookSDK = (appId: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Check if FB is already initialized
    if (window.FB) {
      resolve();
      return;
    }

    // Set up the async init function
    window.fbAsyncInit = function() {
      try {
        window.FB.init({
          appId: appId,
          cookie: true,
          xfbml: true,
          version: 'v18.0'
        });
        
        // Setup data deletion callback
        setupDataDeletionCallback();
        
        window.FB.AppEvents.logPageView();
        resolve();
      } catch (error) {
        console.error('Facebook SDK init error:', error);
        reject(error);
      }
    };

    // Load Facebook SDK if not already loaded
    if (!document.getElementById('facebook-jssdk')) {
      const script = document.createElement('script');
      script.id = 'facebook-jssdk';
      script.src = 'https://connect.facebook.net/en_US/sdk.js';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        // SDK loaded, fbAsyncInit will be called
      };
      script.onerror = () => {
        reject(new Error('Failed to load Facebook SDK'));
      };
      document.body.appendChild(script);
    }
  });
};

/**
 * Setup data deletion callback
 * This is required for apps that request user data
 */
const setupDataDeletionCallback = () => {
  if (window.FB && window.FB.AppEvents) {
    // Register for data deletion confirmations
    window.FB.AppEvents.EventNames.subscribe('data_deletion_event', (event: any) => {
      console.log('Data deletion event received:', event);
      // Handle deletion confirmation - can be used to track compliance
    });
  }
};

/**
 * Login with Facebook using custom button
 * Returns Facebook user info and access token
 * 
 * @param scope - Requested permissions (e.g., 'public_profile,email')
 */
export const loginWithFacebook = (scope: string = 'public_profile,email'): Promise<{
  user: FacebookUser;
  accessToken: string;
  expiresIn: number;
  userID: string;
}> => {
  return new Promise((resolve, reject) => {
    if (!window.FB) {
      reject(new Error('Facebook SDK not initialized'));
      return;
    }

    window.FB.login(
      (response: FacebookLoginResponse) => {
        if (response.authResponse) {
          const { accessToken, expiresIn, userID } = response.authResponse;

          // Get user details with requested fields
          window.FB.api('/me', { 
            fields: 'id,name,email,picture,birthday,gender,location' 
          }, (userInfo: FacebookUser) => {
            resolve({
              user: userInfo,
              accessToken,
              expiresIn,
              userID,
            });
          });
        } else {
          reject(new Error('Failed to authenticate with Facebook'));
        }
      },
      { scope, auth_type: 'rerequest' }
    );
  });
};

/**
 * Login using Facebook's built-in login button
 * Call this from the button's onlogin callback
 */
export const checkLoginState = (callback: (response: FacebookLoginResponse) => void): void => {
  if (!window.FB) {
    console.error('Facebook SDK not initialized');
    return;
  }

  window.FB.getLoginStatus((response: FacebookLoginResponse) => {
    callback(response);
  });
};

/**
 * Get current login status
 */
export const getFacebookLoginStatus = (): Promise<FacebookLoginResponse> => {
  return new Promise((resolve, reject) => {
    if (!window.FB) {
      reject(new Error('Facebook SDK not initialized'));
      return;
    }

    window.FB.getLoginStatus((response: FacebookLoginResponse) => {
      resolve(response);
    });
  });
};

/**
 * Logout from Facebook
 */
export const logoutFromFacebook = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!window.FB) {
      reject(new Error('Facebook SDK not initialized'));
      return;
    }

    window.FB.logout(() => {
      resolve();
    });
  });
};

/**
 * Verify access token with Facebook servers
 * Call this on backend for security
 */
export const verifyAccessToken = async (
  accessToken: string,
  appId: string,
  appSecret: string
): Promise<{
  data: {
    app_id: string;
    type: string;
    application: string;
    data_access_expires_at: number;
    expires_at: number;
    is_valid: boolean;
    issued_at: number;
    scopes: string[];
    user_id: string;
  };
}> => {
  const response = await fetch(
    `https://graph.facebook.com/debug_token?input_token=${accessToken}&access_token=${appId}|${appSecret}`
  );
  
  if (!response.ok) {
    throw new Error('Failed to verify access token');
  }
  
  return response.json();
};

/**
 * Get user's friends list (if user granted permission)
 */
export const getUserFriends = (accessToken: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    if (!window.FB) {
      reject(new Error('Facebook SDK not initialized'));
      return;
    }

    window.FB.api('/me/friends', { access_token: accessToken }, (response: any) => {
      if (response.error) {
        reject(response.error);
      } else {
        resolve(response);
      }
    });
  });
};

/**
 * Request additional permissions from user
 */
export const requestAdditionalPermissions = (permissions: string[]): Promise<any> => {
  return new Promise((resolve, reject) => {
    if (!window.FB) {
      reject(new Error('Facebook SDK not initialized'));
      return;
    }

    window.FB.login(
      (response: any) => {
        if (response.authResponse) {
          resolve(response);
        } else {
          reject(new Error('Permission request denied'));
        }
      },
      { scope: permissions.join(','), auth_type: 'rerequest' }
    );
  });
};
