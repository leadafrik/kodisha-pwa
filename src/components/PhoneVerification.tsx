import React, { useState, useEffect } from 'react';
import { API_ENDPOINTS, apiRequest } from '../config/api';

interface PhoneVerificationProps {
  onVerificationComplete: (user: any) => void;
  initialPhone?: string;
}

const PhoneVerification: React.FC<PhoneVerificationProps> = ({ 
  onVerificationComplete, 
  initialPhone = '' 
}) => {
  const [step, setStep] = useState<'enter-phone' | 'enter-code'>('enter-phone');
  const [phone, setPhone] = useState(initialPhone);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(0);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleSendCode = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await apiRequest(API_ENDPOINTS.verification.send, {
        method: 'POST',
        body: JSON.stringify({ phone })
      });

      if (response.success) {
        setStep('enter-code');
        setCountdown(60); // 60 seconds countdown
      } else {
        setError(response.message || 'Failed to send verification code');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await apiRequest(API_ENDPOINTS.verification.verify, {
        method: 'POST',
        body: JSON.stringify({ phone, code })
      });

      if (response.success) {
        onVerificationComplete(response.user);
      } else {
        setError(response.message || 'Invalid verification code');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (countdown > 0) return;
    
    setLoading(true);
    setError('');

    try {
      const response = await apiRequest(API_ENDPOINTS.verification.send, {
        method: 'POST',
        body: JSON.stringify({ phone })
      });

      if (response.success) {
        setCountdown(60);
        setError(''); // Clear any previous errors
      } else {
        setError(response.message || 'Failed to resend code');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
        Verify Your Phone
      </h2>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {step === 'enter-phone' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="07XX XXX XXX or +2547XX XXX XXX"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            <p className="text-sm text-gray-500 mt-1">
              We'll send a verification code via SMS
            </p>
          </div>

          <button
            onClick={handleSendCode}
            disabled={loading || !phone}
            className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition duration-300"
          >
            {loading ? 'Sending...' : 'Send Verification Code'}
          </button>
        </div>
      )}

      {step === 'enter-code' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Enter Verification Code
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              maxLength={6}
              className="w-full p-3 border border-gray-300 rounded-lg text-center text-xl font-mono focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            <p className="text-sm text-gray-500 mt-1">
              Enter the 6-digit code sent to {phone}
            </p>
          </div>

          <button
            onClick={handleVerifyCode}
            disabled={loading || code.length !== 6}
            className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition duration-300"
          >
            {loading ? 'Verifying...' : 'Verify Code'}
          </button>

          <div className="text-center">
            <button
              onClick={handleResendCode}
              disabled={countdown > 0 || loading}
              className="text-green-600 hover:text-green-800 disabled:text-gray-400"
            >
              {countdown > 0 ? `Resend code in ${countdown}s` : 'Resend code'}
            </button>
          </div>

          <button
            onClick={() => setStep('enter-phone')}
            className="w-full text-gray-600 py-2 rounded-lg border border-gray-300 hover:border-gray-400 transition duration-300"
          >
            Change Phone Number
          </button>
        </div>
      )}
    </div>
  );
};

export default PhoneVerification;