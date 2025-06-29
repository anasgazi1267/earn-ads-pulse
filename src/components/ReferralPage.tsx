
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Users, DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ReferralPageProps {
  userInfo: any;
  referralCount: number;
}

const ReferralPage: React.FC<ReferralPageProps> = ({ userInfo, referralCount }) => {
  const [referralStats, setReferralStats] = useState({
    totalReferrals: 0,
    totalEarnings: 0,
    pendingEarnings: 0
  });
  const [referralLink, setReferralLink] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    generateReferralLink();
    loadReferralStats();
  }, [userInfo, referralCount]);

  const generateReferralLink = () => {
    if (userInfo?.id) {
      const link = `https://t.me/Ads_Usdt_earn_bot?start=ref_${userInfo.id}`;
      setReferralLink(link);
    }
  };

  const loadReferralStats = () => {
    // Use the actual referral count from props
    setReferralStats({
      totalReferrals: referralCount,
      totalEarnings: referralCount * 0.50, // Mock calculation
      pendingEarnings: 0.00
    });
  };

  const copyReferralLink = () => {
    navigator.clipboard.writeText(referralLink);
    toast({
      title: "Copied!",
      description: "Referral link copied to clipboard",
    });
  };

  const shareReferralLink = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Join Ads by USDT Earn',
        text: 'Start earning USDT by watching ads! Join me on this amazing platform.',
        url: referralLink
      });
    } else {
      copyReferralLink();
    }
  };

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="text-center py-4">
        <h1 className="text-2xl font-bold text-white mb-2">Referral Program</h1>
        <p className="text-gray-400">
          Earn 10% from each friend's earnings
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4">
        <Card className="bg-gradient-to-r from-blue-600 to-purple-600 border-none">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <Users className="w-12 h-12 text-white" />
              <div>
                <p className="text-white text-sm opacity-90">Total Referrals</p>
                <p className="text-3xl font-bold text-white">{referralStats.totalReferrals}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4 text-center">
              <DollarSign className="w-8 h-8 text-green-400 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">Total Earned</p>
              <p className="text-xl font-bold text-white">
                ${referralStats.totalEarnings.toFixed(3)}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4 text-center">
              <DollarSign className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">Pending</p>
              <p className="text-xl font-bold text-white">
                ${referralStats.pendingEarnings.toFixed(3)}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Referral Link */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Your Referral Link</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-2">
            <Input
              value={referralLink}
              readOnly
              className="bg-gray-700 border-gray-600 text-white"
            />
            <Button
              onClick={copyReferralLink}
              variant="outline"
              className="border-gray-600 text-white hover:bg-gray-700"
            >
              Copy
            </Button>
          </div>
          
          <Button
            onClick={shareReferralLink}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            Share Link
          </Button>
        </CardContent>
      </Card>

      {/* How It Works */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">How Referrals Work</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold mt-1">
              1
            </div>
            <div>
              <p className="text-white font-medium">Share Your Link</p>
              <p className="text-gray-400 text-sm">Send your referral link to friends</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold mt-1">
              2
            </div>
            <div>
              <p className="text-white font-medium">Friend Joins</p>
              <p className="text-gray-400 text-sm">They sign up using your link</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold mt-1">
              3
            </div>
            <div>
              <p className="text-white font-medium">You Earn</p>
              <p className="text-gray-400 text-sm">Get 10% of their ad earnings forever</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Referrals */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Recent Referrals</CardTitle>
        </CardHeader>
        <CardContent>
          {referralStats.totalReferrals > 0 ? (
            <div className="space-y-2">
              <div className="flex justify-between items-center py-2 border-b border-gray-700">
                <span className="text-white">User#1234</span>
                <span className="text-green-400">+$0.15</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-700">
                <span className="text-white">User#5678</span>
                <span className="text-green-400">+$0.08</span>
              </div>
            </div>
          ) : (
            <p className="text-gray-400 text-center py-4">
              No referrals yet. Start sharing your link!
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ReferralPage;
