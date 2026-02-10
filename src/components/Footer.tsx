import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import InstallPrompt from './InstallPrompt';
import { isInstalledAsApp } from '../utils/pwaInstall';

type FooterLink = {
  label: string;
  to?: string;
  href?: string;
};

const footerColumns: { title: string; links: FooterLink[] }[] = [
  {
    title: 'About Agrisoko',
    links: [
      { label: 'About us', to: '/about' },
      { label: 'Careers', to: '/careers' },
      { label: 'Our mission', to: '/features' },
    ],
  },
  {
    title: 'Marketplace',
    links: [
      { label: 'Browse listings', to: '/browse' },
      { label: 'Create a listing', to: '/create-listing' },
      { label: 'Buyer requests', to: '/request' },
    ],
  },
  {
    title: 'Support & Safety',
    links: [
      { label: 'Safety tips', to: '/help' },
      { label: 'FAQ', to: '/help' },
      { label: 'Contact support', href: 'mailto:info@leadAfrik.com' },
    ],
  },
  {
    title: 'Policies',
    links: [
      { label: 'Terms of service', to: '/terms' },
      { label: 'Privacy policy', to: '/privacy' },
      { label: 'Cookie policy', to: '/cookies' },
    ],
  },
];

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
      <div className="max-w-7xl mx-auto px-4 py-10 space-y-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <h3 className="text-lg font-bold text-green-700">Agrisoko</h3>
            <p className="text-sm text-gray-600 max-w-sm">
              Trusted agricultural marketplace connecting farmers, buyers, and service providers across Kenya.
            </p>
            <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Real people, trusted trade</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {!isInstalled && (
              <button
                onClick={() => setShowInstall(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold transition hover:bg-green-700 text-sm"
              >
                Download App
              </button>
            )}
            <Link to="/help" className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 transition">
              Support center
            </Link>
          </div>
        </div>

        <div className="grid gap-8 grid-cols-2 md:grid-cols-4 text-sm text-gray-600">
          {footerColumns.map((column) => (
            <div key={column.title} className="space-y-2">
              <p className="text-xs uppercase tracking-[0.3em] text-gray-500">{column.title}</p>
              <ul className="space-y-1">
                {column.links.map((link) => (
                  <li key={link.label}>
                    {link.href ? (
                      <a href={link.href} className="hover:text-emerald-700 transition">
                        {link.label}
                      </a>
                    ) : (
                      <Link to={link.to!} className="hover:text-emerald-700 transition">
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-200 pt-6 text-xs text-gray-500 space-y-1">
          <p>© {new Date().getFullYear()} Agrisoko. All rights reserved.</p>
          <p>
            Using Agrisoko means you agree to our{' '}
            <Link to="/terms" className="text-emerald-600 hover:underline">
              Terms
            </Link>{' '}
            and{' '}
            <Link to="/privacy" className="text-emerald-600 hover:underline">
              Privacy Policy
            </Link>
            .
          </p>
          <p>
            Data protection inquiries:{' '}
            <a href="mailto:info@leadAfrik.com" className="text-emerald-600 hover:underline">
              info@leadAfrik.com
            </a>
          </p>
        </div>
      </div>

      <InstallPrompt isOpen={showInstall} onClose={() => setShowInstall(false)} />
    </footer>
  );
};

export default Footer;
