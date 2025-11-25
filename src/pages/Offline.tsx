import React, { useEffect, useState } from 'react';

const Offline: React.FC = () => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Optionally redirect after a delay
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);
    };

    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full text-center">
          <div className="text-6xl mb-4">✅</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">You're Back Online!</h1>
          <p className="text-gray-600">Redirecting you back to the app...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full text-center">
        <div className="text-6xl mb-4">📡</div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">You're Offline</h1>
        <p className="text-gray-600 mb-4">
          It looks like you've lost your internet connection. Some features may not work properly until you're back online.
        </p>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
          <p className="font-semibold mb-1">Tips:</p>
          <ul className="text-left list-disc list-inside space-y-1">
            <li>Check your WiFi or mobile data</li>
            <li>Try moving closer to your router</li>
            <li>Restart your device</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Offline;
