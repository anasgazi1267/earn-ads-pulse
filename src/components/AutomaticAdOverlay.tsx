import React, { useState, useEffect, useCallback } from 'react';
import { Gift, X } from 'lucide-react';
import { dbService } from '@/services/database';
import { toast } from '@/hooks/use-toast';

// Use the global Window type from AdViewerPage

interface AutomaticAdOverlayProps {
  userInfo: any;
  onBalanceUpdate: () => void;
}

const AutomaticAdOverlay = ({ userInfo, onBalanceUpdate }: AutomaticAdOverlayProps) => {
  const [showFallbackAd, setShowFallbackAd] = useState(false);
  const [adInterval, setAdInterval] = useState(30);
  const [dailyAdLimit, setDailyAdLimit] = useState(50);
  const [adsWatchedToday, setAdsWatchedToday] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    loadAdSettings();
    checkDailyAdCount();
  }, []);

  const loadAdSettings = async () => {
    try {
      const settings = await dbService.getAdminSettings();
      const interval = parseInt(settings.ad_interval_seconds || '30');
      const limit = parseInt(settings.daily_ad_limit || '50');
      setAdInterval(interval);
      setDailyAdLimit(limit);
    } catch (error) {
      console.error('Error loading ad settings:', error);
    }
  };

  const checkDailyAdCount = async () => {
    try {
      if (userInfo?.telegram_id) {
        const count = await dbService.getUserAdsWatchedToday(userInfo.telegram_id);
        setAdsWatchedToday(count);
      }
    } catch (error) {
      console.error('Error checking daily ad count:', error);
    }
  };

  // Initialize Monetag In-App Interstitial
  useEffect(() => {
    if (!userInfo?.telegram_id || isInitialized) return;

    // Check if we're in Telegram WebView environment
    const isTelegramWebView = window.Telegram?.WebApp || 
      window.navigator.userAgent.includes('TelegramBot') ||
      window.location.hostname.includes('telegram');

    if (isTelegramWebView) {
      console.log('🚫 Skipping Monetag In-App ads in Telegram WebView');
      return;
    }

    // Initialize Monetag In-App Interstitial with provided settings
    const initializeMonetagInApp = async () => {
      try {
        if (typeof window.show_9506527 === 'function') {
          console.log('🎬 Initializing Monetag In-App Interstitial...');
          
          // Use In-App Interstitial settings from user's code
          await window.show_9506527({
            type: 'inApp',
            inAppSettings: {
              frequency: 2,      // show 2 ads automatically
              capping: 0.1,     // within 6 minutes (0.1 hours)
              interval: adInterval, // interval between ads
              timeout: 5,       // 5 second delay before first ad
              everyPage: false  // don't reset on page navigation
            }
          });
          
          console.log('✅ Monetag In-App Interstitial initialized');
          setIsInitialized(true);
        } else {
          console.log('⏳ Waiting for Monetag SDK...');
          // Retry after 2 seconds
          setTimeout(initializeMonetagInApp, 2000);
        }
      } catch (error) {
        console.error('Error initializing Monetag In-App:', error);
      }
    };

    // Wait a bit for SDK to load
    setTimeout(initializeMonetagInApp, 3000);
  }, [userInfo, adInterval, isInitialized]);

  // Log automatic ad views (Monetag handles display automatically)
  useEffect(() => {
    if (!userInfo?.telegram_id) return;

    const logInterval = setInterval(async () => {
      try {
        // Just log activity - Monetag handles ad display
        await dbService.logActivity(userInfo.telegram_id, 'automatic_ad_session', 0);
      } catch (error) {
        console.error('Error logging automatic ad session:', error);
      }
    }, adInterval * 1000 * 2); // Log every 2 intervals

    return () => clearInterval(logInterval);
  }, [userInfo, adInterval]);

  // No manual overlay needed - Monetag handles everything
  return null;
};

export default AutomaticAdOverlay;
