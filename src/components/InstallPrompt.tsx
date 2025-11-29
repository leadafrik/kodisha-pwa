import React, { useState, useEffect } from 'react';
import { detectDevice, getInstallInstructions, installApp, isInstalledAsApp, initInstallPrompt } from '../utils/pwaInstall';

interface InstallPromptProps {
  isOpen: boolean;
  onClose: () => void;
}

const InstallPrompt: React.FC<InstallPromptProps> = ({ isOpen, onClose }) => {
  const [isInstalling, setIsInstalling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const deviceType = detectDevice();
  const instructions = getInstallInstructions(deviceType);
  const alreadyInstalled = isInstalledAsApp();

  // Initialize install prompt listener when component mounts
  useEffect(() => {
    initInstallPrompt();
  }, []);

  const handleInstall = async () => {
    setIsInstalling(true);
    setError(null);
    try {
      const success = await installApp();
      if (success) {
        onClose();
      } else if (deviceType === 'desktop') {
        setError('Installation failed. You may need to use the install icon in your address bar instead.');
      } else {
        setError('Installation was cancelled. Please follow the manual steps below.');
      }
    } catch (err) {
      setError('Installation error: ' + (err instanceof Error ? err.message : 'Unknown error'));
      console.error('Install error:', err);
    } finally {
      setIsInstalling(false);
    }
  };

  if (!isOpen) return null;

  if (alreadyInstalled) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
          <h2 className="text-2xl font-bold text-green-600 mb-2">Already Installed! 🎉</h2>
          <p className="text-gray-600 mb-4">Mamamboga Digital is already installed on your device.</p>
          <button
            onClick={onClose}
            className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 max-h-96 overflow-y-auto">
        <h2 className="text-2xl font-bold mb-2">{instructions.title}</h2>
        <p className="text-gray-600 mb-4">{instructions.description}</p>

        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Instructions for manual installation */}
        <div className="mb-6 bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-800 mb-3">Installation Steps:</h3>
          <ol className="space-y-2">
            {instructions.steps.map((step, index) => (
              <li key={index} className="flex gap-3 text-sm text-gray-700">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-600 text-white flex items-center justify-center text-xs font-bold">
                  {index + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleInstall}
            disabled={isInstalling}
            className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 font-semibold"
          >
            {isInstalling ? 'Installing...' : 'Install Now'}
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
          >
            Cancel
          </button>
        </div>

        {/* Device info */}
        <p className="text-xs text-gray-500 text-center mt-4">
          Device: {deviceType.charAt(0).toUpperCase() + deviceType.slice(1)}
        </p>
      </div>
    </div>
  );
};

export default InstallPrompt;
