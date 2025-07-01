
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
  const [dailyLimit] = useState(50);
  const { toast } = useToast();

  // Sample ads data
  const sampleAds = [
    {
      id: 1,
      title: "Crypto Exchange Platform",
      description: "Trade cryptocurrencies safely and securely",
      duration: 15,
      reward: 0.001,
      category: "Finance"
    },
    {
      id: 2,
      title: "Online Shopping Deal",
      description: "Get 50% off on electronics and gadgets",
      duration: 20,
      reward: 0.002,
      category: "Shopping"
    },
    {
      id: 3,
      title: "Mobile Gaming App",
      description: "Download and play the latest mobile game",
      duration: 25,
      reward: 0.001,
      category: "Gaming"
    },
    {
      id: 4,
      title: "Investment Platform",
      description: "Start investing with just $10 minimum",
      duration: 30,
      reward: 0.003,
      category: "Investment"
    }
  ];

  const [currentAd, setCurrentAd] = useState(sampleAds[0]);

  useEffect(() => {
    loadUserData();
  }, [userInfo]);

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
    if (userInfo?.id) {
      try {
        const user = await dbService.getUserByTelegramId(userInfo.id.toString());
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

    // Get random ad
    const randomAd = sampleAds[Math.floor(Math.random() * sampleAds.length)];
    setCurrentAd(randomAd);
    setCountdown(randomAd.duration);
    setIsWatching(true);
    
    toast({
      title: "Ad Started!",
      description: `Watch for ${randomAd.duration} seconds to earn $${randomAd.reward.toFixed(3)}`,
    });
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
      const newBalance = userBalance + currentAd.reward;
      await dbService.updateUserBalance(userInfo.id.toString(), newBalance);
      updateUserBalance(newBalance);
      
      // Increment ads watched count
      const success = await dbService.incrementUserAdsWatched(userInfo.id.toString());
      if (success) {
        const newAdsCount = adsWatchedToday + 1;
        setAdsWatchedToday(newAdsCount);
        updateAdsWatched(newAdsCount);
        setCanWatch(newAdsCount < dailyLimit);
        
        // Log activity
        await dbService.logActivity(userInfo.id.toString(), 'ad_watch', currentAd.reward);
      }
      
      toast({
        title: "Ad Completed!",
        description: `You earned $${currentAd.reward.toFixed(3)} USDT!`,
      });
      
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
            <p className="text-white font-bold text-lg">${(adsWatchedToday * 0.001).toFixed(3)}</p>
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

      {/* Current Ad Display */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-white">Current Advertisement</CardTitle>
            <Badge variant="secondary" className="bg-blue-600/20 text-blue-300">
              {currentAd.category}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Ad Preview */}
          <div className="relative bg-gray-900 rounded-lg p-6 text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Play className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-white text-xl font-bold mb-2">{currentAd.title}</h3>
            <p className="text-gray-400 mb-4">{currentAd.description}</p>
            
            {/* Countdown Timer */}
            {isWatching && (
              <div className="flex items-center justify-center space-x-2 mb-4">
                <Clock className="w-5 h-5 text-yellow-400" />
                <span className="text-yellow-400 font-bold text-lg">
                  {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')}
                </span>
              </div>
            )}
            
            {/* Progress Bar */}
            {isWatching && (
              <div className="w-full bg-gray-700 rounded-full h-2 mb-4">
                <div 
                  className="bg-gradient-to-r from-blue-600 to-green-600 h-2 rounded-full transition-all duration-1000"
                  style={{ 
                    width: `${((currentAd.duration - countdown) / currentAd.duration) * 100}%` 
                  }}
                ></div>
              </div>
            )}
            
            {/* Reward Info */}
            <div className="flex items-center justify-center space-x-2">
              <DollarSign className="w-5 h-5 text-green-400" />
              <span className="text-green-400 font-bold">
                Reward: ${currentAd.reward.toFixed(3)} USDT
              </span>
            </div>
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

      {/* Available Ads */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Available Ads</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {sampleAds.map((ad) => (
            <div 
              key={ad.id}
              className={`p-3 rounded-lg border ${
                currentAd.id === ad.id 
                  ? 'bg-blue-600/20 border-blue-600/50' 
                  : 'bg-gray-700/50 border-gray-600'
              }`}
            >
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-white font-medium">{ad.title}</h4>
                  <p className="text-gray-400 text-sm">{ad.description}</p>
                  <div className="flex items-center space-x-4 mt-2">
                    <Badge variant="secondary" className="bg-gray-600 text-gray-300">
                      {ad.duration}s
                    </Badge>
                    <span className="text-green-400 font-bold text-sm">
                      +${ad.reward.toFixed(3)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdViewerPage;
