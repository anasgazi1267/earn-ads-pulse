import React, { useState, useEffect } from 'react';
import { X, Gift } from 'lucide-react';
import { dbService } from '@/services/database';
import { toast } from '@/hooks/use-toast';

declare global {
  interface Window {
    Adsgram?: {
      init: (config: any) => any;
    };
  }
}

interface AutomaticAdOverlayProps {
  userInfo: any;
  onBalanceUpdate: () => void;
}

const AutomaticAdOverlay = ({ userInfo, onBalanceUpdate }: AutomaticAdOverlayProps) => {
  const [showAd, setShowAd] = useState(false);
  const [isMonetag, setIsMonetag] = useState(false);
  const [adInterval, setAdInterval] = useState(20);
  const [adHtml, setAdHtml] = useState('');
  const [adsgramReady, setAdsgramReady] = useState(false);

  useEffect(() => {
    loadAdSettings();
    
    // Check if Adsgram is available
    if (window.Adsgram) {
      setAdsgramReady(true);
    }
  }, []);

  const loadAdSettings = async () => {
    try {
      const settings = await dbService.getAdminSettings();
      const interval = parseInt(settings.ad_interval_seconds || '20');
      setAdInterval(interval);
      setAdHtml(settings.popup_ad_code || '');
    } catch (error) {
      console.error('Error loading ad settings:', error);
    }
  };

  useEffect(() => {
    if (!userInfo?.telegram_id) return;

    const timer = setInterval(() => {
      showRandomAd();
    }, adInterval * 1000);

    return () => clearInterval(timer);
  }, [userInfo, adInterval]);

  const showRandomAd = () => {
    // Alternate between Monetag and Adsgram
    const useMonetag = Math.random() < 0.5;
    setIsMonetag(useMonetag);
    setShowAd(true);
  };

  const handleAdsgramClick = () => {
    if (!window.Adsgram || !adsgramReady) {
      toast({
        title: "Error",
        description: "Adsgram not available",
        variant: "destructive"
      });
      return;
    }

    try {
      const AdController = window.Adsgram.init({
        blockId: "int-12841"
      });

      AdController.show().then(async (result: any) => {
        if (result.done) {
          // Reward user
          await rewardUser();
          setShowAd(false);
        } else {
          toast({
            title: "Ad Incomplete",
            description: "Please watch the complete ad to earn reward",
            variant: "destructive"
          });
        }
      }).catch((error: any) => {
        console.error('Adsgram error:', error);
        toast({
          title: "Ad Error",
          description: "Failed to load ad",
          variant: "destructive"
        });
      });
    } catch (error) {
      console.error('Adsgram initialization error:', error);
      toast({
        title: "Error",
        description: "Failed to initialize ad",
        variant: "destructive"
      });
    }
  };

  const handleMonetagClick = async () => {
    // Simulate Monetag ad completion
    setTimeout(async () => {
      await rewardUser();
      setShowAd(false);
    }, 3000);
  };

  const rewardUser = async () => {
    try {
      // Automatic ads don't give earnings - only manual ads do
      console.log('Automatic ad watched - no earnings added');
      
      // Still log the activity for tracking purposes
      await dbService.logActivity(userInfo.telegram_id, 'automatic_ad_watched', 0);
    } catch (error) {
      console.error('Error logging automatic ad view:', error);
    }
  };

  const closeAd = () => {
    setShowAd(false);
  };

  if (!showAd) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl border border-gray-600 max-w-md w-full p-6 relative">
        <button
          onClick={closeAd}
          className="absolute top-3 right-3 text-gray-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <Gift className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-white mb-2">
            {isMonetag ? 'Monetag' : 'Adsgram'} Advertisement
          </h2>
          <p className="text-gray-300 text-sm">
            Watch this ad to earn $0.001 USDT
          </p>
        </div>

        <div className="bg-gray-700 rounded-lg p-4 mb-6 min-h-[200px] flex items-center justify-center">
          {isMonetag ? (
            <div className="text-center">
              {adHtml ? (
                <div dangerouslySetInnerHTML={{ __html: adHtml }} />
              ) : (
                <div className="text-white">
                  <div className="animate-pulse bg-gray-600 h-32 w-full rounded mb-4"></div>
                  <p className="text-sm">Monetag Advertisement</p>
                  <p className="text-xs text-gray-400">Loading...</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center">
              <div className="animate-pulse bg-gray-600 h-32 w-full rounded mb-4"></div>
              <p className="text-white text-sm">Adsgram Advertisement</p>
              <p className="text-xs text-gray-400">Click to start</p>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <button
            onClick={isMonetag ? handleMonetagClick : handleAdsgramClick}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg font-medium transition-colors"
          >
            {isMonetag ? 'Watch Monetag Ad' : 'Watch Adsgram Ad'}
          </button>
          
          <button
            onClick={closeAd}
            className="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg text-sm transition-colors"
          >
            Skip (No Reward)
          </button>
        </div>

        <div className="mt-4 text-center">
          <p className="text-xs text-gray-400">
            Ads appear every {adInterval} seconds automatically
          </p>
        </div>
      </div>
    </div>
  );
};

export default AutomaticAdOverlay;