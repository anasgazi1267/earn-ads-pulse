import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DollarSign, 
  Eye, 
  Users, 
  Gift, 
  Trophy,
  TrendingUp,
  Zap,
  Target,
  Wallet,
  Plus
} from 'lucide-react';

interface NewHomePageProps {
  userInfo: any;
  referralCount: number;
  userBalance: number;
  adsWatched: number;
  setCurrentPage: (page: string) => void;
}

const NewHomePage: React.FC<NewHomePageProps> = ({ 
  userInfo, 
  referralCount, 
  userBalance, 
  adsWatched,
  setCurrentPage
}) => {
  const quickActions = [
    {
      title: "Watch Ads",
      description: "Start earning by watching ads",
      icon: <Eye className="w-6 h-6" />,
      color: "bg-blue-600 hover:bg-blue-700",
      action: () => setCurrentPage('ad-viewer')
    },
    {
      title: "Complete Tasks",
      description: "Earn more with special tasks",
      icon: <Target className="w-6 h-6" />,
      color: "bg-green-600 hover:bg-green-700",
      action: () => setCurrentPage('tasks')
    },
    {
      title: "Invite Friends",
      description: "Get $0.01 per referral",
      icon: <Users className="w-6 h-6" />,
      color: "bg-purple-600 hover:bg-purple-700",
      action: () => setCurrentPage('referral')
    },
    {
      title: "Deposit & Convert",
      description: "Add funds to upload tasks",
      icon: <Wallet className="w-6 h-6" />,
      color: "bg-green-600 hover:bg-green-700",
      action: () => setCurrentPage('deposit')
    },
    {
      title: "Upload Task",
      description: "Create your own tasks",
      icon: <Plus className="w-6 h-6" />,
      color: "bg-purple-600 hover:bg-purple-700",
      action: () => setCurrentPage('task-upload')
    }
  ];

  return (
    <div className="p-4 space-y-6">
      {/* Welcome Header */}
      <div className="text-center py-6">
        <div className="mb-4">
          <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <DollarSign className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Welcome back, {userInfo?.first_name || 'User'}!
          </h1>
          <p className="text-gray-400">
            Start earning USDT by watching ads and completing tasks
          </p>
        </div>
        
        {/* Balance Display */}
        <Card className="bg-gradient-to-r from-green-600 to-blue-600 border-none">
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-white text-sm opacity-90 mb-2">Your Balance</p>
              <div className="flex items-center justify-center space-x-2">
                <DollarSign className="w-8 h-8 text-white" />
                <span className="text-4xl font-bold text-white">
                  {userBalance.toFixed(3)}
                </span>
                <span className="text-white text-lg">USDT</span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-white/70">Earning Balance</p>
                  <p className="text-white font-bold">${userBalance.toFixed(3)}</p>
                </div>
                <div>
                  <p className="text-white/70">Deposit Balance</p>
                  <p className="text-white font-bold">${(userInfo?.deposit_balance || 0).toFixed(3)}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4 text-center">
            <Eye className="w-8 h-8 text-blue-400 mx-auto mb-2" />
            <p className="text-white font-bold text-xl">{adsWatched}</p>
            <p className="text-gray-400 text-sm">Ads Today</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4 text-center">
            <Users className="w-8 h-8 text-purple-400 mx-auto mb-2" />
            <p className="text-white font-bold text-xl">{referralCount}</p>
            <p className="text-gray-400 text-sm">Referrals</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center space-x-2">
            <Zap className="w-5 h-5 text-yellow-400" />
            <span>Quick Actions</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {quickActions.map((action, index) => (
            <Button
              key={index}
              onClick={action.action}
              className={`w-full ${action.color} text-white p-4 h-auto flex items-center justify-between`}
            >
              <div className="flex items-center space-x-3">
                {action.icon}
                <div className="text-left">
                  <p className="font-medium">{action.title}</p>
                  <p className="text-sm opacity-90">{action.description}</p>
                </div>
              </div>
              <div className="text-2xl">→</div>
            </Button>
          ))}
        </CardContent>
      </Card>

      {/* Earnings Breakdown */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-green-400" />
            <span>Earning Opportunities</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center p-3 bg-blue-600/10 rounded-lg border border-blue-600/30">
            <div className="flex items-center space-x-3">
              <Eye className="w-6 h-6 text-blue-400" />
              <div>
                <p className="text-white font-medium">Watch Ads</p>
                <p className="text-gray-400 text-sm">$0.001 per ad (Auto every 20s)</p>
              </div>
            </div>
            <Badge variant="secondary" className="bg-blue-600/20 text-blue-300">
              Active
            </Badge>
          </div>

          <div className="flex justify-between items-center p-3 bg-green-600/10 rounded-lg border border-green-600/30">
            <div className="flex items-center space-x-3">
              <Target className="w-6 h-6 text-green-400" />
              <div>
                <p className="text-white font-medium">Complete Tasks</p>
                <p className="text-gray-400 text-sm">$0.005+ per task</p>
              </div>
            </div>
            <Badge variant="secondary" className="bg-green-600/20 text-green-300">
              Available
            </Badge>
          </div>

          <div className="flex justify-between items-center p-3 bg-purple-600/10 rounded-lg border border-purple-600/30">
            <div className="flex items-center space-x-3">
              <Users className="w-6 h-6 text-purple-400" />
              <div>
                <p className="text-white font-medium">Referral Program</p>
                <p className="text-gray-400 text-sm">$0.01 per friend</p>
              </div>
            </div>
            <Badge variant="secondary" className="bg-purple-600/20 text-purple-300">
              Unlimited
            </Badge>
          </div>

          <div className="flex justify-between items-center p-3 bg-yellow-600/10 rounded-lg border border-yellow-600/30">
            <div className="flex items-center space-x-3">
              <Plus className="w-6 h-6 text-yellow-400" />
              <div>
                <p className="text-white font-medium">Upload Tasks</p>
                <p className="text-gray-400 text-sm">Min $0.005 CPC, $1 budget</p>
              </div>
            </div>
            <Badge variant="secondary" className="bg-yellow-600/20 text-yellow-300">
              New
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Payment Methods */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center space-x-2">
            <Wallet className="w-5 h-5 text-green-400" />
            <span>Payment Methods</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="bg-green-600/10 border border-green-600/30 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Binance Pay</p>
                <p className="text-gray-400 text-sm">Admin ID: 787819330</p>
              </div>
              <Badge className="bg-green-600">Active</Badge>
            </div>
          </div>
          <div className="bg-blue-600/10 border border-blue-600/30 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Payeer</p>
                <p className="text-gray-400 text-sm">Admin ID: P1102512228</p>
              </div>
              <Badge className="bg-blue-600">Active</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Achievement Section */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center space-x-2">
            <Trophy className="w-5 h-5 text-yellow-400" />
            <span>Your Progress</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Daily Goal</span>
            <span className="text-white">{adsWatched}/10 ads</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-600 to-green-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.min((adsWatched / 10) * 100, 100)}%` }}
            ></div>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Referral Goal</span>
            <span className="text-white">{referralCount}/5 friends</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-purple-600 to-pink-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.min((referralCount / 5) * 100, 100)}%` }}
            ></div>
          </div>
        </CardContent>
      </Card>

      {/* Tips Section */}
      <Card className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-blue-500/30">
        <CardHeader>
          <CardTitle className="text-white flex items-center space-x-2">
            <Gift className="w-5 h-5 text-yellow-400" />
            <span>Pro Tips</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-gray-300 text-sm">
            💡 Ads appear automatically every 20 seconds
          </p>
          <p className="text-gray-300 text-sm">
            🚀 Upload tasks with deposit balance for higher earnings
          </p>
          <p className="text-gray-300 text-sm">
            👥 Invite 5 friends to unlock withdrawal feature
          </p>
          <p className="text-gray-300 text-sm">
            💰 Use Binance Pay (787819330) or Payeer (P1102512228)
          </p>
          <p className="text-gray-300 text-sm">
            ⚡ One device per account - keep your account secure
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default NewHomePage;