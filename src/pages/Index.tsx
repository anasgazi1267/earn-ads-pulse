
import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAdmin } from '../contexts/AdminContext';
import { dbService } from '../services/database';
import HomePage from '../components/HomePage';
import AdViewerPage from '../components/AdViewerPage';
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
  const [userBalance, setUserBalance] = useState(0);
  const { isChannelVerificationEnabled, loading: adminLoading } = useAdmin();

  const requiredChannels = [
    'https://t.me/AnasEarnHunter',
    'https://t.me/ExpossDark', 
    'https://t.me/TechnicalAnas',
    'https://t.me/Anas_Promotion'
  ];

  useEffect(() => {
    initializeApp();
  }, [isChannelVerificationEnabled, adminLoading]);

  const initializeApp = async () => {
    if (adminLoading) return;

    try {
      // Initialize Telegram Web App
      let telegramUser = null;
      if (window.Telegram?.WebApp) {
        const tg = window.Telegram.WebApp;
        tg.ready();
        tg.expand();
        
        // Get user info from Telegram
        telegramUser = tg.initDataUnsafe?.user;
        if (telegramUser) {
          setUserInfo(telegramUser);
          
          // Extract referral from start param
          const startParam = tg.initDataUnsafe?.start_param;
          let referredBy = null;
          if (startParam && startParam.startsWith('ref_')) {
            referredBy = startParam.substring(4);
          }
          
          // Create or update user in database
          await dbService.createOrUpdateUser(telegramUser, referredBy);
          
          // Get user data from database
          const dbUser = await dbService.getUserByTelegramId(telegramUser.id.toString());
          if (dbUser) {
            setUserBalance(dbUser.balance);
            setReferralCount(dbUser.referral_count);
            setHasJoinedChannels(dbUser.channels_joined || !isChannelVerificationEnabled);
            setWithdrawalEnabled(dbUser.referral_count >= 5);
            
            // Handle referral logic
            if (referredBy && !dbUser.referred_by) {
              await dbService.createReferral(referredBy, telegramUser.id.toString());
              // Update referrer's referral count
              // This would be handled by a database trigger or function in production
            }
          }
        }
      }
      
      // Fallback for testing without Telegram
      if (!telegramUser) {
        const testUser = {
          id: 12345,
          username: 'testuser',
          first_name: 'Test',
          last_name: 'User'
        };
        setUserInfo(testUser);
        
        // Create test user in database
        await dbService.createOrUpdateUser(testUser);
        const dbUser = await dbService.getUserByTelegramId(testUser.id.toString());
        if (dbUser) {
          setUserBalance(dbUser.balance);
          setReferralCount(dbUser.referral_count);
          setHasJoinedChannels(dbUser.channels_joined || !isChannelVerificationEnabled);
          setWithdrawalEnabled(dbUser.referral_count >= 5);
        }
      }
    } catch (error) {
      console.error('Error initializing app:', error);
    }
    
    setIsLoading(false);
  };

  const handleChannelJoined = async () => {
    if (userInfo) {
      const success = await dbService.updateChannelJoinStatus(userInfo.id.toString(), true);
      if (success) {
        setHasJoinedChannels(true);
      }
    }
  };

  const updateUserBalance = (newBalance: number) => {
    setUserBalance(newBalance);
    if (userInfo) {
      dbService.updateUserBalance(userInfo.id.toString(), newBalance);
    }
  };

  if (isLoading || adminLoading) {
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

  // Show channel join page if verification is enabled and channels not joined
  if (isChannelVerificationEnabled && !hasJoinedChannels) {
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
          <Route path="/" element={
            <HomePage 
              userInfo={userInfo} 
              referralCount={referralCount}
              userBalance={userBalance}
              updateUserBalance={updateUserBalance}
            />
          } />
          <Route path="/ads" element={
            <AdViewerPage 
              userInfo={userInfo}
              userBalance={userBalance}
              updateUserBalance={updateUserBalance}
            />
          } />
          <Route path="/referral" element={
            <ReferralPage 
              userInfo={userInfo} 
              referralCount={referralCount}
            />
          } />
          <Route path="/withdraw" element={
            <WithdrawPage 
              withdrawalEnabled={withdrawalEnabled} 
              referralCount={referralCount}
              userBalance={userBalance}
              userInfo={userInfo}
            />
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      <BottomNavigation />
      <Toaster />
    </div>
  );
};

export default Index;
