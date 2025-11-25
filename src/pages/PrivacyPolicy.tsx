import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const PrivacyPolicy: React.FC = () => {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('/legal/PRIVACY_POLICY.md')
      .then(res => res.text())
      .then(text => {
        setContent(text);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load Privacy Policy:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Privacy Policy...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6">
            <button
              onClick={() => navigate(-1)}
              className="text-white hover:text-blue-100 mb-4 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
            <h1 className="text-3xl font-bold text-white">Privacy Policy</h1>
            <p className="text-blue-50 mt-2">Data Protection Act, 2019 (Kenya) Compliant</p>
          </div>

          {/* Content */}
          <div className="px-8 py-8">
            <div className="prose prose-sm max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-strong:text-gray-900 prose-li:text-gray-700">
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">{content}</pre>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-8 py-6 border-t">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-800">
                <strong>Your Rights:</strong> Under the Data Protection Act, 2019, you have the right to access, correct, delete, restrict processing, port your data, object to processing, and not be subject to automated decision-making. You may also lodge a complaint with the Office of the Data Protection Commissioner.
              </p>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-yellow-800">
                <strong>Legal Notice:</strong> This is a draft template and should be reviewed by qualified legal counsel and registered with the Office of the Data Protection Commissioner before implementation.
              </p>
            </div>
            <div className="flex flex-wrap gap-4 text-sm">
              <a href="mailto:dpo@kodisha.co.ke" className="text-blue-600 hover:text-blue-700 font-semibold">
                📧 Data Protection Officer
              </a>
              <a href="mailto:support@kodisha.co.ke" className="text-blue-600 hover:text-blue-700 font-semibold">
                💬 Support
              </a>
              <a href="https://www.odpc.go.ke" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 font-semibold">
                🏛️ Data Protection Commissioner
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
