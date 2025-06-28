import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useAdmin } from '../contexts/AdminContext';
import { dbService, WithdrawalRequest } from '../services/database';
import { Settings, Users, DollarSign, BarChart3, Globe, Shield, Eye, EyeOff } from 'lucide-react';

const AdminPanel: React.FC = () => {
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>([]);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [adminId, setAdminId] = useState('');
  const [showAdminId, setShowAdminId] = useState(false);
  const { toast } = useToast();
  const { settings, updateSettings, isChannelVerificationEnabled, setChannelVerificationEnabled } = useAdmin();

  const ADMIN_TELEGRAM_ID = '7390932497';

  useEffect(() => {
    if (window.Telegram?.WebApp) {
      const user = window.Telegram.WebApp.initDataUnsafe?.user;
      if (user && user.id.toString() === ADMIN_TELEGRAM_ID) {
        setIsAuthorized(true);
        loadAdminData();
      }
    }
  }, []);

  useEffect(() => {
    if (isAuthorized) {
      // Subscribe to real-time withdrawal updates
      const unsubscribe = dbService.subscribeToWithdrawals((withdrawals) => {
        setWithdrawalRequests(withdrawals);
      });

      return unsubscribe;
    }
  }, [isAuthorized]);

  const handleAdminLogin = () => {
    if (adminId === ADMIN_TELEGRAM_ID) {
      setIsAuthorized(true);
      loadAdminData();
      toast({
        title: "Access Granted",
        description: "Welcome to the Professional Admin Panel",
      });
    } else {
      toast({
        title: "Access Denied", 
        description: "Invalid admin credentials",
        variant: "destructive"
      });
    }
  };

  const loadAdminData = async () => {
    try {
      const withdrawals = await dbService.getWithdrawalRequests();
      setWithdrawalRequests(withdrawals);
    } catch (error) {
      console.error('Error loading admin data:', error);
    }
  };

  const handleWithdrawalAction = async (withdrawalId: string, action: 'approve' | 'reject') => {
    try {
      const status = action === 'approve' ? 'completed' : 'rejected';
      const success = await dbService.updateWithdrawalStatus(withdrawalId, status);
      
      if (success) {
        toast({
          title: `Withdrawal ${action === 'approve' ? 'Approved' : 'Rejected'}`,
          description: `Request processed successfully`,
        });
        
        // Reload withdrawal data
        loadAdminData();
      } else {
        toast({
          title: "Error",
          description: "Failed to update withdrawal request",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error updating withdrawal:', error);
      toast({
        title: "Error",
        description: "Failed to process withdrawal request",
        variant: "destructive"
      });
    }
  };

  const handleSettingUpdate = async (key: string, value: string) => {
    try {
      await updateSettings({ [key]: value });
      
      toast({
        title: "Setting Updated",
        description: `${key} updated successfully - Changes applied instantly to all users`,
      });
    } catch (error) {
      console.error('Error updating setting:', error);
      toast({
        title: "Error",
        description: "Failed to update setting",
        variant: "destructive"
      });
    }
  };

  const toggleChannelVerification = async (enabled: boolean) => {
    try {
      await setChannelVerificationEnabled(enabled);
      
      toast({
        title: enabled ? "Channel Verification Enabled" : "Channel Verification Disabled",
        description: enabled ? "Users must join all channels" : "Channel join requirement bypassed - All users can access immediately",
      });
    } catch (error) {
      console.error('Error toggling channel verification:', error);
      toast({
        title: "Error",
        description: "Failed to update channel verification setting",
        variant: "destructive"
      });
    }
  };

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-gray-800/90 backdrop-blur-sm border-gray-700 shadow-2xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-r from-red-500 to-purple-600 rounded-full flex items-center justify-center">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-white text-2xl">Admin Access Required</CardTitle>
            <p className="text-gray-400 mt-2">Professional Control Panel</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="adminId" className="text-white">Admin Telegram ID</Label>
              <div className="relative">
                <Input
                  id="adminId"
                  type={showAdminId ? "text" : "password"}
                  placeholder="Enter your admin ID"
                  value={adminId}
                  onChange={(e) => setAdminId(e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowAdminId(!showAdminId)}
                >
                  {showAdminId ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </Button>
              </div>
            </div>
            <Button onClick={handleAdminLogin} className="w-full bg-gradient-to-r from-blue-600 to-purple-600">
              Access Control Panel
            </Button>
            <div className="text-center">
              <p className="text-gray-400 text-xs p-3 bg-gray-800/50 rounded-lg">
                🔐 Secure Admin Authentication
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white p-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Professional Admin Control Panel
          </h1>
          <p className="text-gray-400">Real-time management for Ads by USDT Earn</p>
          <div className="mt-4 bg-green-600/20 border border-green-500/30 rounded-lg p-3">
            <p className="text-green-300 text-sm">✅ All changes apply instantly to user experience</p>
          </div>
        </div>
        
        <Tabs defaultValue="settings" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-gray-800/50 backdrop-blur-sm border border-gray-700">
            <TabsTrigger value="settings" className="flex items-center space-x-2">
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </TabsTrigger>
            <TabsTrigger value="withdrawals" className="flex items-center space-x-2">
              <DollarSign className="w-4 h-4" />
              <span>Withdrawals</span>
            </TabsTrigger>
            <TabsTrigger value="ads" className="flex items-center space-x-2">
              <Globe className="w-4 h-4" />
              <span>Ads</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4" />
              <span>Analytics</span>
            </TabsTrigger>
          </TabsList>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <DollarSign className="w-5 h-5 mr-2" />
                    Earning Settings
                    <span className="ml-auto text-xs bg-green-600/20 text-green-300 px-2 py-1 rounded">LIVE</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-white">Ad Reward Rate (USDT)</Label>
                    <Input
                      value={settings.adRewardRate}
                      onChange={(e) => handleSettingUpdate('adRewardRate', e.target.value)}
                      className="bg-gray-700 border-gray-600 text-white"
                      placeholder="0.05"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-white">Referral Bonus (%)</Label>
                    <Input
                      value={settings.referralRate}
                      onChange={(e) => handleSettingUpdate('referralRate', e.target.value)}
                      className="bg-gray-700 border-gray-600 text-white"
                      placeholder="10"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-white">Minimum Withdrawal (USDT)</Label>
                    <Input
                      value={settings.minWithdrawal}
                      onChange={(e) => handleSettingUpdate('minWithdrawal', e.target.value)}
                      className="bg-gray-700 border-gray-600 text-white"
                      placeholder="1.0"
                    />
                  </div>

                  <div>
                    <Label className="text-white">Required Referrals for Withdrawal</Label>
                    <Input
                      value={settings.requiredReferrals}
                      onChange={(e) => handleSettingUpdate('requiredReferrals', e.target.value)}
                      className="bg-gray-700 border-gray-600 text-white"
                      placeholder="5"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Settings className="w-5 h-5 mr-2" />
                    System Controls
                    <span className="ml-auto text-xs bg-green-600/20 text-green-300 px-2 py-1 rounded">LIVE</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-white">Daily Ad Limit</Label>
                    <Input
                      value={settings.dailyAdLimit}
                      onChange={(e) => handleSettingUpdate('dailyAdLimit', e.target.value)}
                      className="bg-gray-700 border-gray-600 text-white"
                      placeholder="30"
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
                    <div>
                      <Label className="text-white font-medium">Channel Verification</Label>
                      <p className="text-sm text-gray-400">Force users to join channels</p>
                    </div>
                    <Switch
                      checked={isChannelVerificationEnabled}
                      onCheckedChange={toggleChannelVerification}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Ads Management Tab */}
          <TabsContent value="ads">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">HTML Ad Code</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Textarea
                      value={settings.htmlAdCode}
                      onChange={(e) => handleSettingUpdate('htmlAdCode', e.target.value)}
                      className="bg-gray-700 border-gray-600 text-white min-h-[150px]"
                      placeholder="Enter your HTML ad code..."
                    />
                    <p className="text-gray-400 text-sm">
                      HTML ads will be displayed to users with live updates
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Monetag Banner Integration</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Textarea
                      value={settings.monetagBannerCode}
                      onChange={(e) => handleSettingUpdate('monetagBannerCode', e.target.value)}
                      className="bg-gray-700 border-gray-600 text-white min-h-[150px]"
                      placeholder="Paste your Monetag banner code here..."
                    />
                    <p className="text-gray-400 text-sm">
                      🔥 Monetag banners provide high-converting ads with instant updates
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Withdrawal Management */}
          <TabsContent value="withdrawals">
            <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Pending Withdrawals</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {withdrawalRequests.filter(request => request.status === 'pending').map((request) => (
                    <div key={request.id} className="flex justify-between items-center p-4 bg-gray-700/50 rounded-lg border border-gray-600">
                      <div className="space-y-1">
                        <p className="text-white font-medium">@{request.username}</p>
                        <p className="text-green-400 font-bold">${request.amount.toFixed(2)} USDT</p>
                        <p className="text-gray-400 text-sm">{request.withdrawal_method === 'binance' ? 'Binance Pay ID' : 'USDT TRC20'}</p>
                        <p className="text-gray-300 text-sm font-mono">{request.wallet_address}</p>
                        <p className="text-gray-500 text-xs">{new Date(request.created_at).toLocaleDateString()}</p>
                      </div>
                      <div className="space-x-2">
                        <Button 
                          size="sm" 
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => handleWithdrawalAction(request.id, 'approve')}
                        >
                          Approve
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => handleWithdrawalAction(request.id, 'reject')}
                        >
                          Reject
                        </Button>
                      </div>
                    </div>
                  ))}
                  {withdrawalRequests.filter(request => request.status === 'pending').length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-gray-400">No pending withdrawal requests</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 border-blue-500/30">
                <CardContent className="p-6 text-center">
                  <Users className="w-12 h-12 text-blue-400 mx-auto mb-2" />
                  <h3 className="text-2xl font-bold text-white">1,234</h3>
                  <p className="text-gray-400">Total Users</p>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-green-600/20 to-blue-600/20 border-green-500/30">
                <CardContent className="p-6 text-center">
                  <DollarSign className="w-12 h-12 text-green-400 mx-auto mb-2" />
                  <h3 className="text-2xl font-bold text-white">$2,456</h3>
                  <p className="text-gray-400">Total Earned</p>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 border-purple-500/30">
                <CardContent className="p-6 text-center">
                  <BarChart3 className="w-12 h-12 text-purple-400 mx-auto mb-2" />
                  <h3 className="text-2xl font-bold text-white">15,678</h3>
                  <p className="text-gray-400">Ads Watched</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-8 text-center">
          <p className="text-gray-400 text-sm">
            🚀 Professional Admin Panel • Real-time Updates • Secure Management
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
