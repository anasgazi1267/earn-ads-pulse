import React, { useState, useEffect } from 'react';
import { Toaster } from '@/components/ui/toaster';
import { useAdmin } from '@/contexts/AdminContext';
import { dbService } from '@/services/database';
import NewHomePage from '@/components/NewHomePage';
import TasksPage from '@/components/TasksPage';
import JoinChannelsPage from '@/components/JoinChannelsPage';
import ReferralPage from '@/components/ReferralPage';
import WalletPage from '@/components/WalletPage';
import SpinPage from '@/components/SpinPage';
import AdViewerPage from '@/components/AdViewerPage';
import AdminPanel from '@/components/AdminPanel';
import BottomNavigation from '@/components/BottomNavigation';
import DepositPage from '@/components/DepositPage';
import UserTaskUploadPage from '@/components/UserTaskUploadPage';
import AutomaticAdOverlay from '@/components/AutomaticAdOverlay';
import DeviceTracker from '@/components/DeviceTracker';

// Telegram WebApp interface
declare global {
  interface Window {
    Telegram: {
      WebApp: any;
    };
  }
}

const NewIndexPage = () => {
  const [currentPage, setCurrentPage] = useState('home');
  const [hasJoinedChannels, setHasJoinedChannels] = useState<boolean>(false);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [referralCount, setReferralCount] = useState(0);
  const [withdrawalEnabled, setWithdrawalEnabled] = useState(false);
  const [userBalance, setUserBalance] = useState(0);
  const [adsWatched, setAdsWatched] = useState(0);
  const [isDeviceBlocked, setIsDeviceBlocked] = useState(false);
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

  const loadUserInfo = async () => {
    if (userInfo) {
      const user = await dbService.getUserByTelegramId(userInfo.id.toString());
      if (user) {
        setUserBalance(user.balance || 0);
        setReferralCount(user.referral_count || 0);
        setAdsWatched(user.ads_watched_today || 0);
        setWithdrawalEnabled((user.referral_count || 0) >= 5);
        // Update userInfo with latest data
        setUserInfo({ ...userInfo, ...user });
      }
    }
  };

  const handleDeviceBlocked = () => {
    setIsDeviceBlocked(true);
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

  if (isDeviceBlocked) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl">⚠️</span>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Device Restricted</h2>
          <p className="text-gray-300 mb-4">
            This device is restricted or already registered to another account. 
            Our platform allows only one account per device to ensure fair usage.
          </p>
          <p className="text-gray-400 text-sm">
            If you believe this is an error, please contact support.
          </p>
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

  // Admin access check
  if (currentPage === 'admin') {
    const isAdmin = userInfo?.username === 'zahidulislamnayon' || userInfo?.id?.toString() === '6096745315';
    if (!isAdmin) {
      setCurrentPage('home');
      return null;
    }
  }

  return (
    <>
      <DeviceTracker 
        userInfo={userInfo}
        onDeviceBlocked={handleDeviceBlocked}
      />
      
      <div className="min-h-screen bg-gray-900 text-white">
        {currentPage === 'home' && (
          <NewHomePage 
            userInfo={userInfo}
            referralCount={referralCount}
            userBalance={userBalance}
            adsWatched={adsWatched}
            setCurrentPage={setCurrentPage}
          />
        )}
        {currentPage === 'tasks' && (
          <TasksPage 
            userInfo={userInfo}
            userBalance={userBalance}
            updateUserBalance={loadUserInfo}
            setCurrentPage={setCurrentPage}
          />
        )}
        {currentPage === 'referral' && (
          <ReferralPage 
            userInfo={userInfo}
            userBalance={userBalance}
            updateUserBalance={loadUserInfo}
          />
        )}
        {currentPage === 'wallet' && (
          <WalletPage 
            userInfo={userInfo}
            userBalance={userBalance}
            updateUserBalance={(newBalance: number) => setUserBalance(newBalance)}
            onBack={() => setCurrentPage('home')}
          />
        )}
        {currentPage === 'spin' && (
          <SpinPage />
        )}
        {currentPage === 'ad-viewer' && (
          <AdViewerPage 
            userInfo={userInfo}
            userBalance={userBalance}
            updateUserBalance={loadUserInfo}
            updateAdsWatched={(count: number) => setAdsWatched(count)}
          />
        )}
        {currentPage === 'admin' && <AdminPanel />}
        {currentPage === 'deposit' && (
          <DepositPage 
            userInfo={userInfo}
            onBack={() => setCurrentPage('home')}
          />
        )}
        {currentPage === 'task-upload' && (
          <UserTaskUploadPage 
            userInfo={userInfo}
            onBack={() => setCurrentPage('tasks')} 
          />
        )}

        {/* Automatic Ad Overlay */}
        {userInfo && currentPage !== 'admin' && (
          <AutomaticAdOverlay
            userInfo={userInfo}
            onBalanceUpdate={loadUserInfo}
          />
        )}

        {/* Bottom Navigation */}
        {currentPage !== 'admin' && userInfo && !['deposit', 'task-upload'].includes(currentPage) && (
          <BottomNavigation 
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
          />
        )}
      </div>
      <Toaster />
    </>
  );
};

export default NewIndexPage;