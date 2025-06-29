
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Activity, Users } from 'lucide-react';

interface HomePageProps {
  userInfo: any;
  referralCount: number;
  userBalance: number;
  updateUserBalance: (newBalance: number) => void;
}

const HomePage: React.FC<HomePageProps> = ({ userInfo, referralCount, userBalance, updateUserBalance }) => {
  const [stats, setStats] = useState({
    balance: 0,
    adsWatched: 0,
    spinsUsed: 0,
    referrals: 0
  });

  useEffect(() => {
    // Load user stats and use the actual balance from props
    loadUserStats();
  }, [userBalance, referralCount]);

  const loadUserStats = async () => {
    try {
      // Use actual data from props instead of mock data
      setStats({
        balance: userBalance,
        adsWatched: 15, // This would come from database
        spinsUsed: 8,   // This would come from database
        referrals: referralCount
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="text-center py-6">
        <div className="mx-auto mb-4 w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
          <DollarSign className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">
          Ads by USDT Earn
        </h1>
        <p className="text-gray-400">
          Welcome back, {userInfo?.first_name || 'Earner'}!
        </p>
      </div>

      {/* Balance Card */}
      <Card className="bg-gradient-to-r from-green-600 to-blue-600 border-none">
        <CardContent className="p-6 text-center">
          <h2 className="text-lg font-semibold text-white mb-2">Your Balance</h2>
          <p className="text-4xl font-bold text-white">
            ${stats.balance.toFixed(3)}
          </p>
          <p className="text-green-100 mt-2">USDT Equivalent</p>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-400 flex items-center">
              <Activity className="w-4 h-4 mr-2" />
              Ads Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-white">{stats.adsWatched}/30</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-400 flex items-center">
              <Users className="w-4 h-4 mr-2" />
              Referrals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-white">{stats.referrals}</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-400 flex items-center">
              <DollarSign className="w-4 h-4 mr-2" />
              Today's Earn
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-white">$0.000</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-400 flex items-center">
              <Activity className="w-4 h-4 mr-2" />
              Total Earned
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-white">${userBalance.toFixed(3)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-white">Quick Actions</h3>
        <div className="text-sm text-gray-400 space-y-2">
          <p>• Watch ads to earn USDT</p>
          <p>• Refer friends for extra income</p>
          <p>• Withdraw your earnings anytime</p>
          <p>• Join our Telegram channels for updates</p>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
