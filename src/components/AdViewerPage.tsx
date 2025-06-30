
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Clock, Eye, Play, Zap, Gift, Monitor } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAdmin } from '../contexts/AdminContext';
import { dbService } from '../services/database';

interface AdViewerPageProps {
  userInfo: any;
  userBalance: number;
  updateUserBalance: (newBalance: number) => void;
}

// Declare the ad SDK function
declare global {
  function show_9506527(type?: string | object): Promise<void>;
}

const AdViewerPage: React.FC<AdViewerPageProps> = ({ 
  userInfo, 
  userBalance, 
  updateUserBalance 
}) => {
  const [adsWatchedToday, setAdsWatchedToday] = useState(0);
  const [adTypeStats, setAdTypeStats] = useState({
    interstitial: 0,
    popup: 0,
    inapp: 0
  });
  const [isWatching, setIsWatching] = useState(false);
  const [watchingType, setWatchingType] = useState<string>('');
  const [countdown, setCountdown] = useState(0);
  const { toast } = useToast();
  const { settings } = useAdmin();

  const maxAdsPerType = 30; // 30 limit for each ad type
  const totalMaxAds = maxAdsPerType * 3; // 90 total
  const adReward = 0.005; // $0.005 per ad
  const adDuration = 20; // All ads are 20 seconds

  const adTypes = [
    {
      id: 'interstitial',
      title: 'Rewarded Interstitial',
      description: 'Native banner with reward for viewing',
      icon: <Gift className="w-6 h-6" />,
      color: 'from-green-600 to-emerald-600',
      reward: adReward,
      duration: adDuration,
      count: adTypeStats.interstitial
    },
    {
      id: 'popup',
      title: 'Rewarded Popup',
      description: 'Direct offer page with reward',
      icon: <Zap className="w-6 h-6" />,
      color: 'from-blue-600 to-cyan-600',
      reward: adReward,
      duration: adDuration,
      count: adTypeStats.popup
    },
    {
      id: 'inapp',
      title: 'In-App Interstitial',
      description: 'Native banner shown automatically',
      icon: <Monitor className="w-6 h-6" />,
      color: 'from-purple-600 to-pink-600',
      reward: adReward,
      duration: adDuration,
      count: adTypeStats.inapp
    }
  ];

  useEffect(() => {
    loadTodayStats();
  }, []);

  useEffect(() => {
    if (countdown > 0 && isWatching) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && isWatching) {
      handleAdComplete();
    }
  }, [countdown, isWatching]);

  const loadTodayStats = async () => {
    if (userInfo) {
      try {
        const user = await dbService.getUserByTelegramId(userInfo.id.toString());
        if (user) {
          setAdsWatchedToday(user.ads_watched_today || 0);
          
          // Load individual ad type stats from activities
          const activities = await dbService.getUserActivities(userInfo.id.toString());
          const today = new Date().toDateString();
          const todayActivities = activities.filter(activity => 
            new Date(activity.activity_date).toDateString() === today
          );
          
          const stats = {
            interstitial: todayActivities.filter(a => a.activity_type === 'ad_watch_interstitial').length,
            popup: todayActivities.filter(a => a.activity_type === 'ad_watch_popup').length,
            inapp: todayActivities.filter(a => a.activity_type === 'ad_watch_inapp').length
          };
          
          setAdTypeStats(stats);
          console.log('Loaded ad stats:', stats);
        }
      } catch (error) {
        console.error('Error loading today stats:', error);
      }
    }
  };

  const handleAdComplete = async () => {
    setIsWatching(false);
    const currentAdType = watchingType;
    setWatchingType('');
    
    console.log(`Ad completed: ${currentAdType}`);
    
    // Check if this ad type is under limit
    const currentTypeCount = adTypeStats[currentAdType as keyof typeof adTypeStats] || 0;
    const canEarn = currentTypeCount < maxAdsPerType;
    
    console.log(`Current ${currentAdType} count: ${currentTypeCount}, Can earn: ${canEarn}`);
    
    try {
      // Always increment the total ad count
      await dbService.incrementUserAdsWatched(userInfo.id.toString());
      console.log('Incremented total ads watched');
      
      // Log the specific ad type activity
      await dbService.logActivity(userInfo.id.toString(), `ad_watch_${currentAdType}`, canEarn ? adReward : 0);
      console.log(`Logged activity: ad_watch_${currentAdType}, reward: ${canEarn ? adReward : 0}`);
      
      // Update balance only if under limit
      if (canEarn) {
        const newBalance = userBalance + adReward;
        updateUserBalance(newBalance);
        console.log(`Updated balance: ${newBalance}`);

        toast({
          title: "Reward Earned! 🎉",
          description: `You earned $${adReward.toFixed(3)} USDT`,
        });
      } else {
        toast({
          title: "Ad Watched!",
          description: `Daily limit reached for ${currentAdType}. No reward this time.`,
          variant: "destructive"
        });
      }

      // Update local stats
      setAdsWatchedToday(prev => {
        const newCount = prev + 1;
        console.log(`Updated total ads watched today: ${newCount}`);
        return newCount;
      });
      
      setAdTypeStats(prev => {
        const newStats = {
          ...prev,
          [currentAdType]: prev[currentAdType as keyof typeof prev] + 1
        };
        console.log(`Updated ad type stats:`, newStats);
        return newStats;
      });

    } catch (error) {
      console.error('Error processing earning:', error);
      toast({
        title: "Error",
        description: "Failed to process reward",
        variant: "destructive"
      });
    }
  };

  const watchAd = async (adType: string, duration: number) => {
    if (isWatching) return;

    console.log(`Starting ${adType} ad for ${duration} seconds...`);
    setIsWatching(true);
    setWatchingType(adType);
    setCountdown(duration);

    try {
      if (adType === 'interstitial') {
        await show_9506527();
      } else if (adType === 'popup') {
        await show_9506527('pop');
      } else if (adType === 'inapp') {
        await show_9506527({
          type: 'inApp',
          inAppSettings: {
            frequency: 1,
            capping: 0.05,
            interval: 10,
            timeout: 3,
            everyPage: false
          }
        });
      }

      toast({
        title: "Ad Started",
        description: `Watch for ${duration} seconds to earn reward`,
      });
    } catch (error) {
      console.error('Ad error:', error);
      setIsWatching(false);
      setWatchingType('');
      toast({
        title: "Ad Loading Error",
        description: "Please try again",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="text-center py-4">
        <h1 className="text-2xl font-bold text-white mb-2 flex items-center justify-center">
          <Eye className="w-6 h-6 mr-2" />
          Professional Watch & Earn
        </h1>
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-400">Today's Progress:</p>
              <p className="text-green-400 font-semibold text-lg">
                {adsWatchedToday}/{totalMaxAds}
              </p>
            </div>
            <div>
              <p className="text-gray-400">Per Ad Reward:</p>
              <p className="text-yellow-400 font-semibold text-lg">
                $0.005 USDT
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Ad Types */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-white text-center mb-4">
          Three Ways to Earn from Ads
        </h2>

        {adTypes.map((ad) => (
          <Card key={ad.id} className="bg-gray-800 border-gray-700 shadow-lg">
            <CardHeader>
              <CardTitle className="text-white flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg bg-gradient-to-r ${ad.color}`}>
                    {ad.icon}
                  </div>
                  <div>
                    <h3 className="text-lg">{ad.title}</h3>
                    <p className="text-sm text-gray-400 font-normal">
                      {ad.description}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-green-400 font-bold text-lg">
                    +${ad.reward.toFixed(3)}
                  </p>
                  <p className="text-gray-400 text-sm">
                    {ad.count}/{maxAdsPerType}
                  </p>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isWatching && watchingType === ad.id ? (
                <div className="text-center space-y-4">
                  <div className="bg-orange-500/20 rounded-lg p-4 border border-orange-500/30">
                    <div className="flex items-center justify-center space-x-2 text-orange-400 mb-2">
                      <Clock className="w-5 h-5" />
                      <span className="text-2xl font-bold">{countdown}s</span>
                    </div>
                    <p className="text-sm text-orange-300">Ad is playing, please wait...</p>
                    <div className="w-full bg-gray-600 rounded-full h-3 mt-3">
                      <div 
                        className="bg-orange-400 h-3 rounded-full transition-all duration-1000"
                        style={{ width: `${((ad.duration - countdown) / ad.duration) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ) : (
                <Button
                  onClick={() => watchAd(ad.id, ad.duration)}
                  disabled={isWatching}
                  className={`w-full h-12 text-lg font-semibold bg-gradient-to-r ${ad.color} hover:opacity-90 disabled:opacity-50 transition-all duration-300`}
                >
                  <Play className="w-5 h-5 mr-2" />
                  {isWatching ? 'Another ad is playing...' : `Watch ${ad.title} (20s)`}
                </Button>
              )}
              
              {ad.count >= maxAdsPerType && (
                <div className="mt-2 bg-red-500/20 border border-red-500/30 rounded-lg p-2">
                  <p className="text-red-300 text-sm text-center">
                    ⚠️ Daily limit reached! You can still watch ads but won't earn rewards.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Stats Card */}
      <Card className="bg-gradient-to-r from-gray-800 to-gray-700 border-gray-600">
        <CardContent className="p-6">
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold text-white">Today's Statistics</h3>
            <div className="grid grid-cols-3 gap-4 mt-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-400">
                  {adsWatchedToday}
                </p>
                <p className="text-sm text-gray-400">Ads Watched</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-400">
                  ${((adTypeStats.interstitial * adReward) + (adTypeStats.popup * adReward) + (adTypeStats.inapp * adReward)).toFixed(3)}
                </p>
                <p className="text-sm text-gray-400">Today's Earn</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-400">
                  {Math.max(0, totalMaxAds - adsWatchedToday)}
                </p>
                <p className="text-sm text-gray-400">Remaining</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card className="bg-blue-600/20 border-blue-500/30">
        <CardContent className="p-4">
          <h3 className="text-lg font-semibold text-blue-300 mb-2">Instructions:</h3>
          <ul className="text-sm text-blue-200 space-y-1">
            <li>• Each ad is exactly 20 seconds duration</li>
            <li>• Earn $0.005 USDT for each advertisement you watch</li>
            <li>• Each ad type has a limit of {maxAdsPerType} per day</li>
            <li>• You can watch ads after limit but won't earn rewards</li>
            <li>• All earnings are added to your balance instantly</li>
            <li>• Progress is tracked in real-time</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdViewerPage;
