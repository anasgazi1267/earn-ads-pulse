
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  DollarSign, 
  Clock, 
  Eye,
  CheckCircle,
  AlertCircle,
  Zap
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAdmin } from '../contexts/AdminContext';
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
  const [timeLeft, setTimeLeft] = useState(20); // 20 seconds for all ads
  const [progress, setProgress] = useState(0);
  const [adsWatchedToday, setAdsWatchedToday] = useState(0);
  const [canEarn, setCanEarn] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  
  const { toast } = useToast();
  const { settings } = useAdmin();

  const adDuration = 20; // Fixed 20 seconds
  const dailyLimit = parseInt(settings.dailyAdLimit) || 30;
  const rewardRate = parseFloat(settings.adRewardRate) || 0.050;

  useEffect(() => {
    loadUserAdData();
  }, [userInfo]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isWatching && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          const newTime = prev - 1;
          setProgress(((adDuration - newTime) / adDuration) * 100);
          return newTime;
        });
      }, 1000);
    } else if (isWatching && timeLeft === 0) {
      completeAdWatching();
    }

    return () => clearInterval(interval);
  }, [isWatching, timeLeft]);

  const loadUserAdData = async () => {
    if (userInfo?.id) {
      try {
        const user = await dbService.getUserByTelegramId(userInfo.id.toString());
        if (user) {
          const watchedToday = user.ads_watched_today || 0;
          setAdsWatchedToday(watchedToday);
          setCanEarn(watchedToday < dailyLimit);
          updateAdsWatched(watchedToday);
          console.log('User ad data loaded:', { watchedToday, dailyLimit, canEarn: watchedToday < dailyLimit });
        }
      } catch (error) {
        console.error('Error loading user ad data:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const startWatchingAd = () => {
    if (!userInfo) return;
    
    setIsWatching(true);
    setTimeLeft(adDuration);
    setProgress(0);
    
    toast({
      title: "অ্যাড শুরু হয়েছে!",
      description: `${adDuration} সেকেন্ড মনোযোগ সহকারে দেখুন`,
    });
  };

  const completeAdWatching = async () => {
    if (!userInfo) return;

    setIsWatching(false);
    setProgress(100);
    
    try {
      // Always increment the ad counter
      const success = await dbService.incrementUserAdsWatched(userInfo.id.toString());
      
      if (success) {
        const newAdsWatched = adsWatchedToday + 1;
        setAdsWatchedToday(newAdsWatched);
        updateAdsWatched(newAdsWatched);
        
        // Only add balance if within daily limit
        if (canEarn && newAdsWatched <= dailyLimit) {
          const newBalance = userBalance + rewardRate;
          const balanceSuccess = await dbService.updateUserBalance(userInfo.id.toString(), newBalance);
          
          if (balanceSuccess) {
            updateUserBalance(newBalance);
            await dbService.logActivity(userInfo.id.toString(), 'ad_watch', rewardRate);
            
            toast({
              title: "অ্যাড সম্পন্ন! 🎉",
              description: `আপনি $${rewardRate.toFixed(3)} USDT পেয়েছেন!`,
            });
          }
        } else {
          toast({
            title: "অ্যাড সম্পন্ন!",
            description: "দৈনিক লিমিট শেষ - কোন রিওয়ার্ড যোগ হয়নি",
            variant: "destructive"
          });
        }
        
        // Update earning eligibility
        setCanEarn(newAdsWatched < dailyLimit);
      }
    } catch (error) {
      console.error('Error completing ad:', error);
      toast({
        title: "ত্রুটি",
        description: "অ্যাড সম্পন্ন করতে সমস্যা হয়েছে",
        variant: "destructive"
      });
    }
    
    // Reset for next ad
    setTimeout(() => {
      setTimeLeft(adDuration);
      setProgress(0);
    }, 2000);
  };

  const pauseAd = () => {
    setIsWatching(false);
    toast({
      title: "অ্যাড পজ করা হয়েছে",
      description: "আবার চালু করতে Play বাটনে ক্লিক করুন",
      variant: "destructive"
    });
  };

  const resetAd = () => {
    setIsWatching(false);
    setTimeLeft(adDuration);
    setProgress(0);
    toast({
      title: "অ্যাড রিসেট করা হয়েছে",
      description: "নতুন করে শুরু করুন",
    });
  };

  if (isLoading) {
    return (
      <div className="p-4 space-y-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">অ্যাড ডেটা লোড হচ্ছে...</p>
        </div>
      </div>
    );
  }

  const remainingAds = Math.max(0, dailyLimit - adsWatchedToday);
  const progressPercentage = Math.min(100, (adsWatchedToday / dailyLimit) * 100);

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="text-center py-4">
        <h1 className="text-2xl font-bold text-white mb-2">প্রফেশনাল অ্যাড ভিউয়ার</h1>
        <p className="text-gray-400">
          প্রতিটি অ্যাড {adDuration} সেকেন্ড - ${rewardRate.toFixed(3)} USDT রিওয়ার্ড
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-gradient-to-r from-green-600/20 to-blue-600/20 border-green-500/30">
          <CardContent className="p-4 text-center">
            <DollarSign className="w-8 h-8 text-green-400 mx-auto mb-2" />
            <p className="text-white font-bold text-lg">${userBalance.toFixed(3)}</p>
            <p className="text-gray-400 text-sm">মোট ব্যালেন্স</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-blue-500/30">
          <CardContent className="p-4 text-center">
            <Eye className="w-8 h-8 text-blue-400 mx-auto mb-2" />
            <p className="text-white font-bold text-lg">{adsWatchedToday}/{dailyLimit}</p>
            <p className="text-gray-400 text-sm">আজকের অ্যাড</p>
          </CardContent>
        </Card>
      </div>

      {/* Daily Progress */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center justify-between">
            <span>দৈনিক অগ্রগতি</span>
            <Badge variant={canEarn ? "default" : "destructive"} className="bg-blue-600/20 text-blue-300">
              {remainingAds} বাকি
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Progress value={progressPercentage} className="w-full h-3" />
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">সম্পন্ন: {adsWatchedToday}</span>
              <span className="text-gray-400">লক্ষ্য: {dailyLimit}</span>
            </div>
            
            {!canEarn && (
              <div className="flex items-center space-x-2 p-3 bg-orange-600/20 border border-orange-500/30 rounded-lg">
                <AlertCircle className="w-5 h-5 text-orange-400" />
                <p className="text-orange-300 text-sm">
                  দৈনিক লিমিট শেষ! অ্যাড দেখতে পারবেন কিন্তু রিওয়ার্ড পাবেন না।
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Ad Viewer */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Zap className="w-5 h-5 mr-2 text-yellow-400" />
            প্রিমিয়াম অ্যাড ভিউয়ার
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Ad Display Area */}
          <div className="bg-gray-900 rounded-lg p-8 text-center border-2 border-dashed border-gray-600">
            {!isWatching && timeLeft === adDuration ? (
              <div className="space-y-4">
                <Play className="w-16 h-16 text-blue-400 mx-auto" />
                <h3 className="text-white text-xl font-bold">অ্যাড দেখার জন্য প্রস্তুত</h3>
                <p className="text-gray-400">
                  {adDuration} সেকেন্ড মনোযোগ সহকারে দেখুন এবং ${rewardRate.toFixed(3)} USDT আয় করুন
                </p>
                {canEarn && (
                  <div className="bg-green-600/20 border border-green-500/30 rounded-lg p-3">
                    <p className="text-green-300 text-sm">✅ রিওয়ার্ড পাওয়ার জন্য যোগ্য</p>
                  </div>
                )}
              </div>
            ) : isWatching ? (
              <div className="space-y-4">
                <div className="relative">
                  <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mx-auto flex items-center justify-center">
                    <Clock className="w-12 h-12 text-white" />
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold text-white">{timeLeft}</span>
                  </div>
                </div>
                <h3 className="text-white text-xl font-bold">অ্যাড চলছে...</h3>
                <div className="space-y-2">
                  <Progress value={progress} className="w-full h-4" />
                  <p className="text-gray-400">
                    {timeLeft} সেকেন্ড বাকি • {progress.toFixed(0)}% সম্পন্ন
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <CheckCircle className="w-16 h-16 text-green-400 mx-auto" />
                <h3 className="text-white text-xl font-bold">অ্যাড সম্পন্ন!</h3>
                <p className="text-gray-400">
                  {canEarn ? `আপনি $${rewardRate.toFixed(3)} USDT পেয়েছেন!` : 'দৈনিক লিমিট শেষ'}
                </p>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex justify-center space-x-4">
            {!isWatching && timeLeft === adDuration ? (
              <Button
                onClick={startWatchingAd}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-8 py-3"
                disabled={!userInfo}
              >
                <Play className="w-5 h-5 mr-2" />
                অ্যাড শুরু করুন
              </Button>
            ) : isWatching ? (
              <>
                <Button
                  onClick={pauseAd}
                  variant="outline"
                  className="border-gray-600 text-white hover:bg-gray-700"
                >
                  <Pause className="w-4 h-4 mr-2" />
                  পজ
                </Button>
                <Button
                  onClick={resetAd}
                  variant="outline"
                  className="border-gray-600 text-white hover:bg-gray-700"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  রিসেট
                </Button>
              </>
            ) : (
              <Button
                onClick={startWatchingAd}
                className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 px-8 py-3"
                disabled={!userInfo}
              >
                <Play className="w-5 h-5 mr-2" />
                পরবর্তী অ্যাড
              </Button>
            )}
          </div>

          {/* Info Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-600/10 p-4 rounded-lg text-center">
              <Clock className="w-6 h-6 text-blue-400 mx-auto mb-2" />
              <p className="text-white font-medium">প্রতি অ্যাড</p>
              <p className="text-gray-400 text-sm">{adDuration} সেকেন্ড</p>
            </div>
            <div className="bg-green-600/10 p-4 rounded-lg text-center">
              <DollarSign className="w-6 h-6 text-green-400 mx-auto mb-2" />
              <p className="text-white font-medium">রিওয়ার্ড</p>
              <p className="text-gray-400 text-sm">${rewardRate.toFixed(3)} USDT</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tips */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">💡 অ্যাড দেখার টিপস</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              <p className="text-gray-300 text-sm">পুরো সময় ধরে মনোযোগ সহকারে দেখুন</p>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <p className="text-gray-300 text-sm">অ্যাড চলাকালীন অন্য ট্যাব খুলবেন না</p>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
              <p className="text-gray-300 text-sm">দৈনিক {dailyLimit}টি অ্যাড দেখে সর্বোচ্চ আয় করুন</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdViewerPage;
