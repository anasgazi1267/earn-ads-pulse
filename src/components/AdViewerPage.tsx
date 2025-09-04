
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  Pause, 
  SkipForward, 
  Eye, 
  DollarSign, 
  Clock,
  CheckCircle,
  RefreshCw,
  Gift
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { dbService } from '../services/database';
import HtmlAdDisplay from './HtmlAdDisplay';

interface AdViewerPageProps {
  userInfo: any;
  userBalance: number;
  updateUserBalance: (newBalance: number) => void;
  updateAdsWatched: (newCount: number) => void;
}

const AdViewerPage: React.FC<AdViewerPageProps> = ({ 
  userInfo, 
  userBalance, 
  updateUserBalance,
  updateAdsWatched 
}) => {
  const [isWatching, setIsWatching] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [adsWatchedToday, setAdsWatchedToday] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [canWatch, setCanWatch] = useState(true);
  const [dailyLimit, setDailyLimit] = useState(100);
  const [adReward] = useState(0.001);
  const { toast } = useToast();

  useEffect(() => {
    loadUserData();
    loadAdSettings();
  }, [userInfo]);

  const loadAdSettings = async () => {
    try {
      const settings = await dbService.getAdminSettings();
      const limit = parseInt(settings.daily_ad_limit || '100');
      setDailyLimit(limit);
    } catch (error) {
      console.error('Error loading ad settings:', error);
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isWatching && countdown > 0) {
      interval = setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    } else if (countdown === 0 && isWatching) {
      handleAdCompleted();
    }
    
    return () => clearInterval(interval);
  }, [isWatching, countdown]);

  const loadUserData = async () => {
    if (userInfo?.telegram_id) {
      try {
        const user = await dbService.getUserByTelegramId(userInfo.telegram_id);
        if (user) {
          setAdsWatchedToday(user.ads_watched_today || 0);
          setCanWatch((user.ads_watched_today || 0) < dailyLimit);
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    }
  };

  const startWatchingAd = () => {
    if (!canWatch) {
      toast({
        title: "Daily Limit Reached",
        description: `You've reached the daily limit of ${dailyLimit} ads`,
        variant: "destructive"
      });
      return;
    }

    // Check if we're in Telegram WebView environment
    const isTelegramWebView = window.Telegram?.WebApp || 
      window.navigator.userAgent.includes('TelegramBot') ||
      window.location.hostname.includes('telegram') ||
      window.parent !== window;

    if (isTelegramWebView) {
      // For Telegram, show safe internal ad
      setIsWatching(true);
      setCountdown(10); // 10 second countdown for Telegram
      toast({
        title: "🎯 টেলিগ্রাম মিনি অ্যাপ বিজ্ঞাপন",
        description: "নিরাপদ বিজ্ঞাপন দেখুন এবং USDT আয় করুন",
      });
    } else {
      // For external environments, try to load Monetag
      try {
        // Load Monetag ad script dynamically
        if (typeof window !== 'undefined' && (window as any).show_9506527) {
          (window as any).show_9506527();
        }
        setIsWatching(true);
        setCountdown(15);
      } catch (error) {
        console.error('Error loading external ad:', error);
        // Fallback to internal ad
        setIsWatching(true);
        setCountdown(10);
      }
    }
  };

  const pauseAd = () => {
    setIsWatching(false);
    toast({
      title: "Ad Paused",
      description: "Resume to continue earning",
    });
  };

  const resumeAd = () => {
    setIsWatching(true);
    toast({
      title: "Ad Resumed",
      description: "Keep watching to earn your reward",
    });
  };

  const skipAd = () => {
    if (countdown <= 5) {
      handleAdCompleted();
    } else {
      toast({
        title: "Cannot Skip Yet",
        description: `Wait ${countdown - 5} more seconds to skip`,
        variant: "destructive"
      });
    }
  };

  const handleAdCompleted = async () => {
    setIsWatching(false);
    setIsLoading(true);
    
    try {
      // Update user balance
      const newBalance = userBalance + adReward;
      const balanceSuccess = await dbService.updateUserBalance(userInfo.telegram_id, newBalance);
      
      if (balanceSuccess) {
        updateUserBalance(newBalance);
        
        // Increment ads watched count
        const adSuccess = await dbService.incrementUserAdsWatched(userInfo.telegram_id);
        if (adSuccess) {
          const newAdsCount = adsWatchedToday + 1;
          setAdsWatchedToday(newAdsCount);
          updateAdsWatched(newAdsCount);
          setCanWatch(newAdsCount < dailyLimit);
          
          // Log activity
          await dbService.logActivity(userInfo.telegram_id, 'ad_watch', adReward);
          
          toast({
            title: "Ad Completed!",
            description: `You earned $${adReward.toFixed(3)} USDT!`,
          });
        } else {
          toast({
            title: "Error",
            description: "Failed to update ad count",
            variant: "destructive"
          });
        }
      } else {
        toast({
          title: "Error",
          description: "Failed to update balance",
          variant: "destructive"
        });
      }
      
      setCountdown(0);
    } catch (error) {
      console.error('Error completing ad:', error);
      toast({
        title: "Error",
        description: "Failed to process ad completion",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const refreshAds = () => {
    loadUserData();
    toast({
      title: "Refreshed!",
      description: "Ad data has been updated",
    });
  };

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="text-center py-4">
        <div className="flex items-center justify-center space-x-2 mb-2">
          <h1 className="text-2xl font-bold text-white">Watch Ads</h1>
          <Button
            onClick={refreshAds}
            variant="ghost"
            size="sm"
            className="text-blue-400 hover:text-blue-300"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-gray-400">
          Earn USDT by watching advertisements
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-gradient-to-r from-blue-600/20 to-cyan-600/20 border-blue-500/30">
          <CardContent className="p-4 text-center">
            <Eye className="w-8 h-8 text-blue-400 mx-auto mb-2" />
            <p className="text-white font-bold text-lg">{adsWatchedToday}</p>
            <p className="text-gray-400 text-sm">Today</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-600/20 to-emerald-600/20 border-green-500/30">
          <CardContent className="p-4 text-center">
            <DollarSign className="w-8 h-8 text-green-400 mx-auto mb-2" />
            <p className="text-white font-bold text-lg">${(adsWatchedToday * adReward).toFixed(3)}</p>
            <p className="text-gray-400 text-sm">Earned</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border-purple-500/30">
          <CardContent className="p-4 text-center">
            <Gift className="w-8 h-8 text-purple-400 mx-auto mb-2" />
            <p className="text-white font-bold text-lg">{dailyLimit - adsWatchedToday}</p>
            <p className="text-gray-400 text-sm">Remaining</p>
          </CardContent>
        </Card>
      </div>

      {/* Monetag Ad Display */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-white">Advertisement</CardTitle>
            <Badge variant="secondary" className="bg-blue-600/20 text-blue-300">
              Monetag
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Monetag Ad Container */}
          <div className="relative bg-gray-900 rounded-lg p-6 text-center min-h-[300px]">
            {!isWatching && countdown === 0 ? (
              <div>
                <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Play className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-white text-xl font-bold mb-2">Ready to Watch Ad</h3>
                <p className="text-gray-400 mb-4">Click below to start watching and earn USDT</p>
                <div className="flex items-center justify-center space-x-2">
                  <DollarSign className="w-5 h-5 text-green-400" />
                  <span className="text-green-400 font-bold">
                    Reward: ${adReward.toFixed(3)} USDT
                  </span>
                </div>
              </div>
            ) : (
              <div>
                <div className="w-16 h-16 bg-gradient-to-r from-green-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Eye className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-white text-xl font-bold mb-2">Watching Advertisement</h3>
                <p className="text-gray-400 mb-4">Keep this tab active to earn your reward</p>
                
                {/* Countdown Timer */}
                <div className="flex items-center justify-center space-x-2 mb-4">
                  <Clock className="w-5 h-5 text-yellow-400" />
                  <span className="text-yellow-400 font-bold text-lg">
                    {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')}
                  </span>
                </div>
                
                {/* Progress Bar */}
                <div className="w-full bg-gray-700 rounded-full h-2 mb-4">
                  <div 
                    className="bg-gradient-to-r from-blue-600 to-green-600 h-2 rounded-full transition-all duration-1000"
                    style={{ 
                      width: `${((15 - countdown) / 15) * 100}%` 
                    }}
                  ></div>
                </div>
                
                {/* Monetag Ad Display */}
                <div className="bg-gray-800 rounded-lg p-4 border-2 border-dashed border-gray-600">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-gray-400 text-sm">Advertisement Content</p>
                    <Badge variant="secondary" className="bg-green-600/20 text-green-300 text-xs">
                      Monetag
                    </Badge>
                  </div>
                  <div id="monetag-ad-container" className="min-h-[200px] flex items-center justify-center bg-gray-900 rounded">
                    <div className="text-center p-6">
                      <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                        <span className="text-white font-bold text-xl">AD</span>
                      </div>
                      <h3 className="text-white text-lg font-bold mb-2">Monetag Advertisement</h3>
                      <p className="text-gray-400 text-sm mb-4">Interactive reward advertisement</p>
                      <div className="bg-gray-700 rounded-lg p-4">
                        <p className="text-yellow-400 text-sm">বিজ্ঞাপন কন্টেন্ট</p>
                        <p className="text-gray-300 text-xs mt-1">Monetag interstitial reward ad</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Control Buttons */}
          <div className="flex justify-center space-x-4">
            {!isWatching && countdown === 0 && (
              <Button
                onClick={startWatchingAd}
                disabled={!canWatch || isLoading}
                className="bg-green-600 hover:bg-green-700 px-8"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <>
                    <Play className="w-5 h-5 mr-2" />
                    Watch Ad
                  </>
                )}
              </Button>
            )}
            
            {isWatching && (
              <>
                <Button
                  onClick={pauseAd}
                  variant="outline"
                  className="border-gray-600 text-white hover:bg-gray-700"
                >
                  <Pause className="w-5 h-5 mr-2" />
                  Pause
                </Button>
                
                <Button
                  onClick={skipAd}
                  disabled={countdown > 5}
                  variant="outline"
                  className="border-gray-600 text-white hover:bg-gray-700"
                >
                  <SkipForward className="w-5 h-5 mr-2" />
                  {countdown > 5 ? `Skip (${countdown - 5}s)` : 'Skip'}
                </Button>
              </>
            )}
            
            {!isWatching && countdown > 0 && (
              <Button
                onClick={resumeAd}
                className="bg-blue-600 hover:bg-blue-700 px-8"
              >
                <Play className="w-5 h-5 mr-2" />
                Resume
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Daily Progress */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Daily Progress</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Ads Watched</span>
            <span className="text-white font-bold">{adsWatchedToday}/{dailyLimit}</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-blue-600 to-green-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${(adsWatchedToday / dailyLimit) * 100}%` }}
            ></div>
          </div>
          
          {!canWatch && (
            <div className="flex items-center justify-center space-x-2 p-3 bg-yellow-600/10 rounded-lg border border-yellow-600/30">
              <CheckCircle className="w-5 h-5 text-yellow-400" />
              <span className="text-yellow-400 font-medium">
                Daily limit reached! Come back tomorrow for more ads.
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* HTML Banner Ad */}
      <HtmlAdDisplay position="banner" className="mb-6" />

      {/* HTML Sidebar Ad */}
      <HtmlAdDisplay position="sidebar" className="mb-6" />

      {/* Earning Info */}
      <Card className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-blue-500/30">
        <CardHeader>
          <CardTitle className="text-white flex items-center space-x-2">
            <Gift className="w-5 h-5 text-yellow-400" />
            <span>How It Works</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-gray-300 text-sm">
            💰 Earn ${adReward.toFixed(3)} USDT for each ad you watch
          </p>
          <p className="text-gray-300 text-sm">
            ⏱️ Each ad takes about 15 seconds to complete
          </p>
          <p className="text-gray-300 text-sm">
            📊 You can watch up to {dailyLimit} ads per day
          </p>
          <p className="text-gray-300 text-sm">
            🎯 Keep the tab active while watching to earn rewards
          </p>
        </CardContent>
      </Card>

      {/* HTML Footer Ad */}
      <HtmlAdDisplay position="footer" className="mt-6" />
    </div>
  );
};

export default AdViewerPage;
