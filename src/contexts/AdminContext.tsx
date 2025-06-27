
import React, { createContext, useContext, useState, useEffect } from 'react';

interface AdminSettings {
  adRewardRate: string;
  referralRate: string;
  minWithdrawal: string;
  dailyAdLimit: string;
  dailySpinLimit: string;
  spinWinPercentage: string;
  htmlAdCode: string;
  requiredReferrals: string;
  monetagBannerCode: string;
}

interface AdminContextType {
  settings: AdminSettings;
  updateSettings: (newSettings: Partial<AdminSettings>) => void;
  isChannelVerificationEnabled: boolean;
  setChannelVerificationEnabled: (enabled: boolean) => void;
}

const defaultSettings: AdminSettings = {
  adRewardRate: '0.05',
  referralRate: '10',
  minWithdrawal: '1.0',
  dailyAdLimit: '30',
  dailySpinLimit: '30',
  spinWinPercentage: '15',
  htmlAdCode: '',
  requiredReferrals: '5',
  monetagBannerCode: ''
};

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AdminSettings>(defaultSettings);
  const [isChannelVerificationEnabled, setChannelVerificationEnabled] = useState(true);

  useEffect(() => {
    // Load settings from localStorage
    const storedSettings = localStorage.getItem('adminSettings');
    if (storedSettings) {
      setSettings(JSON.parse(storedSettings));
    }

    // Check channel verification status
    const channelVerification = localStorage.getItem('channelVerificationEnabled');
    if (channelVerification !== null) {
      setChannelVerificationEnabled(JSON.parse(channelVerification));
    }
  }, []);

  const updateSettings = (newSettings: Partial<AdminSettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    localStorage.setItem('adminSettings', JSON.stringify(updatedSettings));
    
    // Dispatch custom event for real-time updates
    window.dispatchEvent(new CustomEvent('adminSettingsUpdated', { 
      detail: updatedSettings 
    }));
  };

  return (
    <AdminContext.Provider value={{
      settings,
      updateSettings,
      isChannelVerificationEnabled,
      setChannelVerificationEnabled
    }}>
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within AdminProvider');
  }
  return context;
};
