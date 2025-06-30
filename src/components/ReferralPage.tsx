
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Users, DollarSign, Clock, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { dbService, ReferralDetail } from '../services/database';

interface ReferralPageProps {
  userInfo: any;
  referralCount: number;
  onReferralUpdate?: () => void;
}

const ReferralPage: React.FC<ReferralPageProps> = ({ userInfo, referralCount, onReferralUpdate }) => {
  const [referralStats, setReferralStats] = useState({
    totalReferrals: 0,
    totalEarnings: 0,
    pendingEarnings: 0
  });
  const [referralDetails, setReferralDetails] = useState<ReferralDetail[]>([]);
  const [referralLink, setReferralLink] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    generateReferralLink();
    loadReferralData();
  }, [userInfo, referralCount]);

  const generateReferralLink = () => {
    if (userInfo?.id) {
      const link = `https://t.me/Ads_Usdt_earn_bot?start=ref_${userInfo.id}`;
      setReferralLink(link);
    }
  };

  const loadReferralData = async () => {
    try {
      if (userInfo?.id) {
        setLoading(true);
        console.log('Loading referral data for user:', userInfo.id);
        
        // Get referral details
        const details = await dbService.getUserReferrals(userInfo.id.toString());
        console.log('Loaded referral details:', details);
        setReferralDetails(details);
        
        // Calculate stats from referral details
        const totalEarnings = details.reduce((sum, ref) => sum + Number(ref.earnings), 0);
        
        setReferralStats({
          totalReferrals: referralCount,
          totalEarnings: totalEarnings,
          pendingEarnings: 0.00
        });
        
        console.log('Referral stats updated:', {
          totalReferrals: referralCount,
          totalEarnings: totalEarnings,
          detailsCount: details.length
        });
      }
    } catch (error) {
      console.error('Error loading referral data:', error);
      toast({
        title: "Error",
        description: "Failed to load referral data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshReferralData = async () => {
    setRefreshing(true);
    await loadReferralData();
    if (onReferralUpdate) {
      onReferralUpdate();
    }
    setRefreshing(false);
    toast({
      title: "Refreshed!",
      description: "Referral data has been updated",
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
        <div className="flex items-center justify-center space-x-2 mb-2">
          <h1 className="text-2xl font-bold text-white">Referral Program</h1>
          <Button
            onClick={refreshReferralData}
            disabled={refreshing}
            variant="ghost"
            size="sm"
            className="text-blue-400 hover:text-blue-300"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        <p className="text-gray-400">
          Earn $0.01 from each friend who joins
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
                <p className="text-white text-xs opacity-75">Active: {referralDetails.length}</p>
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
              <Clock className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">Per Referral</p>
              <p className="text-xl font-bold text-white">
                $0.010
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

      {/* Recent Referrals */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Your Referrals ({referralDetails.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">
              <p className="text-gray-400">Loading referrals...</p>
            </div>
          ) : referralDetails.length > 0 ? (
            <div className="space-y-3">
              {referralDetails.map((ref, index) => (
                <div key={`${ref.referred_user_id}-${index}`} className="flex justify-between items-center py-3 px-4 bg-gray-700/50 rounded-lg border border-gray-600">
                  <div className="flex flex-col">
                    <span className="text-white font-medium">
                      {ref.referred_first_name || 'User'} 
                      {ref.referred_username && ` (@${ref.referred_username})`}
                    </span>
                    <span className="text-gray-400 text-sm">
                      {new Date(ref.created_at).toLocaleDateString()}
                    </span>
                    <span className="text-gray-500 text-xs">
                      ID: {ref.referred_user_id}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-green-400 font-bold">+${Number(ref.earnings).toFixed(3)}</span>
                    <p className="text-gray-400 text-xs">Earned</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-4">
              No referrals yet. Start sharing your link!
            </p>
          )}
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
              <p className="text-white font-medium">You Earn Instantly</p>
              <p className="text-gray-400 text-sm">Get $0.01 immediately when they join</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReferralPage;
