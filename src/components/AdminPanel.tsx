import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { BarChart3, Users, ListTodo, CreditCard, Monitor, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { dbService, User, WithdrawalRequest } from '@/services/database';
import { taskService, Task } from '@/services/taskService';
import ChannelManagement from './ChannelManagement';
import PaymentMethodsManager from './PaymentMethodsManager';
import AdCodeManager from './AdCodeManager';
import HtmlAdManager from './HtmlAdManager';

const AdminPanel = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>([]);
  const [adminSettings, setAdminSettings] = useState<Record<string, string>>({});
  const [tasks, setTasks] = useState<Task[]>([]);
  const [deposits, setDeposits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [platformFee, setPlatformFee] = useState('0.005');
  const [conversionFee, setConversionFee] = useState('0.1');
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalBalance: 0,
    pendingWithdrawals: 0,
    totalReferrals: 0
  });
  const { toast } = useToast();

  useEffect(() => {
    loadStats();
    loadAdminSettings();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      
      const [usersData, withdrawalsData, settingsData, tasksData, depositsData] = await Promise.all([
        dbService.getAllUsers(),
        dbService.getWithdrawalRequests(),
        dbService.getAdminSettings(),
        taskService.getAllTasks(),
        dbService.getAllDeposits()
      ]);

      setUsers(usersData);
      setWithdrawalRequests(withdrawalsData);
      setAdminSettings(settingsData);
      setTasks(tasksData);
      setDeposits(depositsData);

      // Calculate stats
      const totalBalance = usersData.reduce((sum, user) => sum + (user.balance || 0), 0);
      const totalReferrals = usersData.reduce((sum, user) => sum + (user.referral_count || 0), 0);
      const pendingWithdrawals = withdrawalsData
        .filter(req => req.status === 'pending')
        .reduce((sum, req) => sum + req.amount, 0);

      setStats({
        totalUsers: usersData.length,
        totalBalance,
        totalReferrals,
        pendingWithdrawals
      });
    } catch (error) {
      console.error('Error loading admin data:', error);
      toast({
        title: "Error",
        description: "Failed to load admin data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadAdminSettings = async () => {
    try {
      const [platformFeeValue, conversionFeeValue] = await Promise.all([
        dbService.getAdminSetting('platform_fee_percentage'),
        dbService.getAdminSetting('conversion_fee_percentage')
      ]);
      
      setPlatformFee(platformFeeValue || '0.005');
      setConversionFee(conversionFeeValue || '0.1');
    } catch (error) {
      console.error('Error loading admin settings:', error);
    }
  };

  const updatePlatformFee = async () => {
    try {
      await dbService.updateAdminSetting('platform_fee_percentage', platformFee);
      toast({
        title: "Platform fee updated",
        description: `Platform fee set to ${(parseFloat(platformFee) * 100).toFixed(2)}%`,
      });
    } catch (error) {
      console.error('Error updating platform fee:', error);
      toast({
        title: "Error",
        description: "Failed to update platform fee",
        variant: "destructive"
      });
    }
  };

  const updateConversionFee = async () => {
    try {
      await dbService.updateAdminSetting('conversion_fee_percentage', conversionFee);
      toast({
        title: "Conversion fee updated",
        description: `Conversion fee set to ${(parseFloat(conversionFee) * 100).toFixed(1)}%`,
      });
    } catch (error) {
      console.error('Error updating conversion fee:', error);
      toast({
        title: "Error",
        description: "Failed to update conversion fee",
        variant: "destructive"
      });
    }
  };

  const handleUpdateSetting = async (key: string, value: string) => {
    try {
      const success = await dbService.updateAdminSetting(key, value);
      if (success) {
        toast({
          title: "Success",
          description: "Setting updated successfully",
        });
      } else {
        throw new Error('Update failed');
      }
    } catch (error) {
      console.error('Error updating setting:', error);
      toast({
        title: "Error",
        description: "Failed to update setting",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading Admin Panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
          <p className="text-gray-400">Manage your Telegram Mini App</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gray-800/50 backdrop-blur-xl border-gray-700/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Users</p>
                  <p className="text-2xl font-bold text-white">{stats.totalUsers}</p>
                </div>
                <Users className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 backdrop-blur-xl border-gray-700/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Balance</p>
                  <p className="text-2xl font-bold text-white">${stats.totalBalance.toFixed(3)}</p>
                </div>
                <CreditCard className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 backdrop-blur-xl border-gray-700/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Pending Withdrawals</p>
                  <p className="text-2xl font-bold text-white">${stats.pendingWithdrawals.toFixed(3)}</p>
                </div>
                <BarChart3 className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 backdrop-blur-xl border-gray-700/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Referrals</p>
                  <p className="text-2xl font-bold text-white">{stats.totalReferrals}</p>
                </div>
                <ListTodo className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 bg-gray-800/30 p-1 rounded-lg mb-6 overflow-x-auto">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'users', label: 'Users', icon: Users },
            { id: 'tasks', label: 'Tasks', icon: ListTodo },
            { id: 'payments', label: 'Payments', icon: CreditCard },
            { id: 'ads', label: 'Ads', icon: Monitor },
            { id: 'htmlads', label: 'HTML Ads', icon: Monitor },
            { id: 'settings', label: 'Settings', icon: Settings },
          ].map((tab) => {
            const IconComponent = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab.id 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                }`}
              >
                <IconComponent className="w-4 h-4 mr-2" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-gray-800/50 backdrop-blur-xl border-gray-700/50">
              <CardHeader>
                <CardTitle className="text-white">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400">Recent user activity will be shown here</p>
              </CardContent>
            </Card>

            <Card className="bg-gray-800/50 backdrop-blur-xl border-gray-700/50">
              <CardHeader>
                <CardTitle className="text-white">System Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Database</span>
                    <Badge variant="default">Healthy</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">API</span>
                    <Badge variant="default">Operational</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Telegram Bot</span>
                    <Badge variant="default">Connected</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'users' && (
          <Card className="bg-gray-800/50 backdrop-blur-xl border-gray-700/50">
            <CardHeader>
              <CardTitle className="text-white">User Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-3 px-4 text-gray-300">User</th>
                      <th className="text-left py-3 px-4 text-gray-300">Balance</th>
                      <th className="text-left py-3 px-4 text-gray-300">Referrals</th>
                      <th className="text-left py-3 px-4 text-gray-300">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.slice(0, 10).map((user) => (
                      <tr key={user.id} className="border-b border-gray-700/50">
                        <td className="py-3 px-4">
                          <div>
                            <p className="text-white font-medium">
                              {user.first_name} {user.last_name}
                            </p>
                            <p className="text-gray-400 text-xs">@{user.username || 'no_username'}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-white">${(user.balance || 0).toFixed(3)}</td>
                        <td className="py-3 px-4 text-white">{user.referral_count || 0}</td>
                        <td className="py-3 px-4">
                          <Badge variant={user.channels_joined ? "default" : "secondary"}>
                            {user.channels_joined ? 'Verified' : 'Unverified'}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'tasks' && (
          <Card className="bg-gray-800/50 backdrop-blur-xl border-gray-700/50">
            <CardHeader>
              <CardTitle className="text-white">Task Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400">Task management interface will be shown here</p>
            </CardContent>
          </Card>
        )}

        {activeTab === 'payments' && <PaymentMethodsManager />}
        {activeTab === 'ads' && <AdCodeManager />}
        {activeTab === 'htmlads' && <HtmlAdManager />}
        
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Platform Settings</h2>
            
            {/* Platform Fee Settings */}
            <Card className="bg-gray-800/50 backdrop-blur-xl border-gray-700/50">
              <CardHeader>
                <CardTitle className="text-white">Platform Fee Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-gray-300">Platform Fee Percentage (for task uploads)</Label>
                  <div className="flex space-x-2 mt-2">
                    <Input
                      type="number"
                      step="0.001"
                      value={platformFee}
                      onChange={(e) => setPlatformFee(e.target.value)}
                      className="bg-gray-700/50 border-gray-600 text-white"
                      placeholder="0.005"
                    />
                    <Button onClick={updatePlatformFee} className="bg-blue-600 hover:bg-blue-700">
                      Update
                    </Button>
                  </div>
                  <p className="text-gray-400 text-sm mt-1">
                    Current: {(parseFloat(platformFee) * 100).toFixed(2)}% per task completion
                  </p>
                </div>
                
                <div>
                  <Label className="text-gray-300">Balance Conversion Fee Percentage</Label>
                  <div className="flex space-x-2 mt-2">
                    <Input
                      type="number"
                      step="0.01"
                      value={conversionFee}
                      onChange={(e) => setConversionFee(e.target.value)}
                      className="bg-gray-700/50 border-gray-600 text-white"
                      placeholder="0.1"
                    />
                    <Button onClick={updateConversionFee} className="bg-blue-600 hover:bg-blue-700">
                      Update
                    </Button>
                  </div>
                  <p className="text-gray-400 text-sm mt-1">
                    Current: {(parseFloat(conversionFee) * 100).toFixed(1)}% for balance conversion
                  </p>
                </div>
              </CardContent>
            </Card>
            
            {/* Admin Earnings Summary */}
            <Card className="bg-gray-800/50 backdrop-blur-xl border-gray-700/50">
              <CardHeader>
                <CardTitle className="text-white">Admin Earnings Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
                    <h3 className="text-green-400 font-semibold">Platform Fees</h3>
                    <p className="text-2xl font-bold text-white">$0.00</p>
                    <p className="text-gray-400 text-sm">From task uploads</p>
                  </div>
                  <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                    <h3 className="text-blue-400 font-semibold">Conversion Fees</h3>
                    <p className="text-2xl font-bold text-white">$0.00</p>
                    <p className="text-gray-400 text-sm">From balance conversions</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Other Settings */}
            <Card className="bg-gray-800/50 backdrop-blur-xl border-gray-700/50">
              <CardHeader>
                <CardTitle className="text-white">App Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
                  <div>
                    <Label className="text-white font-medium">Channel Verification</Label>
                    <p className="text-gray-400 text-sm">Require users to join channels before using the app</p>
                  </div>
                  <Switch
                    checked={adminSettings.channel_verification_enabled === 'true'}
                    onCheckedChange={(checked) => 
                      handleUpdateSetting('channel_verification_enabled', checked.toString())
                    }
                  />
                </div>

                <div className="p-4 bg-gray-700/50 rounded-lg">
                  <Label className="text-white font-medium mb-2 block">Ad Interval (seconds)</Label>
                  <Input
                    type="number"
                    defaultValue={adminSettings.ad_interval_seconds || '20'}
                    className="bg-gray-700 border-gray-600 text-white max-w-xs"
                    onBlur={(e) => handleUpdateSetting('ad_interval_seconds', e.target.value)}
                  />
                  <p className="text-gray-400 text-sm mt-1">How often automatic ads appear</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
