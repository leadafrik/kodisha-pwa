import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          {/* Logo and Tagline */}
          <div className="text-center md:text-left">
            <h3 className="text-lg font-bold text-green-700">Kodisha</h3>
            <p className="text-xs text-gray-600">Connecting Kenya's Agricultural Community</p>
          </div>

          {/* Legal Links */}
          <div className="flex flex-wrap justify-center gap-6 text-sm">
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
              href="mailto:kodisha.254.ke@gmail.com"
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
          <div className="text-xs text-gray-500 text-center md:text-right">
            <p>&copy; {new Date().getFullYear()} Kodisha. All rights reserved.</p>
            <p className="mt-1">Data Controller Registration: [Pending]</p>
          </div>
        </div>

        {/* Mobile-Optimized Secondary Info */}
        <div className="mt-4 pt-4 border-t border-gray-200 text-xs text-gray-500 text-center">
          <p>
            By using Kodisha, you agree to our{' '}
            <Link to="/legal/terms" className="text-green-700 hover:underline">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link to="/legal/privacy" className="text-green-700 hover:underline">
              Privacy Policy
            </Link>
          </p>
          <p className="mt-2">
            For data protection inquiries:{' '}
            <a href="mailto:kodisha.254.ke@gmail.com" className="text-green-700 hover:underline">
              kodisha.254.ke@gmail.com
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
