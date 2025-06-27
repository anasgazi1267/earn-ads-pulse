
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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
        // Check if user has joined channels (mock for now - would need bot API)
        checkChannelMembership(user.id);
      }
    }
    
    // For development/testing, allow access after 2 seconds
    setTimeout(() => {
      setIsLoading(false);
      // In development, set to true. In production, this would be based on actual channel membership
      setHasJoinedChannels(true);
    }, 2000);
  }, []);

  const checkChannelMembership = async (userId: number) => {
    try {
      // This would typically call your backend/bot API to check channel membership
      // For now, we'll simulate the check
      console.log('Checking channel membership for user:', userId);
      
      // Simulate API call
      const response = await fetch(`/api/check-channels/${userId}`).catch(() => null);
      
      if (response?.ok) {
        const data = await response.json();
        setHasJoinedChannels(data.hasJoined);
      }
    } catch (error) {
      console.error('Error checking channel membership:', error);
    }
  };

  const handleChannelJoined = () => {
    setHasJoinedChannels(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white">Loading Ads by USDT Earn...</p>
        </div>
      </div>
    );
  }

  if (!hasJoinedChannels) {
    return (
      <JoinChannelsPage 
        channels={requiredChannels}
        onChannelsJoined={handleChannelJoined}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Router>
        <div className="pb-20">
          <Routes>
            <Route path="/" element={<HomePage userInfo={userInfo} />} />
            <Route path="/ads" element={<AdViewerPage />} />
            <Route path="/spin" element={<SpinPage />} />
            <Route path="/referral" element={<ReferralPage userInfo={userInfo} />} />
            <Route path="/withdraw" element={<WithdrawPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
        <BottomNavigation />
      </Router>
      <Toaster />
    </div>
  );
};

export default Index;
