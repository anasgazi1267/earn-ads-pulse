
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  DollarSign, 
  Users, 
  Play, 
  Gift,
  Trophy,
  Star,
  TrendingUp,
  Zap,
  Target,
  Award
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '../contexts/AdminContext';

interface HomePageProps {
  userInfo: any;
  referralCount: number;
  userBalance: number;
  adsWatched: number;
  updateUserBalance: (newBalance: number) => void;
}

const HomePage: React.FC<HomePageProps> = ({ 
  userInfo, 
  referralCount, 
  userBalance, 
  adsWatched,
  updateUserBalance 
}) => {
  const navigate = useNavigate();
  const { settings } = useAdmin();
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) {
      setGreeting('সুপ্রভাত');
    } else if (hour < 17) {
      setGreeting('শুভ বিকাল');
    } else {
      setGreeting('শুভ সন্ধ্যা');
    }
  }, []);

  const dailyAdLimit = parseInt(settings.dailyAdLimit) || 30;
  const adsRemaining = Math.max(0, dailyAdLimit - adsWatched);
  const progressPercentage = Math.min(100, (adsWatched / dailyAdLimit) * 100);

  const quickActions = [
    {
      title: 'অ্যাড দেখুন',
      subtitle: `${adsRemaining} টি বাকি`,
      icon: Play,
      color: 'from-blue-500 to-purple-600',
      action: () => navigate('/ads'),
      disabled: adsRemaining === 0
    },
    {
      title: 'টাস্ক সম্পন্ন করুন',
      subtitle: 'আরও আয় করুন',
      icon: Target,
      color: 'from-green-500 to-blue-500',
      action: () => navigate('/tasks')
    },
    {
      title: 'রেফার করুন',
      subtitle: `${referralCount} জন রেফার`,
      icon: Users,
      color: 'from-orange-500 to-red-500',
      action: () => navigate('/referral')
    },
    {
      title: 'উইথড্র করুন',
      subtitle: 'USDT পেমেন্ট',
      icon: DollarSign,
      color: 'from-purple-500 to-pink-500',
      action: () => navigate('/withdraw')
    }
  ];

  return (
    <div className="p-4 space-y-6">
      {/* Welcome Header */}
      <div className="text-center py-6">
        <h1 className="text-3xl font-bold text-white mb-2">
          {greeting}, {userInfo?.first_name || 'User'}! 👋
        </h1>
        <p className="text-gray-400 mb-4">
          আজকের আয়ের জন্য প্রস্তুত হয়ে যান
        </p>
        
        {/* Balance Card */}
        <Card className="bg-gradient-to-r from-green-600 to-blue-600 border-none shadow-2xl">
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-white text-sm opacity-90 mb-2">মোট ব্যালেন্স</p>
              <div className="flex items-center justify-center space-x-2">
                <DollarSign className="w-8 h-8 text-white" />
                <span className="text-4xl font-bold text-white">
                  {userBalance.toFixed(3)}
                </span>
                <span className="text-xl text-white opacity-75">USDT</span>
              </div>
              <div className="mt-3 flex justify-center space-x-4">
                <div className="text-center">
                  <Award className="w-5 h-5 text-white mx-auto mb-1" />
                  <p className="text-white text-xs">প্রিমিয়াম</p>
                </div>
                <div className="text-center">
                  <Zap className="w-5 h-5 text-white mx-auto mb-1" />
                  <p className="text-white text-xs">দ্রুত পেমেন্ট</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Daily Progress */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-blue-400" />
            আজকের অগ্রগতি
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-300">অ্যাড দেখেছেন</span>
              <Badge variant="secondary" className="bg-blue-600/20 text-blue-300">
                {adsWatched}/{dailyAdLimit}
              </Badge>
            </div>
            
            <div className="w-full bg-gray-700 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
            
            <div className="grid grid-cols-3 gap-4 pt-2">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-400">{adsWatched}</p>
                <p className="text-gray-400 text-sm">সম্পন্ন</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-400">{adsRemaining}</p>
                <p className="text-gray-400 text-sm">বাকি</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-400">{referralCount}</p>
                <p className="text-gray-400 text-sm">রেফার</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white flex items-center">
          <Star className="w-5 h-5 mr-2 text-yellow-400" />
          দ্রুত অ্যাকশন
        </h2>
        
        <div className="grid grid-cols-2 gap-4">
          {quickActions.map((action, index) => (
            <Card 
              key={index}
              className={`bg-gradient-to-br ${action.color} border-none cursor-pointer transform transition-all duration-200 hover:scale-105 ${
                action.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg'
              }`}
              onClick={action.disabled ? undefined : action.action}
            >
              <CardContent className="p-4">
                <div className="text-center text-white">
                  <action.icon className="w-8 h-8 mx-auto mb-2" />
                  <h3 className="font-bold text-sm">{action.title}</h3>
                  <p className="text-xs opacity-90 mt-1">{action.subtitle}</p>
                  {action.disabled && (
                    <p className="text-xs mt-1 bg-black/20 px-2 py-1 rounded">
                      আজকের লিমিট শেষ
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Achievement Section */}
      <Card className="bg-gradient-to-r from-yellow-600/20 to-orange-600/20 border-yellow-500/30">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Trophy className="w-5 h-5 mr-2 text-yellow-400" />
            আপনার অর্জন
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-yellow-600/10 rounded-lg">
              <Gift className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
              <p className="text-white font-bold">প্রিমিয়াম সদস্য</p>
              <p className="text-gray-400 text-xs">বিশেষ সুবিধা</p>
            </div>
            <div className="text-center p-3 bg-green-600/10 rounded-lg">
              <Zap className="w-6 h-6 text-green-400 mx-auto mb-2" />
              <p className="text-white font-bold">দ্রুত আয়কারী</p>
              <p className="text-gray-400 text-xs">তাৎক্ষণিক পেমেন্ট</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tips Section */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">💡 আজকের টিপস</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center space-x-3 p-3 bg-blue-600/10 rounded-lg">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              <p className="text-gray-300 text-sm">
                প্রতিদিন নিয়মিত অ্যাড দেখে আরও বেশি আয় করুন
              </p>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-green-600/10 rounded-lg">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <p className="text-gray-300 text-sm">
                বন্ধুদের রেফার করে অতিরিক্ত বোনাস পান
              </p>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-purple-600/10 rounded-lg">
              <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
              <p className="text-gray-300 text-sm">
                টাস্ক সম্পন্ন করে দ্বিগুণ রিওয়ার্ড পান
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default HomePage;
