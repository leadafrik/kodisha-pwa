import React, { useEffect, useState } from "react";
import {
  detectDevice,
  getInstallInstructions,
  initInstallPrompt,
  installApp,
  isInstalledAsApp,
} from "../utils/pwaInstall";

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
      } else if (deviceType === "desktop") {
        setError("Installation failed. You may need to use the install icon in your address bar instead.");
      } else {
        setError("Installation was cancelled. Please follow the manual steps below.");
      }
    } catch (err) {
      setError(`Installation error: ${err instanceof Error ? err.message : "Unknown error"}`);
      console.error("Install error:", err);
    } finally {
      setIsInstalling(false);
    }
  };

  if (!isOpen) return null;

  if (alreadyInstalled) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm">
        <div className="ui-card w-full max-w-md p-6">
          <h2 className="mb-2 text-2xl font-semibold text-[#A0452E]">Already installed</h2>
          <p className="mb-4 text-stone-600">Agrisoko is already installed on your device.</p>
          <button onClick={onClose} className="ui-btn-primary w-full">
            Got it
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm">
      <div className="ui-card max-h-[32rem] w-full max-w-md overflow-y-auto p-6">
        <h2 className="mb-2 text-2xl font-semibold text-stone-900">{instructions.title}</h2>
        <p className="mb-4 text-stone-600">{instructions.description}</p>

        {error && (
          <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="ui-card-soft mb-6 p-4">
          <h3 className="mb-3 font-semibold text-stone-800">Installation Steps</h3>
          <ol className="space-y-2">
            {instructions.steps.map((step, index) => (
              <li key={index} className="flex gap-3 text-sm text-stone-700">
                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#A0452E] text-xs font-bold text-white">
                  {index + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="flex gap-3">
          <button onClick={handleInstall} disabled={isInstalling} className="ui-btn-primary flex-1">
            {isInstalling ? "Installing..." : "Install Now"}
          </button>
          <button onClick={onClose} className="ui-btn-ghost flex-1">
            Cancel
          </button>
        </div>

        <p className="mt-4 text-center text-xs text-stone-500">
          Device: {deviceType.charAt(0).toUpperCase() + deviceType.slice(1)}
        </p>
      </div>
    </div>
  );
};

export default InstallPrompt;
