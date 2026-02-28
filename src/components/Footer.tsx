import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import InstallPrompt from './InstallPrompt';
import { isInstalledAsApp } from '../utils/pwaInstall';

const Footer: React.FC = () => {
  const [showInstall, setShowInstall] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    setIsInstalled(isInstalledAsApp());

    const handleAppInstalled = () => {
      setIsInstalled(true);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    let mediaQuery: MediaQueryList | null = null;
    const handleDisplayModeChange = (event: MediaQueryListEvent) => {
      setIsInstalled(event.matches);
    };

    if (typeof window.matchMedia === 'function') {
      mediaQuery = window.matchMedia('(display-mode: standalone)');
      setIsInstalled((prev) => prev || mediaQuery!.matches);

      if (typeof mediaQuery.addEventListener === 'function') {
        mediaQuery.addEventListener('change', handleDisplayModeChange);
      } else if (typeof mediaQuery.addListener === 'function') {
        mediaQuery.addListener(handleDisplayModeChange);
      }
    }

    return () => {
      window.removeEventListener('appinstalled', handleAppInstalled);

      if (!mediaQuery) return;

      if (typeof mediaQuery.removeEventListener === 'function') {
        mediaQuery.removeEventListener('change', handleDisplayModeChange);
      } else if (typeof mediaQuery.removeListener === 'function') {
        mediaQuery.removeListener(handleDisplayModeChange);
      }
    };
  }, []);
  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-6 md:py-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-5">
          {/* Logo and Tagline */}
          <div className="text-center md:text-left">
            <h3 className="text-lg font-bold text-green-700">Agrisoko</h3>
            <p className="text-xs text-gray-600">Trusted agricultural marketplace across Kenya</p>
          </div>

          {/* Legal Links */}
          <div className="flex flex-wrap justify-center gap-5 text-sm">
            <Link
              to="/legal/terms"
              className="text-gray-600 hover:text-green-700 hover:underline transition"
            >
              Terms of Service
            </Link>
            <Link
              to="/legal/privacy"
              className="text-gray-600 hover:text-green-700 hover:underline transition"
            >
              Privacy Policy
            </Link>
            <a
              href="mailto:info@leadafrik.com"
              className="text-gray-600 hover:text-green-700 hover:underline transition"
            >
              Contact Support
            </a>
            <a
              href="https://www.odpc.go.ke"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-green-700 hover:underline transition"
            >
              ODPC
            </a>
          </div>

          {/* Copyright */}
          <div className="text-xs text-gray-500 text-center md:text-right whitespace-nowrap">
            <p>&copy; {new Date().getFullYear()} Agrisoko. All rights reserved.</p>
          </div>

          {/* Download App Button */}
          {!isInstalled && (
            <button
              onClick={() => setShowInstall(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold transition text-sm"
            >
              Download App
            </button>
          )}
        </div>

        {/* Mobile-Optimized Secondary Info */}
        <div className="mt-5 pt-4 border-t border-gray-200 text-xs text-gray-500 text-center">
          <p>
            Using Agrisoko means you agree to our <Link to="/legal/terms" className="text-green-700 hover:underline">Terms</Link> and <Link to="/legal/privacy" className="text-green-700 hover:underline">Privacy Policy</Link>.
          </p>
          <p className="mt-2">
            Data protection inquiries:{' '}
            <a href="mailto:info@leadafrik.com" className="text-green-700 hover:underline">
              info@leadafrik.com
            </a>
          </p>
        </div>
      </div>

      {/* Install Prompt Modal */}
      <InstallPrompt isOpen={showInstall} onClose={() => setShowInstall(false)} />
    </footer>
  );
};

export default Footer;
