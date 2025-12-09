import React, { useState } from 'react';
import { Link } from 'react-router-dom';

interface LegalAcceptanceModalProps {
  isOpen: boolean;
  onAccept: (consents: {
    termsAccepted: boolean;
    privacyAccepted: boolean;
    marketingConsent: boolean;
    dataProcessingConsent: boolean;
  }) => void;
  onCancel: () => void;
  loading?: boolean;
}

const LegalAcceptanceModal: React.FC<LegalAcceptanceModalProps> = ({
  isOpen,
  onAccept,
  onCancel,
  loading = false,
}) => {
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);

  if (!isOpen) return null;

  const allRequiredAccepted = termsAccepted && privacyAccepted;

  const handleSubmit = () => {
    if (allRequiredAccepted) {
      onAccept({
        termsAccepted,
        privacyAccepted,
        marketingConsent,
        dataProcessingConsent: true,
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4">
          <h2 className="text-2xl font-bold text-white">Legal Terms & Agreements</h2>
          <p className="text-green-50 text-sm mt-1">
            Please review and accept to create your account
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Key Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-900 font-medium">
              By checking the boxes below, you agree to our Terms of Service and Privacy Policy, which govern how you use Agrisoko and how we handle your data.
            </p>
          </div>

          {/* Consents */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900 text-sm mb-3">Required Consents</h3>
            
            {/* Terms */}
            <label className="flex items-start gap-3 cursor-pointer p-3 rounded hover:bg-gray-50">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-1 w-5 h-5 text-green-600 rounded"
              />
              <div>
                <div className="font-semibold text-gray-900 text-sm flex items-center gap-1">
                  I accept the <Link to="/legal/terms" target="_blank" className="text-green-600 hover:underline">Terms of Service</Link>
                  <span className="text-red-600">*</span>
                </div>
                <p className="text-xs text-gray-600 mt-0.5">Platform rules and user obligations</p>
              </div>
            </label>

            {/* Privacy */}
            <label className="flex items-start gap-3 cursor-pointer p-3 rounded hover:bg-gray-50">
              <input
                type="checkbox"
                checked={privacyAccepted}
                onChange={(e) => setPrivacyAccepted(e.target.checked)}
                className="mt-1 w-5 h-5 text-green-600 rounded"
              />
              <div>
                <div className="font-semibold text-gray-900 text-sm flex items-center gap-1">
                  I accept the <Link to="/legal/privacy" target="_blank" className="text-green-600 hover:underline">Privacy Policy</Link>
                  <span className="text-red-600">*</span>
                </div>
                <p className="text-xs text-gray-600 mt-0.5">How we handle your personal data</p>
              </div>
            </label>

            {/* Marketing */}
            <div className="pt-2 border-t">
              <h4 className="font-semibold text-gray-900 text-xs mb-2">Optional</h4>
              <label className="flex items-start gap-3 cursor-pointer p-3 rounded hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={marketingConsent}
                  onChange={(e) => setMarketingConsent(e.target.checked)}
                  className="mt-1 w-5 h-5 text-green-600 rounded"
                />
                <div>
                  <div className="font-semibold text-gray-900 text-sm">
                    I agree to receive marketing communications
                  </div>
                  <p className="text-xs text-gray-600 mt-0.5">Send me updates about new features and deals</p>
                </div>
              </label>
            </div>
          </div>

          {/* Contact Info */}
          <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600 mt-4">
            <p className="font-semibold text-gray-900 mb-1">Questions?</p>
            <p><a href="mailto:kodisha.254.ke@gmail.com" className="text-green-600 hover:underline">kodisha.254.ke@gmail.com</a></p>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t bg-gray-50 px-6 py-4 flex gap-3 justify-end">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-semibold hover:bg-gray-100 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!allRequiredAccepted || loading}
            className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-700 disabled:opacity-50 inline-flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Create Account
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LegalAcceptanceModal;
