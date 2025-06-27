
import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAdmin } from '../contexts/AdminContext';
import HomePage from '../components/HomePage';
import AdViewerPage from '../components/AdViewerPage';
import SpinPage from '../components/SpinPage';
import ReferralPage from '../components/ReferralPage';
import WithdrawPage from '../components/WithdrawPage';
import JoinChannelsPage from '../components/JoinChannelsPage';
import BottomNavigation from '../components/BottomNavigation';
import { Toaster } from '@/components/ui/toaster';

// Telegram WebApp interface
declare global {
  interface Window {
    Telegram: {
      WebApp: any;
    };
  }
}

const Index = () => {
  const [hasJoinedChannels, setHasJoinedChannels] = useState<boolean>(false);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [referralCount, setReferralCount] = useState(0);
  const [withdrawalEnabled, setWithdrawalEnabled] = useState(false);
  const { isChannelVerificationEnabled } = useAdmin();

  const requiredChannels = [
    'https://t.me/AnasEarnHunter',
    'https://t.me/ExpossDark', 
    'https://t.me/TechnicalAnas',
    'https://t.me/Anas_Promotion'
  ];

  useEffect(() => {
    // Initialize Telegram Web App
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.ready();
      tg.expand();
      
      // Get user info
      const user = tg.initDataUnsafe?.user;
      if (user) {
        setUserInfo(user);
      }
    }
    
    // Check if channels are joined (strict verification)
    const channelsJoined = localStorage.getItem('channelsJoined');
    const joinDate = localStorage.getItem('channelJoinDate');
    
    // Only allow access if channels were joined and it's not too old (prevent bypassing)
    const isValidJoin = channelsJoined === 'true' && joinDate && 
      (Date.now() - new Date(joinDate).getTime()) < 7 * 24 * 60 * 60 * 1000; // 7 days validity
    
    setHasJoinedChannels(isValidJoin && !isChannelVerificationEnabled);
    
    // Check referral count for withdrawal eligibility
    const storedReferrals = localStorage.getItem('referralCount');
    const referrals = parseInt(storedReferrals || '0');
    setReferralCount(referrals);
    setWithdrawalEnabled(referrals >= 5);
    
    setIsLoading(false);
  }, [isChannelVerificationEnabled]);

  const handleChannelJoined = () => {
    setHasJoinedChannels(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500 mx-auto mb-6"></div>
          <h2 className="text-2xl font-bold text-white mb-2">Loading Ads by USDT Earn</h2>
          <p className="text-gray-300">Preparing your earning dashboard...</p>
        </div>
      </div>
    );
  }

  // Always show channel join page if verification is enabled or channels not joined
  if (isChannelVerificationEnabled || !hasJoinedChannels) {
    return (
      <JoinChannelsPage 
        channels={requiredChannels}
        onChannelsJoined={handleChannelJoined}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="pb-20">
        <Routes>
          <Route path="/" element={<HomePage userInfo={userInfo} referralCount={referralCount} />} />
          <Route path="/ads" element={<AdViewerPage />} />
          <Route path="/spin" element={<SpinPage />} />
          <Route path="/referral" element={<ReferralPage userInfo={userInfo} />} />
          <Route path="/withdraw" element={<WithdrawPage withdrawalEnabled={withdrawalEnabled} referralCount={referralCount} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      <BottomNavigation />
      <Toaster />
    </div>
  );
};

export default Index;
