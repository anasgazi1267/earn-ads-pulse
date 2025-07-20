
import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAdmin } from '../contexts/AdminContext';
import { dbService } from '../services/database';
import { channelService } from '../services/channelService';
import HomePage from '../components/HomePage';
import AdViewerPage from '../components/AdViewerPage';
import ReferralPage from '../components/ReferralPage';
import WithdrawPage from '../components/WithdrawPage';
import JoinChannelsPage from '../components/JoinChannelsPage';
import TasksPage from '../components/TasksPage';
import DepositPage from '../components/DepositPage';
import UserTaskUploadPage from '../components/UserTaskUploadPage';
import AutomaticAdOverlay from '../components/AutomaticAdOverlay';
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
  const [adsWatched, setAdsWatched] = useState(0);
  const [showAutoAd, setShowAutoAd] = useState(false);
  const { isChannelVerificationEnabled, loading: adminLoading } = useAdmin();

  useEffect(() => {
    initializeApp();
  }, [isChannelVerificationEnabled, adminLoading]);

  // Subscribe to real-time balance updates
  useEffect(() => {
    if (userInfo?.id) {
      console.log('Setting up real-time balance subscription for user:', userInfo.id);
      const unsubscribe = dbService.subscribeToUserBalance(
        userInfo.id.toString(),
        (newBalance) => {
          console.log('Received real-time balance update:', newBalance);
          setUserBalance(newBalance);
        }
      );

      return () => {
        console.log('Cleaning up balance subscription');
        unsubscribe();
      };
    }
  }, [userInfo?.id]);

  const extractReferralFromTelegram = () => {
    let referredBy = null;
    
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      
      // Method 1: Check start_param from initDataUnsafe
      const startParam = tg.initDataUnsafe?.start_param;
      console.log('🔍 Telegram start_param:', startParam);
      
      if (startParam) {
        // Handle different referral formats
        if (startParam.startsWith('ref_')) {
          referredBy = startParam.substring(4);
          console.log('✅ Found referral (ref_ format):', referredBy);
        } else if (startParam.startsWith('r_')) {
          referredBy = startParam.substring(2);
          console.log('✅ Found referral (r_ format):', referredBy);
        } else if (startParam.match(/^\d+$/)) {
          referredBy = startParam;
          console.log('✅ Found referral (direct ID):', referredBy);
        } else {
          referredBy = startParam;
          console.log('✅ Found referral (custom format):', referredBy);
        }
      }

      // Method 2: Check URL hash for backup
      if (!referredBy && window.location.hash) {
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const refFromHash = hashParams.get('tgWebAppStartParam');
        if (refFromHash && refFromHash.startsWith('ref_')) {
          referredBy = refFromHash.substring(4);
          console.log('✅ Found referral from hash:', referredBy);
        }
      }

      // Method 3: Check initData directly
      if (!referredBy && tg.initData) {
        try {
          const params = new URLSearchParams(tg.initData);
          const startParamFromInitData = params.get('start_param');
          if (startParamFromInitData && startParamFromInitData.startsWith('ref_')) {
            referredBy = startParamFromInitData.substring(4);
            console.log('✅ Found referral from initData:', referredBy);
          }
        } catch (error) {
          console.log('Error parsing initData:', error);
        }
      }
    }

    // Fallback for testing/development
    if (!referredBy) {
      const urlParams = new URLSearchParams(window.location.search);
      const refParam = urlParams.get('ref') || urlParams.get('start') || urlParams.get('referral');
      if (refParam) {
        referredBy = refParam.startsWith('ref_') ? refParam.substring(4) : refParam;
        console.log('✅ Found referral from URL params:', referredBy);
      }
    }

    return referredBy;
  };

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
        console.log('📱 Telegram user data:', telegramUser);
        console.log('📱 Full Telegram WebApp data:', tg.initDataUnsafe);
      }
      
      // Extract referral information
      const referredBy = extractReferralFromTelegram();
      console.log('🎯 Final referral detected:', referredBy);
      
      // Fallback for testing without Telegram (development mode)
      if (!telegramUser) {
        console.log('🧪 No Telegram user found, using test user');
        const testUserId = Math.floor(Math.random() * 1000000);
        telegramUser = {
          id: testUserId,
          username: 'testuser' + Math.floor(Math.random() * 1000),
          first_name: 'Test',
          last_name: 'User'
        };
      }
      
      if (telegramUser) {
        setUserInfo(telegramUser);
        
        // Create or update user in database with referral handling
        console.log('💾 Creating/updating user with referral:', { 
          userId: telegramUser.id, 
          referredBy: referredBy 
        });
        
        const dbUser = await dbService.createOrUpdateUser(telegramUser, referredBy);
        
        if (dbUser) {
          console.log('✅ Database user data:', dbUser);
          setUserBalance(dbUser.balance);
          setReferralCount(dbUser.referral_count || 0);
          setAdsWatched(dbUser.ads_watched_today || 0);
          
          // Check if channel verification is required
          if (isChannelVerificationEnabled) {
            setHasJoinedChannels(dbUser.channels_joined || false);
          } else {
            setHasJoinedChannels(true); // Skip channel verification
          }
          
          setWithdrawalEnabled((dbUser.referral_count || 0) >= 5);
          
          console.log('📊 User state updated:', {
            balance: dbUser.balance,
            referralCount: dbUser.referral_count,
            adsWatched: dbUser.ads_watched_today,
            hasJoinedChannels: dbUser.channels_joined,
            isChannelVerificationEnabled
          });
        }
      }
    } catch (error) {
      console.error('❌ Error initializing app:', error);
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

  const updateUserBalance = async (newBalance: number) => {
    console.log('Updating user balance:', newBalance);
    setUserBalance(newBalance);
    if (userInfo) {
      await dbService.updateUserBalance(userInfo.id.toString(), newBalance);
    }
  };

  const updateAdsWatched = (newCount: number) => {
    console.log('Updating ads watched count:', newCount);
    setAdsWatched(newCount);
  };

  // Function to refresh referral count
  const refreshReferralCount = async () => {
    if (userInfo) {
      console.log('Refreshing referral count for user:', userInfo.id);
      const user = await dbService.getUserByTelegramId(userInfo.id.toString());
      if (user) {
        console.log('Updated referral count:', user.referral_count);
        setReferralCount(user.referral_count || 0);
        setWithdrawalEnabled((user.referral_count || 0) >= 5);
      }
    }
  };

  // Refresh referral count when user info changes
  useEffect(() => {
    if (userInfo && !isLoading) {
      refreshReferralCount();
    }
  }, [userInfo, isLoading]);

  // Automatic ad system - shows every 25 seconds
  useEffect(() => {
    if (!isLoading && userInfo && hasJoinedChannels) {
      const adInterval = setInterval(() => {
        setShowAutoAd(true);
      }, 25000); // 25 seconds

      return () => clearInterval(adInterval);
    }
  }, [isLoading, userInfo, hasJoinedChannels]);

  const handleAutoAdComplete = async () => {
    setShowAutoAd(false);
    if (userInfo) {
      const newBalance = userBalance + 0.001;
      await updateUserBalance(newBalance);
      updateAdsWatched(adsWatched + 1);
      
      // Update database
      await dbService.incrementUserAdsWatched(userInfo.id.toString());
      await dbService.logActivity(userInfo.id.toString(), 'ad_watched', 0.001);
    }
  };

  if (isLoading || adminLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500 mx-auto mb-6"></div>
          <h2 className="text-2xl font-bold text-white mb-2">Loading Ads by USDT Earn</h2>
          <p className="text-gray-300">Preparing your earning dashboard...</p>
          <div className="mt-4 bg-blue-600/20 border border-blue-500/30 rounded-lg p-3">
            <p className="text-blue-300 text-sm">🚀 Auto-login via Telegram Mini App</p>
          </div>
        </div>
      </div>
    );
  }

  // Show channel join page if verification is enabled and channels not joined
  if (isChannelVerificationEnabled && !hasJoinedChannels) {
    return (
      <JoinChannelsPage 
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
              adsWatched={adsWatched}
              updateUserBalance={updateUserBalance}
            />
          } />
          <Route path="/ads" element={
            <AdViewerPage 
              userInfo={userInfo}
              userBalance={userBalance}
              updateUserBalance={updateUserBalance}
              updateAdsWatched={updateAdsWatched}
            />
          } />
          <Route path="/tasks" element={
            <TasksPage 
              userInfo={userInfo}
              userBalance={userBalance}
              updateUserBalance={updateUserBalance}
            />
          } />
          <Route path="/referral" element={
            <ReferralPage 
              userInfo={userInfo} 
              userBalance={userBalance}
              updateUserBalance={updateUserBalance}
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
          <Route path="/deposit" element={
            <DepositPage 
              userInfo={userInfo}
              onBack={() => window.history.back()}
            />
          } />
          <Route path="/upload-task" element={
            <UserTaskUploadPage 
              userInfo={userInfo}
              onBack={() => window.history.back()}
            />
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      <BottomNavigation />
      <Toaster />
      
      {/* Automatic Ad Overlay */}
      {showAutoAd && (
        <AutomaticAdOverlay onAdComplete={handleAutoAdComplete} />
      )}
    </div>
  );
};

export default Index;
