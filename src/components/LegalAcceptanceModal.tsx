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
  const [dataProcessingConsent, setDataProcessingConsent] = useState(false);
  const [hasScrolledTerms, setHasScrolledTerms] = useState(false);
  const [hasScrolledPrivacy, setHasScrolledPrivacy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  if (!isOpen) return null;

  const allRequiredAccepted = termsAccepted && privacyAccepted && dataProcessingConsent;

  const handleTermsScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget;
    const isNearBottom = element.scrollHeight - element.scrollTop <= element.clientHeight + 50;
    if (isNearBottom) {
      setHasScrolledTerms(true);
    }
  };

  const handlePrivacyScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget;
    const isNearBottom = element.scrollHeight - element.scrollTop <= element.clientHeight + 50;
    if (isNearBottom) {
      setHasScrolledPrivacy(true);
    }
  };

  const handleSubmit = () => {
    if (allRequiredAccepted) {
      onAccept({
        termsAccepted,
        privacyAccepted,
        marketingConsent,
        dataProcessingConsent,
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4">
          <h2 className="text-2xl font-bold text-white">Legal Agreement</h2>
          <p className="text-green-50 text-sm mt-1">
            Please review and accept our terms to continue
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Important Notice */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
              </svg>
              <div>
                <h3 className="font-semibold text-yellow-900">Important Legal Notice</h3>
                <p className="text-sm text-yellow-800 mt-1">
                  By creating an account, you are entering into a legally binding agreement under Kenyan law. 
                  Please read these documents carefully. You may want to seek independent legal advice before accepting.
                </p>
              </div>
            </div>
          </div>

          {/* Terms of Service Section */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setShowTerms(!showTerms)}
              className="w-full bg-gray-50 px-4 py-3 flex items-center justify-between hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">📜</span>
                <div className="text-left">
                  <h3 className="font-semibold text-gray-900">Terms of Service</h3>
                  <p className="text-sm text-gray-600">Platform rules and user obligations</p>
                </div>
              </div>
              <svg 
                className={`w-5 h-5 text-gray-500 transition-transform ${showTerms ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {showTerms && (
              <div 
                className="p-4 max-h-96 overflow-y-auto bg-white prose prose-sm max-w-none"
                onScroll={handleTermsScroll}
              >
                <div className="text-xs space-y-3">
                  <h4 className="font-bold">TERMS OF SERVICE SUMMARY</h4>
                  <p><strong>Last Updated:</strong> November 24, 2025</p>
                  
                  <div className="bg-blue-50 p-3 rounded border border-blue-200">
                    <p className="font-semibold text-blue-900">Key Points:</p>
                    <ul className="mt-2 space-y-1 text-blue-800">
                      <li>• You must be 18+ years old to use Mamamboga Digital</li>
                      <li>• Mamamboga Digital is an intermediary platform, not a party to transactions</li>
                      <li>• You are responsible for the accuracy of your listings</li>
                      <li>• Platform fees apply (details in Section 7)</li>
                      <li>• Disputes are resolved through arbitration in Kenya</li>
                      <li>• You must comply with all Kenyan laws</li>
                    </ul>
                  </div>

                  <p><strong>Platform Description:</strong> Mamamboga Digital connects land owners, equipment providers, service professionals, and agrovets with farmers and agricultural businesses.</p>
                  
                  <p><strong>Your Obligations:</strong> Provide accurate information, honor agreements, pay applicable fees, comply with Kenyan laws including the Land Act (2012) and Consumer Protection Act (2012).</p>
                  
                  <p><strong>Prohibited Activities:</strong> False listings, fraud, harassment, circumventing fees, discriminatory practices, listing land without proper documentation.</p>
                  
                  {/* <p><strong>Payment Terms:</strong> Land listings from KSh 99, service subscriptions KSh 599/year, product commissions 0.5% or KSh 49 minimum.</p> */}
                  <p><strong>Payment Terms:</strong> Currently all listings are free during our introductory phase. Listing fees and payment processing will be announced with advance notice before activation.</p>
                  
                  <p><strong>Liability:</strong> Mamamboga Digital provides the platform "as is" and is not liable for user conduct, transaction failures, or disputes between users (subject to Kenyan consumer protection law).</p>
                  
                  <p><strong>Dispute Resolution:</strong> Disputes resolved through negotiation, mediation, then arbitration under the Arbitration Act (1995) in Nairobi.</p>

                  <div className="mt-4 p-3 bg-gray-50 rounded border">
                    <Link to="/legal/terms" target="_blank" className="text-green-600 hover:text-green-700 font-semibold text-sm">
                      📄 Read Full Terms of Service (opens in new tab) →
                    </Link>
                  </div>
                </div>
                
                {!hasScrolledTerms && (
                  <div className="sticky bottom-0 bg-gradient-to-t from-white via-white pt-4 text-center">
                    <p className="text-xs text-gray-500">↓ Scroll to bottom to enable acceptance ↓</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Privacy Policy Section */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setShowPrivacy(!showPrivacy)}
              className="w-full bg-gray-50 px-4 py-3 flex items-center justify-between hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">🔒</span>
                <div className="text-left">
                  <h3 className="font-semibold text-gray-900">Privacy Policy</h3>
                  <p className="text-sm text-gray-600">How we handle your personal data</p>
                </div>
              </div>
              <svg 
                className={`w-5 h-5 text-gray-500 transition-transform ${showPrivacy ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {showPrivacy && (
              <div 
                className="p-4 max-h-96 overflow-y-auto bg-white prose prose-sm max-w-none"
                onScroll={handlePrivacyScroll}
              >
                <div className="text-xs space-y-3">
                  <h4 className="font-bold">PRIVACY POLICY SUMMARY</h4>
                  <p><strong>Last Updated:</strong> November 24, 2025</p>
                  <p><strong>Compliance:</strong> Data Protection Act, 2019 (Kenya)</p>
                  
                  <div className="bg-blue-50 p-3 rounded border border-blue-200">
                    <p className="font-semibold text-blue-900">Your Rights:</p>
                    <ul className="mt-2 space-y-1 text-blue-800">
                      <li>• Access your personal data (free)</li>
                      <li>• Correct inaccurate data</li>
                      <li>• Request deletion ("right to be forgotten")</li>
                      <li>• Object to processing</li>
                      <li>• Data portability</li>
                      <li>• Complain to Data Protection Commissioner</li>
                    </ul>
                  </div>

                  <p><strong>Data We Collect:</strong> Name, phone, email, National ID (for verification), location, listings, transactions, payment info (via M-Pesa), device data, usage analytics.</p>
                  
                  <p><strong>How We Use It:</strong> Account management, listings, payments, verification, fraud prevention, platform improvement, personalized recommendations, legal compliance.</p>
                  
                  <p><strong>Data Sharing:</strong> With other users (your public listings), payment processors (M-Pesa), cloud services (AWS, Cloudinary), analytics (Google), law enforcement (when required).</p>
                  
                  <p><strong>Security:</strong> Encryption (TLS/SSL, AES-256), secure password hashing, access controls, regular security audits, incident response protocols.</p>
                  
                  <p><strong>Retention:</strong> Account data for 7 years after closure (legal requirement), transactions 7 years (KRA), communications 2 years.</p>
                  
                  <p><strong>Your Control:</strong> Update profile anytime, delete account (we retain some data as required by law), opt out of marketing, manage cookie preferences.</p>

                  <div className="mt-4 p-3 bg-gray-50 rounded border">
                    <Link to="/legal/privacy" target="_blank" className="text-green-600 hover:text-green-700 font-semibold text-sm">
                      📄 Read Full Privacy Policy (opens in new tab) →
                    </Link>
                  </div>
                </div>
                
                {!hasScrolledPrivacy && (
                  <div className="sticky bottom-0 bg-gradient-to-t from-white via-white pt-4 text-center">
                    <p className="text-xs text-gray-500">↓ Scroll to bottom to enable acceptance ↓</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Consent Checkboxes */}
          <div className="space-y-3 pt-4 border-t">
            <h3 className="font-semibold text-gray-900 mb-3">Required Consents</h3>
            
            {/* Terms of Service */}
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                disabled={!hasScrolledTerms && showTerms}
                className="mt-1 w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <span className="text-sm text-gray-700 group-hover:text-gray-900">
                <span className="text-red-600 font-bold">*</span> I have read and agree to the{' '}
                <Link to="/legal/terms" target="_blank" className="text-green-600 hover:text-green-700 font-semibold underline">
                  Terms of Service
                </Link>
                {!hasScrolledTerms && showTerms && <span className="text-red-600 text-xs ml-2">(Scroll to bottom first)</span>}
              </span>
            </label>

            {/* Privacy Policy */}
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={privacyAccepted}
                onChange={(e) => setPrivacyAccepted(e.target.checked)}
                disabled={!hasScrolledPrivacy && showPrivacy}
                className="mt-1 w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <span className="text-sm text-gray-700 group-hover:text-gray-900">
                <span className="text-red-600 font-bold">*</span> I have read and agree to the{' '}
                <Link to="/legal/privacy" target="_blank" className="text-green-600 hover:text-green-700 font-semibold underline">
                  Privacy Policy
                </Link>
                {!hasScrolledPrivacy && showPrivacy && <span className="text-red-600 text-xs ml-2">(Scroll to bottom first)</span>}
              </span>
            </label>

            {/* Data Processing Consent */}
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={dataProcessingConsent}
                onChange={(e) => setDataProcessingConsent(e.target.checked)}
                className="mt-1 w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
              />
              <span className="text-sm text-gray-700 group-hover:text-gray-900">
                <span className="text-red-600 font-bold">*</span> I consent to the processing of my personal data as described in the Privacy Policy, including for account management, listings, payments, verification, and platform improvement (as required by the Data Protection Act, 2019)
              </span>
            </label>

            {/* Optional Marketing Consent */}
            <div className="pt-3 border-t">
              <h4 className="font-semibold text-gray-900 mb-2 text-sm">Optional Consent</h4>
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={marketingConsent}
                  onChange={(e) => setMarketingConsent(e.target.checked)}
                  className="mt-1 w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
                <span className="text-sm text-gray-700 group-hover:text-gray-900">
                  I agree to receive marketing communications, promotional offers, and newsletters from Mamamboga Digital (you can unsubscribe anytime)
                </span>
              </label>
            </div>
          </div>

          {/* Contact Info */}
          <div className="bg-gray-50 rounded-lg p-4 text-xs text-gray-600">
            <p className="font-semibold text-gray-900 mb-2">Questions or Concerns?</p>
            <p>Contact Email: <a href="mailto:kodisha.254.ke@gmail.com" className="text-green-600 hover:underline">kodisha.254.ke@gmail.com</a></p>
            <p className="mt-2">Office of the Data Protection Commissioner: <a href="https://www.odpc.go.ke" target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline">www.odpc.go.ke</a></p>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t bg-gray-50 px-6 py-4 flex items-center justify-between gap-4">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!allRequiredAccepted || loading}
            className="px-8 py-2.5 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating Account...
              </>
            ) : (
              <>
                ✓ I Agree - Create Account
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LegalAcceptanceModal;
