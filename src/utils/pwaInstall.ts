// PWA Installation detection and handling

export interface DeviceInfo {
  deviceType: 'android' | 'ios' | 'desktop';
  canInstall: boolean;
  installPrompt?: Event;
}

let deferredPrompt: Event | null = null;

// Initialize the install prompt listener
export function initInstallPrompt() {
  if (typeof window !== 'undefined') {
    window.addEventListener('beforeinstallprompt', (e: Event) => {
      e.preventDefault();
      deferredPrompt = e;
      console.log('Install prompt available');
    });

    window.addEventListener('appinstalled', () => {
      console.log('App successfully installed');
      deferredPrompt = null;
    });
  }
}

// Detect device type
export function detectDevice(): DeviceInfo['deviceType'] {
  const ua = navigator.userAgent.toLowerCase();
  
  if (/android/.test(ua)) return 'android';
  if (/iphone|ipad|ipod/.test(ua)) return 'ios';
  return 'desktop';
}

// Check if PWA can be installed
export function checkPWAInstallability(): DeviceInfo {
  const deviceType = detectDevice();
  const canInstall = deferredPrompt !== null || deviceType !== 'desktop';

  return {
    deviceType,
    canInstall,
    installPrompt: deferredPrompt || undefined
  };
}

// Get current deferred prompt
export function getDeferredPrompt(): Event | null {
  return deferredPrompt;
}

// Get installation instructions based on device
export function getInstallInstructions(deviceType: DeviceInfo['deviceType']): {
  title: string;
  description: string;
  steps: string[];
} {
  const instructions: Record<string, any> = {
    android: {
      title: 'Install Agrisoko',
      description: 'Add Agrisoko to your home screen for quick access',
      steps: [
        'Tap the menu button (three dots) in Chrome',
        'Select "Install app" or "Add to Home screen"',
        'Follow the prompts to install'
      ]
    },
    ios: {
      title: 'Add to Home Screen',
      description: 'Add Agrisoko to your iPhone home screen',
      steps: [
        'Tap the Share button (square with arrow)',
        'Scroll and tap "Add to Home Screen"',
        'Tap "Add" to confirm'
      ]
    },
    desktop: {
      title: 'Install Agrisoko',
      description: 'Install our app for a better experience',
      steps: [
        'Click the install icon in your address bar',
        'Click "Install"',
        'The app will appear in your applications'
      ]
    }
  };

  return instructions[deviceType];
}

// Handle installation
export async function installApp(): Promise<boolean> {
  // Get current prompt state
  const prompt = getDeferredPrompt();
  
  if (!prompt) {
    console.warn('Install prompt not available');
    return false;
  }

  try {
    // Show the install prompt
    (prompt as any).prompt();
    
    // Wait for user's choice
    const { outcome } = await (prompt as any).userChoice;
    console.log('Install outcome:', outcome);
    
    if (outcome === 'accepted') {
      deferredPrompt = null;
      return true;
    } else if (outcome === 'dismissed') {
      return false;
    }
    return false;
  } catch (error) {
    console.error('Installation prompt failed:', error);
    return false;
  }
}

// Check if already installed as app
export function isInstalledAsApp(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches ||
         (window.navigator as any).standalone === true;
}
