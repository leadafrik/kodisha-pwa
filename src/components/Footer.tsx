import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import InstallPrompt from './InstallPrompt';
import { isInstalledAsApp } from '../utils/pwaInstall';
import { BULK_FOOTER_LINK_VISIBLE } from '../config/featureFlags';

const Footer: React.FC = () => {
  const legalEntityName = 'LeadAfrik Agricultural Solutions';
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
    <footer className="mt-auto border-t border-stone-200 bg-[#F8F4EE]">
      <div className="mx-auto max-w-7xl px-4 py-6 md:py-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-5">
          <div className="text-center md:text-left">
            <h3 className="text-lg font-semibold text-[#A0452E]">Agrisoko</h3>
            <p className="text-xs text-stone-600">Trusted agricultural marketplace across Kenya</p>
            <p className="text-[11px] text-stone-500">Operated by {legalEntityName}</p>
          </div>

          <div className="flex flex-wrap justify-center gap-5 text-sm">
            <Link
              to="/legal/terms"
              className="text-stone-600 transition hover:text-[#A0452E] hover:underline"
            >
              Terms of Service
            </Link>
            <Link
              to="/legal/privacy"
              className="text-stone-600 transition hover:text-[#A0452E] hover:underline"
            >
              Privacy Policy
            </Link>
            {BULK_FOOTER_LINK_VISIBLE && (
              <Link
                to="/bulk"
                className="text-stone-600 transition hover:text-[#A0452E] hover:underline"
              >
                Bulk buying customers
              </Link>
            )}
            <a
              href="mailto:info@leadafrik.com"
              className="text-stone-600 transition hover:text-[#A0452E] hover:underline"
            >
              Contact Support
            </a>
            <a
              href="https://www.odpc.go.ke"
              target="_blank"
              rel="noopener noreferrer"
              className="text-stone-600 transition hover:text-[#A0452E] hover:underline"
            >
              ODPC
            </a>
          </div>

          <div className="text-center text-xs text-stone-500 md:text-right whitespace-nowrap">
            <p>&copy; {new Date().getFullYear()} Agrisoko. All rights reserved.</p>
          </div>

          {!isInstalled && (
            <button
              onClick={() => setShowInstall(true)}
              className="ui-btn-primary px-4 py-2 text-sm"
            >
              Download App
            </button>
          )}
        </div>

        <div className="mt-5 border-t border-stone-200 pt-4 text-center text-xs text-stone-500">
          <p>
            Using Agrisoko means you agree to our{" "}
            <Link to="/legal/terms" className="font-semibold text-[#A0452E] hover:underline">
              Terms
            </Link>{" "}
            and{" "}
            <Link to="/legal/privacy" className="font-semibold text-[#A0452E] hover:underline">
              Privacy Policy
            </Link>.
          </p>
          <p className="mt-2">
            Data protection inquiries:{" "}
            <a href="mailto:info@leadafrik.com" className="font-semibold text-[#A0452E] hover:underline">
              info@leadafrik.com
            </a>
          </p>
        </div>
      </div>

      <InstallPrompt isOpen={showInstall} onClose={() => setShowInstall(false)} />
    </footer>
  );
};

export default Footer;
