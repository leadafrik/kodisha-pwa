import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext'; // We'll use this to get current user
import { useCallback } from 'react';

interface VerificationContextType {
  verificationStatus: any;
  refreshVerification: () => void;
  requiresVerification: (type: string) => boolean;
  showVerificationModal: boolean;
  setShowVerificationModal: (show: boolean) => void;
}

const VerificationContext = createContext<VerificationContextType | undefined>(undefined);

export const VerificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [verificationStatus, setVerificationStatus] = useState<any>(null);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const { user } = useAuth(); // Get current user from auth context

  const refreshVerification = useCallback(async () => {
    // For now, set basic status
    // Later we'll fetch from API
    setVerificationStatus({
      phoneVerified: user?.verification?.phoneVerified || false,
      emailVerified: user?.verification?.emailVerified || false,
      idVerified: user?.verification?.idVerified || false,
      businessVerified: user?.verification?.businessVerified || false,
      trustScore: user?.verification?.trustScore || 0,
      verificationLevel: user?.verification?.verificationLevel || 'basic'
    });

    // Show verification modal if user is logged in but not phone/email verified
    if (user && !user.verification?.phoneVerified && !user.verification?.emailVerified) {
      setShowVerificationModal(true);
    }
  }, [user]);

  const requiresVerification = (type: string): boolean => {
    if (!verificationStatus) return false;

    switch (type) {
      case 'land-listing':
        return !verificationStatus.phoneVerified && !verificationStatus.emailVerified;
      case 'equipment-listing':
        return !verificationStatus.phoneVerified && !verificationStatus.emailVerified;
      case 'agrovet-listing':
        return (!verificationStatus.phoneVerified && !verificationStatus.emailVerified) || !verificationStatus.businessVerified;
      default:
        return false;
    }
  };

  useEffect(() => {
    refreshVerification();
  }, [refreshVerification]); // Refresh when user changes

  return (
    <VerificationContext.Provider value={{
      verificationStatus,
      refreshVerification,
      requiresVerification,
      showVerificationModal,
      setShowVerificationModal
    }}>
      {children}
    </VerificationContext.Provider>
  );
};

export const useVerification = () => {
  const context = useContext(VerificationContext);
  if (context === undefined) {
    throw new Error('useVerification must be used within a VerificationProvider');
  }
  return context;
};
