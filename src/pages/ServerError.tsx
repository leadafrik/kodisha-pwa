import React from 'react';
import { useNavigate } from 'react-router-dom';

const ServerError: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full text-center">
        <div className="text-6xl mb-4">🚨</div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Server Error</h1>
        <p className="text-gray-600 mb-2">Something went wrong on our end.</p>
        <p className="text-gray-600 mb-8">
          Our team has been notified. Please try again in a few moments.
        </p>
        <div className="flex flex-col gap-3">
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-semibold"
          >
            Try Again
          </button>
          <button
            onClick={() => navigate('/')}
            className="bg-gray-200 text-gray-900 px-6 py-3 rounded-lg hover:bg-gray-300 transition font-semibold"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default ServerError;
