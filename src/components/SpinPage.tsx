
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

const SpinPage: React.FC = () => {
  const [spinsUsed, setSpinsUsed] = useState(0);
  const [adsWatched, setAdsWatched] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const { toast } = useToast();

  const maxSpins = 30;
  const prizes = [
    { label: '$0.01', value: 0.01, color: 'bg-red-500' },
    { label: '$0.05', value: 0.05, color: 'bg-blue-500' },
    { label: '$0.02', value: 0.02, color: 'bg-green-500' },
    { label: '$0.10', value: 0.10, color: 'bg-yellow-500' },
    { label: '$0.03', value: 0.03, color: 'bg-purple-500' },
    { label: '$0.20', value: 0.20, color: 'bg-pink-500' },
    { label: '$0.04', value: 0.04, color: 'bg-indigo-500' },
    { label: '$0.50', value: 0.50, color: 'bg-orange-500' }
  ];

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = () => {
    const today = new Date().toDateString();
    const storedSpins = localStorage.getItem(`spins_used_${today}`);
    const storedAds = localStorage.getItem(`ads_watched_${today}`);
    
    setSpinsUsed(parseInt(storedSpins || '0'));
    setAdsWatched(parseInt(storedAds || '0'));
  };

  const canSpin = () => {
    return spinsUsed < maxSpins && adsWatched > spinsUsed;
  };

  const handleSpin = async () => {
    if (!canSpin() || isSpinning) return;

    setIsSpinning(true);
    
    // Random rotation (multiple full rotations + random position)
    const spins = 5 + Math.random() * 5; // 5-10 full rotations
    const finalRotation = rotation + (spins * 360);
    setRotation(finalRotation);

    // Determine prize based on final position
    setTimeout(() => {
      const normalizedRotation = finalRotation % 360;
      const sectionSize = 360 / prizes.length;
      const prizeIndex = Math.floor(normalizedRotation / sectionSize);
      const wonPrize = prizes[prizeIndex];

      // Update stats
      const today = new Date().toDateString();
      const newSpinsUsed = spinsUsed + 1;
      localStorage.setItem(`spins_used_${today}`, newSpinsUsed.toString());
      setSpinsUsed(newSpinsUsed);

      // Add winnings
      const currentBalance = parseFloat(localStorage.getItem('balance') || '0');
      const newBalance = currentBalance + wonPrize.value;
      localStorage.setItem('balance', newBalance.toString());

      toast({
        title: "Congratulations!",
        description: `You won ${wonPrize.label} USDT!`,
      });

      setIsSpinning(false);
    }, 3000);
  };

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="text-center py-4">
        <h1 className="text-2xl font-bold text-white mb-2">Spin & Win</h1>
        <p className="text-gray-400">
          Spins available: {maxSpins - spinsUsed}/{maxSpins}
        </p>
      </div>

      {/* Spin Wheel */}
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-6">
          <div className="relative w-80 h-80 mx-auto">
            {/* Pointer */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 z-10">
              <div className="w-0 h-0 border-l-[15px] border-r-[15px] border-b-[30px] border-l-transparent border-r-transparent border-b-white"></div>
            </div>
            
            {/* Wheel */}
            <div 
              className={`w-full h-full rounded-full border-4 border-white relative overflow-hidden transition-transform duration-3000 ease-out ${isSpinning ? 'animate-spin' : ''}`}
              style={{ transform: `rotate(${rotation}deg)` }}
            >
              {prizes.map((prize, index) => {
                const rotation = (360 / prizes.length) * index;
                return (
                  <div
                    key={index}
                    className={`absolute w-1/2 h-1/2 origin-bottom-right ${prize.color}`}
                    style={{
                      transform: `rotate(${rotation}deg)`,
                      clipPath: 'polygon(0 0, 100% 0, 50% 100%)'
                    }}
                  >
                    <div className="absolute top-4 right-8 text-white font-bold text-sm transform -rotate-45">
                      {prize.label}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Spin Button */}
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-6 space-y-4">
          {!canSpin() ? (
            <div className="text-center">
              <p className="text-gray-400 mb-4">
                {spinsUsed >= maxSpins 
                  ? "You've used all your spins for today!"
                  : `Watch ${spinsUsed + 1 - adsWatched} more ads to unlock a spin`
                }
              </p>
              <Button 
                disabled 
                className="w-full bg-gray-600"
              >
                {spinsUsed >= maxSpins ? "Daily Limit Reached" : "Spin Locked"}
              </Button>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-gray-400 mb-4">
                Ready to spin! Good luck!
              </p>
              <Button
                onClick={handleSpin}
                disabled={isSpinning}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                {isSpinning ? "Spinning..." : "SPIN NOW!"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Prize List */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white text-lg">Possible Prizes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-2">
            {prizes.map((prize, index) => (
              <div key={index} className={`${prize.color} text-white text-center py-2 rounded text-sm font-semibold`}>
                {prize.label}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SpinPage;
