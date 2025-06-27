
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Ad {
  id: string;
  type: 'image' | 'html';
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

  const maxAdsPerDay = 30;

  useEffect(() => {
    loadNextAd();
    loadTodayStats();
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
      // This would load from Google Sheets API
      // Mock ad data for now
      const mockAds: Ad[] = [
        {
          id: '1',
          type: 'image',
          content: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=300&fit=crop',
          link: 'https://example.com',
          reward: 0.05
        },
        {
          id: '2',
          type: 'html',
          content: '<div style="background: linear-gradient(45deg, #FF6B6B, #4ECDC4); padding: 40px; text-align: center; color: white; border-radius: 10px;"><h2>Special Offer!</h2><p>Get 50% off your next purchase</p></div>',
          link: 'https://example.com/offer',
          reward: 0.08
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
      // Update ads watched count
      const today = new Date().toDateString();
      const newCount = adsWatchedToday + 1;
      localStorage.setItem(`ads_watched_${today}`, newCount.toString());
      setAdsWatchedToday(newCount);

      // Add earnings (this would sync with Google Sheets)
      const currentBalance = parseFloat(localStorage.getItem('balance') || '0');
      const newBalance = currentBalance + currentAd.reward;
      localStorage.setItem('balance', newBalance.toString());

      toast({
        title: "Earned!",
        description: `You earned $${currentAd.reward.toFixed(2)} USDT`,
      });

      // Open ad link if available
      if (currentAd.link) {
        window.open(currentAd.link, '_blank');
      }

      // Load next ad if user hasn't reached daily limit
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
              Reset in: {new Date(Date.now() + 24 * 60 * 60 * 1000).toLocaleTimeString()}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="text-center py-4">
        <h1 className="text-2xl font-bold text-white mb-2">Watch & Earn</h1>
        <p className="text-gray-400">
          Progress: {adsWatchedToday}/{maxAdsPerDay} ads today
        </p>
      </div>

      {/* Ad Display */}
      {isLoading ? (
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-6 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-white">Loading advertisement...</p>
          </CardContent>
        </Card>
      ) : currentAd ? (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center justify-between">
              <span>Advertisement</span>
              <span className="text-green-400">${currentAd.reward.toFixed(2)}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Ad Content */}
            <div className="bg-gray-700 rounded-lg p-4 min-h-[200px] flex items-center justify-center">
              {currentAd.type === 'image' ? (
                <img 
                  src={currentAd.content} 
                  alt="Advertisement" 
                  className="max-w-full max-h-full rounded-lg"
                />
              ) : (
                <div 
                  dangerouslySetInnerHTML={{ __html: currentAd.content }}
                  className="w-full"
                />
              )}
            </div>

            {/* Timer */}
            {countdown > 0 && (
              <div className="text-center">
                <div className="flex items-center justify-center space-x-2 text-orange-400">
                  <Clock className="w-5 h-5" />
                  <span className="text-lg font-semibold">{countdown}s</span>
                </div>
                <p className="text-sm text-gray-400 mt-1">Please wait to earn</p>
              </div>
            )}

            {/* Earn Button */}
            <Button
              onClick={handleEarnNow}
              disabled={!canEarn}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600"
            >
              {canEarn ? `Earn $${currentAd.reward.toFixed(2)} Now` : 'Please Wait...'}
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {/* Next Ad Button */}
      {canEarn && (
        <Button
          onClick={loadNextAd}
          variant="outline"
          className="w-full border-gray-600 text-white hover:bg-gray-700"
        >
          Load Next Ad
        </Button>
      )}
    </div>
  );
};

export default AdViewerPage;
