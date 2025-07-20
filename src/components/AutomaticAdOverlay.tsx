import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Clock } from 'lucide-react';

interface AutomaticAdOverlayProps {
  onAdComplete: () => void;
}

const AutomaticAdOverlay: React.FC<AutomaticAdOverlayProps> = ({ onAdComplete }) => {
  const [countdown, setCountdown] = useState(5);
  const [showAd, setShowAd] = useState(false);

  useEffect(() => {
    setShowAd(true);
    
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
  }, []);

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
                <div className="text-2xl font-bold mb-2">Advertisement</div>
                <div className="text-sm opacity-80">Auto Ad Playing</div>
              </div>
            </div>
            
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