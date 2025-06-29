
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Clock, Eye, ExternalLink, Play } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAdmin } from '../contexts/AdminContext';
import { dbService } from '../services/database';

interface Ad {
  id: string;
  type: 'image' | 'html' | 'monetag' | 'video';
  content: string;
  link: string;
  reward: number;
  duration: number;
}

interface AdViewerPageProps {
  userInfo: any;
  userBalance: number;
  updateUserBalance: (newBalance: number) => void;
}

const AdViewerPage: React.FC<AdViewerPageProps> = ({ 
  userInfo, 
  userBalance, 
  updateUserBalance 
}) => {
  const [currentAd, setCurrentAd] = useState<Ad | null>(null);
  const [countdown, setCountdown] = useState(30); // 30 seconds
  const [canEarn, setCanEarn] = useState(false);
  const [adsWatchedToday, setAdsWatchedToday] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [hasClickedAd, setHasClickedAd] = useState(false);
  const [isWatching, setIsWatching] = useState(false);
  const { toast } = useToast();
  const { settings } = useAdmin();

  const maxAdsPerDay = parseInt(settings.dailyAdLimit || '30');
  const adReward = 0.005; // Fixed $0.005 per ad

  useEffect(() => {
    loadNextAd();
    loadTodayStats();
  }, []);

  useEffect(() => {
    if (currentAd && countdown > 0 && isWatching) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && isWatching) {
      setCanEarn(true);
    }
  }, [countdown, currentAd, isWatching]);

  const loadTodayStats = async () => {
    if (userInfo) {
      try {
        const user = await dbService.getUserByTelegramId(userInfo.id.toString());
        if (user) {
          setAdsWatchedToday(user.ads_watched_today || 0);
        }
      } catch (error) {
        console.error('Error loading today stats:', error);
      }
    }
  };

  const loadNextAd = async () => {
    setIsLoading(true);
    setHasClickedAd(false);
    setIsWatching(false);
    setCanEarn(false);
    try {
      const mockAds: Ad[] = [
        {
          id: '1',
          type: 'image',
          content: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=300&fit=crop',
          link: 'https://otieu.com/4/9498111',
          reward: adReward,
          duration: 30
        },
        {
          id: '2',
          type: 'html',
          content: settings.htmlAdCode || '<div style="background: linear-gradient(45deg, #FF6B6B, #4ECDC4); padding: 40px; text-align: center; color: white; border-radius: 10px;"><h2>Special Offer!</h2><p>Get 50% off your next purchase</p></div>',
          link: 'https://otieu.com/4/9498111',
          reward: adReward,
          duration: 30
        },
        {
          id: '3',
          type: 'monetag',
          content: settings.monetagBannerCode || '',
          link: 'https://otieu.com/4/9498111',
          reward: adReward,
          duration: 30
        },
        {
          id: '4',
          type: 'video',
          content: '/lovable-uploads/613366ca-1ff2-4789-a5e9-b330dba1513a.png',
          link: 'https://otieu.com/4/9498111',
          reward: adReward,
          duration: 30
        }
      ];

      const randomAd = mockAds[Math.floor(Math.random() * mockAds.length)];
      setCurrentAd(randomAd);
      setCountdown(30); // Reset to 30 seconds
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

  const handleStartWatching = () => {
    setIsWatching(true);
    setCountdown(30);
    toast({
      title: "Ad Started",
      description: "Watch for 30 seconds to earn $0.005",
    });
  };

  const handleAdClick = () => {
    if (currentAd?.link) {
      window.open(currentAd.link, '_blank');
      setHasClickedAd(true);
      toast({
        title: "Ad Clicked!",
        description: "Great! Now wait for the timer to complete",
      });
    }
  };

  const handleEarnNow = async () => {
    if (!currentAd || !canEarn || !userInfo) return;

    if (!hasClickedAd) {
      toast({
        title: "Click Required",
        description: "You must click on the advertisement first!",
        variant: "destructive"
      });
      return;
    }

    try {
      // Update user's ads watched count in database
      await dbService.incrementUserAdsWatched(userInfo.id.toString());
      
      // Log the activity
      await dbService.logActivity(userInfo.id.toString(), 'ad_watch', currentAd.reward);
      
      // Update balance
      const newBalance = userBalance + currentAd.reward;
      updateUserBalance(newBalance);

      // Update ads watched count
      setAdsWatchedToday(adsWatchedToday + 1);

      toast({
        title: "Earned!",
        description: `You earned $${currentAd.reward.toFixed(3)} USDT`,
      });

      // Reset states
      setIsWatching(false);
      setCanEarn(false);
      setHasClickedAd(false);

      if (adsWatchedToday + 1 < maxAdsPerDay) {
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
            Earn $0.005 USDT per ad (30 seconds each)
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
                +$0.005
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div 
              className="bg-gray-700 rounded-lg p-4 min-h-[250px] flex items-center justify-center cursor-pointer hover:bg-gray-600 transition-colors"
              onClick={handleAdClick}
            >
              {currentAd.type === 'image' || currentAd.type === 'video' ? (
                <div className="text-center">
                  <img 
                    src={currentAd.content} 
                    alt="Advertisement" 
                    className="max-w-full max-h-[200px] rounded-lg mb-4"
                  />
                  <Button
                    onClick={handleAdClick}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Click Here
                  </Button>
                </div>
              ) : currentAd.type === 'monetag' ? (
                <div className="w-full text-center">
                  {settings.monetagBannerCode ? (
                    <div>
                      <div dangerouslySetInnerHTML={{ __html: settings.monetagBannerCode }} />
                      <Button
                        onClick={handleAdClick}
                        className="bg-blue-600 hover:bg-blue-700 mt-4"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Click Here
                      </Button>
                    </div>
                  ) : (
                    <div>
                      <p className="text-gray-400 p-8">Monetag Banner Ad</p>
                      <Button
                        onClick={handleAdClick}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Click Here
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-full text-center">
                  <div 
                    dangerouslySetInnerHTML={{ __html: currentAd.content }}
                    className="w-full mb-4"
                  />
                  <Button
                    onClick={handleAdClick}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Click Here
                  </Button>
                </div>
              )}
            </div>

            {!isWatching && (
              <Button
                onClick={handleStartWatching}
                className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <Play className="w-5 h-5 mr-2" />
                Start Watching (30s)
              </Button>
            )}

            {isWatching && !hasClickedAd && (
              <div className="text-center bg-yellow-500/20 rounded-lg p-3 border border-yellow-500/30">
                <p className="text-yellow-300 text-sm">⚠️ Click on the advertisement above to proceed</p>
              </div>
            )}

            {isWatching && countdown > 0 && (
              <div className="text-center bg-orange-500/20 rounded-lg p-4 border border-orange-500/30">
                <div className="flex items-center justify-center space-x-2 text-orange-400">
                  <Clock className="w-5 h-5" />
                  <span className="text-xl font-bold">{countdown}s</span>
                </div>
                <p className="text-sm text-orange-300 mt-1">Please wait to earn your reward</p>
                <div className="w-full bg-gray-600 rounded-full h-2 mt-2">
                  <div 
                    className="bg-orange-400 h-2 rounded-full transition-all duration-1000"
                    style={{ width: `${((30 - countdown) / 30) * 100}%` }}
                  ></div>
                </div>
              </div>
            )}

            {isWatching && (
              <Button
                onClick={handleEarnNow}
                disabled={!canEarn || !hasClickedAd}
                className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 transition-all duration-300"
              >
                {canEarn && hasClickedAd ? (
                  <>
                    <DollarSign className="w-5 h-5 mr-2" />
                    Earn $0.005 Now
                  </>
                ) : !hasClickedAd ? (
                  'Click Advertisement First'
                ) : (
                  'Please Wait...'
                )}
              </Button>
            )}
          </CardContent>
        </Card>
      ) : null}

      {canEarn && hasClickedAd && (
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
