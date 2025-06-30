
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
  const [isWatching, setIsWatching] = useState(false);
  const [watchingType, setWatchingType] = useState<string>('');
  const [countdown, setCountdown] = useState(0);
  const { toast } = useToast();
  const { settings } = useAdmin();

  const maxAdsPerDay = parseInt(settings.dailyAdLimit || '30');
  const adReward = 0.005; // $0.005 per ad

  const adTypes = [
    {
      id: 'interstitial',
      title: 'Rewarded Interstitial',
      description: 'Native banner with reward for viewing',
      icon: <Gift className="w-6 h-6" />,
      color: 'from-green-600 to-emerald-600',
      reward: adReward,
      duration: 30
    },
    {
      id: 'popup',
      title: 'Rewarded Popup',
      description: 'Direct offer page with reward',
      icon: <Zap className="w-6 h-6" />,
      color: 'from-blue-600 to-cyan-600',
      reward: adReward,
      duration: 25
    },
    {
      id: 'inapp',
      title: 'In-App Interstitial',
      description: 'Native banner shown automatically',
      icon: <Monitor className="w-6 h-6" />,
      color: 'from-purple-600 to-pink-600',
      reward: adReward,
      duration: 35
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
        }
      } catch (error) {
        console.error('Error loading today stats:', error);
      }
    }
  };

  const handleAdComplete = async () => {
    setIsWatching(false);
    setWatchingType('');
    
    // Only add balance if under daily limit
    if (adsWatchedToday < maxAdsPerDay) {
      try {
        // Update user's ads watched count in database
        await dbService.incrementUserAdsWatched(userInfo.id.toString());
        
        // Log the activity
        await dbService.logActivity(userInfo.id.toString(), 'ad_watch', adReward);
        
        // Update balance
        const newBalance = userBalance + adReward;
        updateUserBalance(newBalance);

        // Update ads watched count
        setAdsWatchedToday(adsWatchedToday + 1);

        toast({
          title: "পুরস্কার পেয়েছেন! 🎉",
          description: `আপনি $${adReward.toFixed(3)} USDT আয় করেছেন`,
        });
      } catch (error) {
        console.error('Error processing earning:', error);
        toast({
          title: "ত্রুটি",
          description: "আয় প্রক্রিয়াকরণে সমস্যা হয়েছে",
          variant: "destructive"
        });
      }
    } else {
      toast({
        title: "দৈনিক সীমা শেষ!",
        description: "আজকের জন্য আয় সীমা শেষ হয়ে গেছে। কাল আবার চেষ্টা করুন।",
        variant: "destructive"
      });
    }
  };

  const watchAd = async (adType: string, duration: number) => {
    if (isWatching) return;

    setIsWatching(true);
    setWatchingType(adType);
    setCountdown(duration);

    try {
      console.log(`Starting ${adType} ad...`);
      
      if (adType === 'interstitial') {
        // Rewarded Interstitial
        await show_9506527();
        toast({
          title: "অ্যাড শুরু হয়েছে",
          description: `${duration} সেকেন্ড অপেক্ষা করুন`,
        });
      } else if (adType === 'popup') {
        // Rewarded Popup
        await show_9506527('pop');
        toast({
          title: "পপআপ অ্যাড শুরু",
          description: `${duration} সেকেন্ড অপেক্ষা করুন`,
        });
      } else if (adType === 'inapp') {
        // In-App Interstitial
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
        toast({
          title: "ইন-অ্যাপ অ্যাড শুরু",
          description: `${duration} সেকেন্ড অপেক্ষা করুন`,
        });
      }
    } catch (error) {
      console.error('Ad error:', error);
      setIsWatching(false);
      setWatchingType('');
      toast({
        title: "অ্যাড লোড হতে সমস্যা",
        description: "আবার চেষ্টা করুন",
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
              <p className="text-gray-400">আজকের অগ্রগতি:</p>
              <p className="text-green-400 font-semibold text-lg">
                {adsWatchedToday}/{maxAdsPerDay}
              </p>
            </div>
            <div>
              <p className="text-gray-400">প্রতি অ্যাড আয়:</p>
              <p className="text-yellow-400 font-semibold text-lg">
                $0.005 USDT
              </p>
            </div>
          </div>
          
          {adsWatchedToday >= maxAdsPerDay && (
            <div className="mt-3 bg-red-500/20 border border-red-500/30 rounded-lg p-2">
              <p className="text-red-300 text-sm text-center">
                ⚠️ দৈনিক সীমা শেষ! অ্যাড দেখতে পারবেন কিন্তু আয় হবে না।
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Ad Types */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-white text-center mb-4">
          তিন ধরনের অ্যাড থেকে আয় করুন
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
                    {ad.duration}s
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
                    <p className="text-sm text-orange-300">অ্যাড চলছে, অপেক্ষা করুন...</p>
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
                  {isWatching ? 'অন্য অ্যাড চলছে...' : `${ad.title} দেখুন`}
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Stats Card */}
      <Card className="bg-gradient-to-r from-gray-800 to-gray-700 border-gray-600">
        <CardContent className="p-6">
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold text-white">আজকের পরিসংখ্যান</h3>
            <div className="grid grid-cols-3 gap-4 mt-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-400">
                  {adsWatchedToday}
                </p>
                <p className="text-sm text-gray-400">অ্যাড দেখেছেন</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-400">
                  ${(Math.min(adsWatchedToday, maxAdsPerDay) * adReward).toFixed(3)}
                </p>
                <p className="text-sm text-gray-400">আজকের আয়</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-400">
                  {Math.max(0, maxAdsPerDay - adsWatchedToday)}
                </p>
                <p className="text-sm text-gray-400">বাকি আছে</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card className="bg-blue-600/20 border-blue-500/30">
        <CardContent className="p-4">
          <h3 className="text-lg font-semibold text-blue-300 mb-2">নির্দেশনা:</h3>
          <ul className="text-sm text-blue-200 space-y-1">
            <li>• প্রতিটি অ্যাড দেখে $0.005 USDT আয় করুন</li>
            <li>• দিনে সর্বোচ্চ {maxAdsPerDay}টি অ্যাড থেকে আয় করতে পারবেন</li>
            <li>• সীমা শেষ হলেও অ্যাড দেখতে পারবেন কিন্তু আয় হবে না</li>
            <li>• তিন ধরনের অ্যাড রয়েছে বিভিন্ন সময়ের</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdViewerPage;
