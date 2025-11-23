import React, { useState, useEffect } from 'react';
import { API_ENDPOINTS, apiRequest } from '../config/api';

const BackendTest: React.FC = () => {
  const [healthStatus, setHealthStatus] = useState<string>('Testing...');
  const [companyInfo, setCompanyInfo] = useState<any>(null);

  useEffect(() => {
    testBackendConnection();
  }, []);

  const testBackendConnection = async () => {
    try {
      // Test health endpoint
      await apiRequest(API_ENDPOINTS.auth.register.replace('/auth/register', '/health'));
      setHealthStatus('Connected to backend');
      
      // Test company endpoint
      const company = await apiRequest(API_ENDPOINTS.auth.register.replace('/auth/register', '/company'));
      setCompanyInfo(company);
    } catch (error) {
      setHealthStatus('Backend connection failed');
      console.error('Backend test failed:', error);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Backend Connection Test</h2>
      <div className="space-y-3">
        <div className="flex items-center">
          <span className="font-semibold mr-2">Status:</span>
          <span className={healthStatus.toLowerCase().includes('connected') ? 'text-green-600' : 'text-red-600'}>
            {healthStatus}
          </span>
        </div>
        
        {companyInfo && (
          <div>
            <span className="font-semibold mr-2">Company:</span>
            <span className="text-gray-700">{companyInfo.name}</span>
          </div>
        )}

        <div className="mt-4">
          <button
            onClick={testBackendConnection}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition duration-300"
          >
            Test Connection Again
          </button>
        </div>
      </div>
    </div>
  );
};

export default BackendTest;
