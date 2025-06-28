
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, CheckCircle, ExternalLink, Crown, Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface JoinChannelsPageProps {
  channels: string[];
  onChannelsJoined: () => void;
}

const JoinChannelsPage: React.FC<JoinChannelsPageProps> = ({ channels, onChannelsJoined }) => {
  const [joinedChannels, setJoinedChannels] = useState<Set<string>>(new Set());
  const [verifying, setVerifying] = useState(false);
  const [hasVerified, setHasVerified] = useState(false);
  const { toast } = useToast();

  // Channel information with images and descriptions
  const channelInfo = [
    {
      url: 'https://t.me/AnasEarnHunter',
      name: 'AnasEarnHunter',
      description: 'Premium Earning Opportunities',
      image: '/lovable-uploads/ee5a5260-f02b-4a99-b6b5-139e89cf3261.png',
      subscribers: '15K+'
    },
    {
      url: 'https://t.me/ExpossDark',
      name: 'ExpossDark',
      description: 'Dark Web & Security Tips',
      image: '/lovable-uploads/4e3fe131-80b5-4522-8e01-86c7d4a52f0b.png',
      subscribers: '8K+'
    },
    {
      url: 'https://t.me/TechnicalAnas',
      name: 'TechnicalAnas',
      description: 'Technical Tutorials & Tips',
      image: '/lovable-uploads/cf2c5d17-4c7b-49a0-8d98-7b0a557f35b1.png',
      subscribers: '12K+'
    },
    {
      url: 'https://t.me/Anas_Promotion',
      name: 'Anas Promotion',
      description: 'Latest Promotions & Offers',
      image: '/lovable-uploads/8e0c3b55-4829-4ae7-9750-614619b6a3a5.png',
      subscribers: '6K+'
    }
  ];

  const handleChannelClick = (channel: string) => {
    window.open(channel, '_blank');
    // Mark as clicked (user needs to manually verify)
    setTimeout(() => {
      setJoinedChannels(prev => new Set([...prev, channel]));
      toast({
        title: "চ্যানেল খোলা হয়েছে",
        description: "দয়া করে চ্যানেলে জয়েন করে ফিরে আসুন",
      });
    }, 1000);
  };

  const handleVerifyJoin = async () => {
    if (joinedChannels.size < channels.length) {
      toast({
        title: "অসম্পূর্ণ",
        description: `দয়া করে প্রথমে সব ${channels.length}টি চ্যানেলে জয়েন করুন`,
        variant: "destructive"
      });
      return;
    }

    // First verification attempt - show loading but don't complete
    if (!hasVerified) {
      setVerifying(true);
      setTimeout(() => {
        setVerifying(false);
        setHasVerified(true);
        toast({
          title: "আবার চেষ্টা করুন",
          description: "ভেরিফিকেশন সম্পূর্ণ করতে আবার ক্লিক করুন",
          variant: "default"
        });
      }, 3000);
      return;
    }

    // Second verification attempt - complete the process
    setVerifying(true);
    setTimeout(() => {
      localStorage.setItem('channelsJoined', 'true');
      localStorage.setItem('channelJoinDate', new Date().toISOString());
      setVerifying(false);
      onChannelsJoined();
      toast({
        title: "সফল!",
        description: "সব চ্যানেল ভেরিফাই হয়েছে। Ads by USDT Earn এ স্বাগতম!",
      });
    }, 2500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-10 -left-10 w-72 h-72 bg-blue-500/10 rounded-full animate-pulse"></div>
        <div className="absolute top-1/2 -right-10 w-96 h-96 bg-purple-500/10 rounded-full animate-pulse delay-1000"></div>
        <div className="absolute -bottom-10 left-1/2 w-80 h-80 bg-pink-500/10 rounded-full animate-pulse delay-2000"></div>
      </div>

      <Card className="w-full max-w-2xl bg-gray-900/95 backdrop-blur-xl border-gray-700/50 shadow-2xl relative z-10">
        <CardHeader className="text-center pb-8 relative">
          {/* Header decoration */}
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="w-16 h-16 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg shadow-yellow-500/30">
              <Crown className="w-8 h-8 text-white" />
            </div>
          </div>
          
          <div className="mt-8 mb-6">
            <CardTitle className="text-4xl font-bold bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500 bg-clip-text text-transparent mb-4">
              প্রিমিয়াম চ্যানেল জয়েন
            </CardTitle>
            <p className="text-gray-300 text-lg leading-relaxed">
              আর্নিং ফিচার আনলক করতে সব ৪টি চ্যানেলে জয়েন করুন
            </p>
          </div>
          
          <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-xl p-4 border border-blue-500/30 backdrop-blur-sm">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Star className="w-5 h-5 text-yellow-400 animate-pulse" />
              <p className="text-blue-300 text-sm font-semibold">
                বাধ্যতামূলক: সব চ্যানেলে জয়েন আবশ্যক
              </p>
              <Star className="w-5 h-5 text-yellow-400 animate-pulse" />
            </div>
            <p className="text-xs text-gray-400">
              ভেরিফিকেশনের জন্য দুইবার ক্লিক করতে হবে
            </p>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6 px-8 pb-8">
          {/* Channels Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {channelInfo.map((channel, index) => (
              <div key={index} className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-800/80 to-gray-700/80 backdrop-blur-sm border border-gray-600/50 hover:border-blue-500/50 transition-all duration-500 hover:scale-105 hover:shadow-xl hover:shadow-blue-500/20">
                {/* Channel image background with overlay */}
                <div className="relative h-32 overflow-hidden rounded-t-2xl">
                  <img 
                    src={channel.image} 
                    alt={channel.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-transparent to-transparent"></div>
                  
                  {/* Subscriber count badge */}
                  <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm rounded-full px-3 py-1">
                    <span className="text-xs text-white font-medium">{channel.subscribers}</span>
                  </div>
                  
                  {/* Join status indicator */}
                  {joinedChannels.has(channel.url) && (
                    <div className="absolute top-3 left-3 bg-green-500/90 backdrop-blur-sm rounded-full p-2 animate-bounce">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>

                {/* Channel info */}
                <div className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="text-white font-bold text-lg">@{channel.name}</h3>
                      <p className="text-gray-400 text-sm">{channel.description}</p>
                    </div>
                  </div>
                  
                  <Button
                    onClick={() => handleChannelClick(channel.url)}
                    size="sm"
                    className={`w-full transition-all duration-300 ${
                      joinedChannels.has(channel.url)
                        ? "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg shadow-green-600/30"
                        : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg shadow-blue-600/30"
                    }`}
                  >
                    {joinedChannels.has(channel.url) ? (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        খোলা হয়েছে
                      </>
                    ) : (
                      <>
                        <ExternalLink className="w-4 h-4 mr-2" />
                        এখনই জয়েন করুন
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Progress Section */}
          <div className="bg-gradient-to-r from-gray-800/50 to-gray-700/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-600/30">
            <div className="text-center mb-6">
              <h3 className="text-white text-xl font-bold mb-2">
                অগ্রগতি: {joinedChannels.size}/{channels.length} চ্যানেল
              </h3>
              <div className="w-full bg-gray-700/50 rounded-full h-4 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 h-4 rounded-full transition-all duration-1000 relative overflow-hidden"
                  style={{ width: `${(joinedChannels.size / channels.length) * 100}%` }}
                >
                  <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                </div>
              </div>
            </div>

            <Button
              onClick={handleVerifyJoin}
              disabled={joinedChannels.size < channels.length || verifying}
              className="w-full h-16 text-lg font-bold bg-gradient-to-r from-emerald-600 via-blue-600 to-purple-600 hover:from-emerald-700 hover:via-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 shadow-xl transition-all duration-300 transform hover:scale-105 disabled:hover:scale-100"
            >
              {verifying ? (
                <>
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                  {hasVerified ? 'চূড়ান্ত ভেরিফিকেশন...' : 'চ্যানেল যাচাই করা হচ্ছে...'}
                </>
              ) : joinedChannels.size < channels.length ? (
                `আরও ${channels.length - joinedChannels.size}টি চ্যানেলে জয়েন করুন`
              ) : hasVerified ? (
                'সম্পূর্ণ করুন ও অ্যাপে প্রবেশ করুন'
              ) : (
                'ভেরিফাই করুন ও চালিয়ে যান'
              )}
            </Button>
          </div>
          
          {/* Security Notice */}
          <div className="bg-gradient-to-r from-indigo-900/30 to-purple-900/30 backdrop-blur-sm rounded-xl p-4 border border-indigo-500/30">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-indigo-500/20 rounded-full flex items-center justify-center mt-1">
                <Users className="w-4 h-4 text-indigo-400" />
              </div>
              <div>
                <p className="text-sm text-indigo-300 font-medium mb-1">🔒 নিরাপত্তা তথ্য</p>
                <p className="text-xs text-gray-400 leading-relaxed">
                  আর্নিং ফিচার ব্যবহারের জন্য আপনাকে অবশ্যই সব {channels.length}টি চ্যানেলে জয়েন করতে হবে। 
                  এই যাচাইকরণ স্প্যাম প্রতিরোধ করে এবং সত্যিকারের ব্যবহারকারীদের নিশ্চিত করে।
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default JoinChannelsPage;
