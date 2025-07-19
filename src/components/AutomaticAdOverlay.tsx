import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Clock } from 'lucide-react';

interface AutomaticAdOverlayProps {
  onAdComplete: () => void;
  adType: 'automatic' | 'adsgram';
}

const AutomaticAdOverlay: React.FC<AutomaticAdOverlayProps> = ({ onAdComplete, adType }) => {
  const [countdown, setCountdown] = useState(5);
  const [showAd, setShowAd] = useState(false);
  const [adsgramLoaded, setAdsgramLoaded] = useState(false);

  useEffect(() => {
    setShowAd(true);
    
    if (adType === 'adsgram') {
      // Initialize AdsGram
      if ((window as any).Adsgram) {
        const AdController = (window as any).Adsgram.init({ blockId: "int-12841" });
        AdController.show().then((result: any) => {
          if (result.done) {
            handleAdComplete();
          }
        }).catch((error: any) => {
          console.log('AdsGram error:', error);
          handleAdComplete();
        });
        setAdsgramLoaded(true);
      } else {
        // Fallback if AdsGram not loaded
        setTimeout(handleAdComplete, 5000);
      }
    } else {
      // Original automatic ad timer
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            handleAdComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [adType]);

  const handleAdComplete = () => {
    setShowAd(false);
    onAdComplete();
  };

  const handleClose = () => {
    if (countdown <= 2) {
      handleAdComplete();
    }
  };

  if (!showAd) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-gray-900 border-gray-700">
        <CardContent className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-yellow-400" />
              <h3 className="text-white font-bold">Automatic Ad</h3>
            </div>
            {countdown <= 2 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className="text-gray-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
          
          <div className="text-center space-y-4">
            <div className="w-full h-32 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <div className="text-white text-center">
                <div className="text-2xl font-bold mb-2">
                  {adType === 'adsgram' ? 'AdsGram Ad' : 'Advertisement'}
                </div>
                <div className="text-sm opacity-80">
                  {adType === 'adsgram' ? 'Loading Ad...' : 'Auto Ad Playing'}
                </div>
              </div>
            </div>
            
            {adType === 'automatic' && (
              <div className="space-y-2">
                <div className="text-white text-lg font-bold">
                  Ad closes in: {countdown}s
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-blue-600 to-green-600 h-2 rounded-full transition-all duration-1000"
                    style={{ width: `${((5 - countdown) / 5) * 100}%` }}
                  />
                </div>
              </div>
            )}
            
            {adType === 'adsgram' && (
              <div className="space-y-2">
                <div className="text-white text-lg font-bold">
                  {adsgramLoaded ? 'Watch the ad to earn!' : 'Loading AdsGram...'}
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div className="bg-gradient-to-r from-green-600 to-blue-600 h-2 rounded-full animate-pulse" />
                </div>
              </div>
            )}
            
            <div className="text-gray-400 text-sm">
              Earning: $0.001 USDT
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AutomaticAdOverlay;