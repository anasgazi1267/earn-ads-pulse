
import React, { createContext, useContext, useState, useEffect } from 'react';
import { dbService } from '../services/database';

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
  channelVerificationEnabled: string;
}

interface AdminContextType {
  settings: AdminSettings;
  updateSettings: (newSettings: Partial<AdminSettings>) => Promise<void>;
  isChannelVerificationEnabled: boolean;
  setChannelVerificationEnabled: (enabled: boolean) => Promise<void>;
  loading: boolean;
}

const defaultSettings: AdminSettings = {
  adRewardRate: '0.050',
  referralRate: '10',
  minWithdrawal: '1.0',
  dailyAdLimit: '30',
  dailySpinLimit: '30',
  spinWinPercentage: '15',
  htmlAdCode: '',
  requiredReferrals: '5',
  monetagBannerCode: '',
  channelVerificationEnabled: 'true'
};

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AdminSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  const mapDbSettingsToState = (dbSettings: Record<string, string>): AdminSettings => ({
    adRewardRate: dbSettings.ad_reward_rate || defaultSettings.adRewardRate,
    referralRate: dbSettings.referral_rate || defaultSettings.referralRate,
    minWithdrawal: dbSettings.min_withdrawal || defaultSettings.minWithdrawal,
    dailyAdLimit: dbSettings.daily_ad_limit || defaultSettings.dailyAdLimit,
    dailySpinLimit: dbSettings.daily_spin_limit || defaultSettings.dailySpinLimit,
    spinWinPercentage: dbSettings.spin_win_percentage || defaultSettings.spinWinPercentage,
    htmlAdCode: dbSettings.html_ad_code || defaultSettings.htmlAdCode,
    requiredReferrals: dbSettings.required_referrals || defaultSettings.requiredReferrals,
    monetagBannerCode: dbSettings.monetag_banner_code || defaultSettings.monetagBannerCode,
    channelVerificationEnabled: dbSettings.channel_verification_enabled || defaultSettings.channelVerificationEnabled
  });

  useEffect(() => {
    loadSettings();
    
    // Subscribe to real-time changes
    const unsubscribe = dbService.subscribeToAdminSettings((dbSettings) => {
      const mappedSettings = mapDbSettingsToState(dbSettings);
      setSettings(mappedSettings);
      
      // Dispatch custom event for backward compatibility
      window.dispatchEvent(new CustomEvent('adminSettingsUpdated', { 
        detail: mappedSettings 
      }));
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const loadSettings = async () => {
    try {
      const dbSettings = await dbService.getAdminSettings();
      const mappedSettings = mapDbSettingsToState(dbSettings);
      setSettings(mappedSettings);
    } catch (error) {
      console.error('Error loading admin settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (newSettings: Partial<AdminSettings>) => {
    try {
      const dbKeyMap: Record<keyof AdminSettings, string> = {
        adRewardRate: 'ad_reward_rate',
        referralRate: 'referral_rate',
        minWithdrawal: 'min_withdrawal',
        dailyAdLimit: 'daily_ad_limit',
        dailySpinLimit: 'daily_spin_limit',
        spinWinPercentage: 'spin_win_percentage',
        htmlAdCode: 'html_ad_code',
        requiredReferrals: 'required_referrals',
        monetagBannerCode: 'monetag_banner_code',
        channelVerificationEnabled: 'channel_verification_enabled'
      };

      // Update settings in database
      for (const [key, value] of Object.entries(newSettings)) {
        const dbKey = dbKeyMap[key as keyof AdminSettings];
        if (dbKey && value !== undefined) {
          await dbService.updateAdminSetting(dbKey, value);
        }
      }

      // Update local state
      const updatedSettings = { ...settings, ...newSettings };
      setSettings(updatedSettings);
      
      // Dispatch custom event for real-time updates
      window.dispatchEvent(new CustomEvent('adminSettingsUpdated', { 
        detail: updatedSettings 
      }));
    } catch (error) {
      console.error('Error updating admin settings:', error);
    }
  };

  const setChannelVerificationEnabled = async (enabled: boolean) => {
    await updateSettings({ channelVerificationEnabled: enabled.toString() });
  };

  const isChannelVerificationEnabled = settings.channelVerificationEnabled === 'true';

  return (
    <AdminContext.Provider value={{
      settings,
      updateSettings,
      isChannelVerificationEnabled,
      setChannelVerificationEnabled,
      loading
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
