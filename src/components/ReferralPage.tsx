
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Share2, 
  Copy, 
  DollarSign, 
  Trophy,
  UserPlus,
  Gift,
  CheckCircle,
  RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { dbService } from '../services/database';

interface ReferralPageProps {
  userInfo: any;
  userBalance: number;
  updateUserBalance: (newBalance: number) => void;
}

const ReferralPage: React.FC<ReferralPageProps> = ({ userInfo, userBalance, updateUserBalance }) => {
  const [referralStats, setReferralStats] = useState({ count: 0, earnings: 0, referrals: [] });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();

  // Improved referral link for Telegram Mini App
  const referralLink = `https://t.me/Ads_Usdt_earn_bot/FreeUsdt?startapp=ref_${userInfo?.id}`;

  useEffect(() => {
    loadReferralStats();
  }, [userInfo]);

  const loadReferralStats = async () => {
    if (userInfo?.id) {
      setLoading(true);
      try {
        const stats = await dbService.getReferralStats(userInfo.id.toString());
        console.log('📊 Loaded referral stats:', stats);
        setReferralStats(stats);
      } catch (error) {
        console.error('❌ Error loading referral stats:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const refreshStats = async () => {
    setRefreshing(true);
    await loadReferralStats();
    setRefreshing(false);
    toast({
      title: "🔄 Refreshed!",
      description: "Referral stats have been updated",
    });
  };

  const copyReferralLink = () => {
    navigator.clipboard.writeText(referralLink);
    toast({
      title: "📋 Copied!",
      description: "Referral link copied to clipboard",
    });
  };

  const shareReferralLink = () => {
    const shareText = `🚀 Join Ads by USDT Earn Bot!

💰 Watch ads and earn real USDT
🎯 Complete tasks for bonus rewards  
📱 Easy to use Telegram mini app
🎁 Get $0.01 bonus when you join using my link!

Join now: ${referralLink}

Start earning today! 💎`;

    if (navigator.share) {
      navigator.share({
        title: '🚀 Ads by USDT Earn - Start Earning Today!',
        text: shareText,
        url: referralLink,
      });
    } else {
      // Copy the full message to clipboard
      navigator.clipboard.writeText(shareText);
      toast({
        title: "📋 Message Copied!",
        description: "Complete referral message copied to clipboard",
      });
    }
  };

  if (loading) {
    return (
      <div className="p-4 space-y-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading referral data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="text-center py-4">
        <div className="flex items-center justify-center space-x-2 mb-2">
          <h1 className="text-2xl font-bold text-white">🎯 Referral Program</h1>
          <Button
            onClick={refreshStats}
            disabled={refreshing}
            variant="ghost"
            size="sm"
            className="text-blue-400 hover:text-blue-300"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        <p className="text-gray-400">
          Invite friends and earn $0.01 for each referral
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-blue-500/30">
          <CardContent className="p-4 text-center">
            <Users className="w-8 h-8 text-blue-400 mx-auto mb-2" />
            <p className="text-white font-bold text-lg">{referralStats.count}</p>
            <p className="text-gray-400 text-sm">Total Referrals</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-600/20 to-blue-600/20 border-green-500/30">
          <CardContent className="p-4 text-center">
            <DollarSign className="w-8 h-8 text-green-400 mx-auto mb-2" />
            <p className="text-white font-bold text-lg">${referralStats.earnings.toFixed(3)}</p>
            <p className="text-gray-400 text-sm">Total Earned</p>
          </CardContent>
        </Card>
      </div>

      {/* Referral Link */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">📎 Your Referral Link</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2 p-3 bg-gray-700 rounded-lg">
            <code className="flex-1 text-white text-sm overflow-hidden">
              {referralLink}
            </code>
            <Button
              onClick={copyReferralLink}
              size="sm"
              variant="outline"
              className="border-gray-600 text-white hover:bg-gray-600"
            >
              <Copy className="w-4 h-4" />
            </Button>
          </div>
          
          <Button
            onClick={shareReferralLink}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            <Share2 className="w-4 h-4 mr-2" />
            Share Link
          </Button>
        </CardContent>
      </Card>

      {/* How it Works */}
      <Card className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border-purple-500/30">
        <CardHeader>
          <CardTitle className="text-white flex items-center space-x-2">
            <Gift className="w-5 h-5 text-yellow-400" />
            <span>How Referrals Work</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-gray-300 text-sm">
            💰 Earn $0.01 USDT for each friend who joins
          </p>
          <p className="text-gray-300 text-sm">
            👥 Your friends get instant access to earn USDT
          </p>
          <p className="text-gray-300 text-sm">
            🎯 No limit on how many friends you can refer
          </p>
          <p className="text-gray-300 text-sm">
            ⚡ Referral bonus is added instantly to your balance
          </p>
        </CardContent>
      </Card>

      {/* Referral History */}
      {referralStats.referrals.length > 0 && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">📋 Recent Referrals</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {referralStats.referrals.slice(0, 10).map((referral: any, index: number) => (
              <div
                key={referral.id || index}
                className="flex items-center justify-between p-3 bg-green-600/10 rounded-lg border border-green-600/30"
              >
                <div className="flex items-center space-x-3">
                  <UserPlus className="w-5 h-5 text-green-400" />
                  <div>
                    <p className="text-white font-medium">New Referral</p>
                    <p className="text-gray-400 text-sm">
                      {referral.created_at && new Date(referral.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-green-400 font-bold">
                    +${(referral.earnings || 0.01).toFixed(3)}
                  </span>
                  <CheckCircle className="w-5 h-5 text-green-400" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {referralStats.count === 0 && (
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-8 text-center">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-white text-lg font-medium mb-2">No Referrals Yet</h3>
            <p className="text-gray-400 mb-4">
              Start inviting friends to earn referral bonuses
            </p>
            <Button
              onClick={shareReferralLink}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share Your Link
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ReferralPage;
