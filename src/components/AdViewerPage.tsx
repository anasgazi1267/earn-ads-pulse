import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Clock, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAdmin } from '../contexts/AdminContext';

interface Ad {
  id: string;
  type: 'image' | 'html' | 'monetag';
  content: string;
  link?: string;
  reward: number;
}

const AdViewerPage: React.FC = () => {
  const [currentAd, setCurrentAd] = useState<Ad | null>(null);
  const [countdown, setCountdown] = useState(15);
  const [canEarn, setCanEarn] = useState(false);
  const [adsWatchedToday, setAdsWatchedToday] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { settings } = useAdmin();

  const maxAdsPerDay = parseInt(settings.dailyAdLimit);
  const adReward = parseFloat(settings.adRewardRate);

  useEffect(() => {
    loadNextAd();
    loadTodayStats();

    // Listen for admin settings updates
    const handleSettingsUpdate = () => {
      loadTodayStats();
    };

    window.addEventListener('adminSettingsUpdated', handleSettingsUpdate);
    return () => window.removeEventListener('adminSettingsUpdated', handleSettingsUpdate);
  }, []);

  useEffect(() => {
    if (currentAd && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      setCanEarn(true);
    }
  }, [countdown, currentAd]);

  const loadTodayStats = () => {
    // Load from localStorage or API
    const today = new Date().toDateString();
    const stored = localStorage.getItem(`ads_watched_${today}`);
    setAdsWatchedToday(parseInt(stored || '0'));
  };

  const loadNextAd = async () => {
    setIsLoading(true);
    try {
      const mockAds: Ad[] = [
        {
          id: '1',
          type: 'image',
          content: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=300&fit=crop',
          link: 'https://example.com',
          reward: adReward
        },
        {
          id: '2',
          type: 'html',
          content: settings.htmlAdCode || '<div style="background: linear-gradient(45deg, #FF6B6B, #4ECDC4); padding: 40px; text-align: center; color: white; border-radius: 10px;"><h2>Special Offer!</h2><p>Get 50% off your next purchase</p></div>',
          link: 'https://example.com/offer',
          reward: adReward
        },
        {
          id: '3',
          type: 'monetag',
          content: settings.monetagBannerCode || '',
          reward: adReward
        }
      ];

      const randomAd = mockAds[Math.floor(Math.random() * mockAds.length)];
      setCurrentAd(randomAd);
      setCountdown(15);
      setCanEarn(false);
    } catch (error) {
      console.error('Error loading ad:', error);
      toast({
        title: "Error",
        description: "Failed to load advertisement",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEarnNow = async () => {
    if (!currentAd || !canEarn) return;

    try {
      const today = new Date().toDateString();
      const newCount = adsWatchedToday + 1;
      localStorage.setItem(`ads_watched_${today}`, newCount.toString());
      setAdsWatchedToday(newCount);

      const currentBalance = parseFloat(localStorage.getItem('balance') || '0');
      const newBalance = currentBalance + currentAd.reward;
      localStorage.setItem('balance', newBalance.toString());

      toast({
        title: "Earned!",
        description: `You earned $${currentAd.reward.toFixed(3)} USDT`,
      });

      if (currentAd.link) {
        window.open(currentAd.link, '_blank');
      }

      if (newCount < maxAdsPerDay) {
        setTimeout(() => {
          loadNextAd();
        }, 2000);
      }
    } catch (error) {
      console.error('Error processing earning:', error);
      toast({
        title: "Error",
        description: "Failed to process earning",
        variant: "destructive"
      });
    }
  };

  if (adsWatchedToday >= maxAdsPerDay) {
    return (
      <div className="p-4 flex items-center justify-center min-h-screen">
        <Card className="bg-gray-800 border-gray-700 w-full max-w-md">
          <CardContent className="p-6 text-center">
            <DollarSign className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Daily Limit Reached!</h2>
            <p className="text-gray-400 mb-4">
              You've watched {maxAdsPerDay} ads today. Come back tomorrow for more earning opportunities!
            </p>
            <p className="text-sm text-gray-500">
              Reset at midnight (00:00 UTC)
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="text-center py-4">
        <h1 className="text-2xl font-bold text-white mb-2 flex items-center justify-center">
          <Eye className="w-6 h-6 mr-2" />
          Watch & Earn
        </h1>
        <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
          <p className="text-gray-400">
            Progress: <span className="text-green-400 font-semibold">{adsWatchedToday}/{maxAdsPerDay}</span> ads today
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Earn ${adReward.toFixed(3)} USDT per ad
          </p>
        </div>
      </div>

      {isLoading ? (
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-6 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-white">Loading premium advertisement...</p>
          </CardContent>
        </Card>
      ) : currentAd ? (
        <Card className="bg-gray-800 border-gray-700 shadow-lg">
          <CardHeader>
            <CardTitle className="text-white flex items-center justify-between">
              <span className="flex items-center">
                <DollarSign className="w-5 h-5 mr-2 text-green-400" />
                Advertisement
              </span>
              <span className="text-green-400 font-bold text-lg">
                +${currentAd.reward.toFixed(3)}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-gray-700 rounded-lg p-4 min-h-[250px] flex items-center justify-center">
              {currentAd.type === 'image' ? (
                <img 
                  src={currentAd.content} 
                  alt="Advertisement" 
                  className="max-w-full max-h-full rounded-lg"
                />
              ) : currentAd.type === 'monetag' ? (
                <div className="w-full">
                  {settings.monetagBannerCode ? (
                    <div dangerouslySetInnerHTML={{ __html: settings.monetagBannerCode }} />
                  ) : (
                    <div className="text-center text-gray-400 p-8">
                      <p>Monetag Banner Ad</p>
                      <p className="text-sm mt-2">Configure in Admin Panel</p>
                    </div>
                  )}
                </div>
              ) : (
                <div 
                  dangerouslySetInnerHTML={{ __html: currentAd.content }}
                  className="w-full"
                />
              )}
            </div>

            {countdown > 0 && (
              <div className="text-center bg-orange-500/20 rounded-lg p-4 border border-orange-500/30">
                <div className="flex items-center justify-center space-x-2 text-orange-400">
                  <Clock className="w-5 h-5" />
                  <span className="text-xl font-bold">{countdown}s</span>
                </div>
                <p className="text-sm text-orange-300 mt-1">Please wait to earn your reward</p>
              </div>
            )}

            <Button
              onClick={handleEarnNow}
              disabled={!canEarn}
              className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 transition-all duration-300"
            >
              {canEarn ? (
                <>
                  <DollarSign className="w-5 h-5 mr-2" />
                  Earn ${currentAd.reward.toFixed(3)} Now
                </>
              ) : (
                'Please Wait...'
              )}
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {canEarn && (
        <Button
          onClick={loadNextAd}
          variant="outline"
          className="w-full h-12 border-gray-600 text-white hover:bg-gray-700 transition-all duration-300"
        >
          Load Next Advertisement
        </Button>
      )}
    </div>
  );
};

export default AdViewerPage;
