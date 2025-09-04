import React, { useState, useEffect } from 'react';
import { Gift } from 'lucide-react';
import { dbService } from '@/services/database';
import { toast } from '@/hooks/use-toast';

interface AutomaticAdOverlayProps {
  userInfo: any;
  onBalanceUpdate: () => void;
}

const AutomaticAdOverlay = ({ userInfo, onBalanceUpdate }: AutomaticAdOverlayProps) => {
  const [showAd, setShowAd] = useState(false);
  const [adInterval, setAdInterval] = useState(20);
  const [monetagCode, setMonetagCode] = useState('');
  const [dailyAdLimit, setDailyAdLimit] = useState(50);
  const [adsWatchedToday, setAdsWatchedToday] = useState(0);

  useEffect(() => {
    loadAdSettings();
    checkDailyAdCount();
  }, []);

  const loadAdSettings = async () => {
    try {
      const settings = await dbService.getAdminSettings();
      const interval = parseInt(settings.ad_interval_seconds || '20');
      const limit = parseInt(settings.daily_ad_limit || '50');
      setAdInterval(interval);
      setDailyAdLimit(limit);
      setMonetagCode(settings.monetization_code || '');
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

  useEffect(() => {
    if (!userInfo?.telegram_id) return;

    const timer = setInterval(() => {
      showMonetagAd();
    }, adInterval * 1000);

    return () => clearInterval(timer);
  }, [userInfo, adInterval]);

  const showMonetagAd = () => {
    if (!userInfo?.telegram_id) return;
    
    // Check if we're in Telegram WebView environment
    const isTelegramWebView = window.Telegram?.WebApp || 
      window.navigator.userAgent.includes('TelegramBot') ||
      window.location.hostname.includes('telegram') ||
      window.parent !== window;

    if (isTelegramWebView) {
      console.log('🚫 Skipping external ad display in Telegram WebView environment');
      return;
    }
    
    // No daily limit for automatic interstitial ads
    console.log('Showing automatic Monetag interstitial ad');
    
    // Show Monetag interstitial reward ad (not popup)
    setShowAd(true);
    
    // Auto close after 3 seconds (shorter for interstitial)
    setTimeout(async () => {
      await rewardUser();
      setShowAd(false);
    }, 3000);
  };

  const rewardUser = async () => {
    try {
      // Automatic ads don't give earnings - only manual ads do
      console.log('Automatic ad watched - no earnings added');
      
      // Increment ads watched today count
      setAdsWatchedToday(prev => prev + 1);
      
      // Still log the activity for tracking purposes
      await dbService.logActivity(userInfo.telegram_id, 'automatic_ad_watched', 0);
      await dbService.incrementUserAdsWatched(userInfo.telegram_id);
    } catch (error) {
      console.error('Error logging automatic ad view:', error);
    }
  };

  if (!showAd) return null;

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl border border-gray-600 max-w-md w-full p-6">
        <div className="text-center mb-6">
          <Gift className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-white mb-2">
            Monetag বিজ্ঞাপন
          </h2>
          <p className="text-gray-300 text-sm">
            ইন্টারসিয়াল রিওয়ার্ড বিজ্ঞাপন
          </p>
        </div>

        <div className="bg-gray-700 rounded-lg p-4 mb-6 min-h-[200px] flex items-center justify-center">
          <div className="text-center w-full">
            <div className="text-white">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 h-32 w-full rounded mb-4 flex items-center justify-center">
                <div className="text-center">
                  <Gift className="w-12 h-12 text-white mx-auto mb-2" />
                  <p className="text-white font-bold">Ads by USDT Earn</p>
                  <p className="text-xs text-blue-200">Telegram Mini App Ad</p>
                </div>
              </div>
              <p className="text-sm">বিজ্ঞাপন দেখার জন্য ধন্যবাদ!</p>
              <p className="text-xs text-gray-400">টেলিগ্রাম মিনি অ্যাপে নিরাপদ বিজ্ঞাপন</p>
            </div>
          </div>
        </div>

        <div className="text-center">
          <p className="text-xs text-gray-400 mb-2">
            বিজ্ঞাপন ৩ সেকেন্ড পর স্বয়ংক্রিয়ভাবে বন্ধ হবে
          </p>
          <div className="bg-gray-700 rounded-full h-2 mb-4">
            <div 
              className="bg-green-500 h-2 rounded-full transition-all duration-1000"
              style={{ width: '0%', animation: 'progressBar 3s linear forwards' }}
            />
          </div>
        </div>
      </div>
      
      <style>
        {`
          @keyframes progressBar {
            from { width: 0%; }
            to { width: 100%; }
          }
        `}
      </style>
    </div>
  );
};

export default AutomaticAdOverlay;