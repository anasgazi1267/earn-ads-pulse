import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BarChart3, 
  Users, 
  Settings, 
  CreditCard, 
  Shield, 
  ListTodo, 
  Monitor, 
  Activity, 
  Code, 
  Trash2, 
  Eye, 
  Edit,
  ArrowUpRight,
  ArrowDownRight,
  Upload,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { dbService, User, WithdrawalRequest } from '@/services/database';
import { taskService, Task } from '@/services/taskService';
import ChannelManagement from './ChannelManagement';
import PaymentMethodsManager from './PaymentMethodsManager';
import AdCodeManager from './AdCodeManager';
import HtmlAdManager from './HtmlAdManager';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';

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
  const [deviceVerificationEnabled, setDeviceVerificationEnabled] = useState(true);
  const [monetizationCode, setMonetizationCode] = useState('');
  const [deviceTrackingData, setDeviceTrackingData] = useState<any[]>([]);
  const [depositRequests, setDepositRequests] = useState<any[]>([]);
  const [userTasks, setUserTasks] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalBalance: 0,
    pendingWithdrawals: 0,
    totalReferrals: 0,
    totalDevices: 0,
    multipleAccountAttempts: 0
  });
  const { toast } = useToast();

  const loadWithdrawalRequests = async () => {
    try {
      const requests = await dbService.getAllWithdrawalRequests();
      setWithdrawalRequests(requests);
    } catch (error) {
      console.error('Error loading withdrawal requests:', error);
    }
  };

  const loadDepositRequests = async () => {
    try {
      const requests = await dbService.getAllDepositRequests();
      setDepositRequests(requests);
    } catch (error) {
      console.error('Error loading deposit requests:', error);
    }
  };

  const loadUserTasks = async () => {
    try {
      const tasks = await dbService.getUserUploadedTasks();
      setUserTasks(tasks);
    } catch (error) {
      console.error('Error loading user tasks:', error);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const usersData = await dbService.getAllUsers();
      setUsers(usersData);
      
      // Calculate stats
      const totalBalance = usersData.reduce((sum, user) => sum + (user.balance || 0), 0);
      const totalReferrals = usersData.reduce((sum, user) => sum + (user.referral_count || 0), 0);
      
      setStats(prev => ({
        ...prev,
        totalUsers: usersData.length,
        totalBalance,
        totalReferrals
      }));
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
    loadAdminSettings();
    loadWithdrawalRequests();
    loadDepositRequests();
    loadUserTasks();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      
      const [usersData, withdrawalsData, settingsData, tasksData, depositsData, deviceData] = await Promise.all([
        dbService.getAllUsers(),
        dbService.getWithdrawalRequests(),
        dbService.getAdminSettings(),
        taskService.getAllTasks(),
        dbService.getAllDeposits(),
        dbService.getDeviceTrackingData()
      ]);

      setUsers(usersData);
      setWithdrawalRequests(withdrawalsData);
      setAdminSettings(settingsData);
      setTasks(tasksData);
      setDeposits(depositsData);
      setDeviceTrackingData(deviceData);

      // Load device verification and monetization settings
      setDeviceVerificationEnabled(settingsData.device_verification_enabled === 'true');
      setMonetizationCode(settingsData.monetization_code || '');

      // Calculate stats
      const totalBalance = usersData.reduce((sum, user) => sum + (user.balance || 0), 0);
      const totalReferrals = usersData.reduce((sum, user) => sum + (user.referral_count || 0), 0);
      const pendingWithdrawals = withdrawalsData
        .filter(req => req.status === 'pending')
        .reduce((sum, req) => sum + req.amount, 0);
      
      const totalDevices = deviceData.length;
      const multipleAccountAttempts = deviceData.filter(device => device.total_accounts_attempted > 1).length;

      setStats({
        totalUsers: usersData.length,
        totalBalance,
        totalReferrals,
        pendingWithdrawals,
        totalDevices,
        multipleAccountAttempts
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
      const [platformFeeValue, conversionFeeValue, deviceVerifyValue, monetizationValue] = await Promise.all([
        dbService.getAdminSetting('platform_fee_percentage'),
        dbService.getAdminSetting('conversion_fee_percentage'),
        dbService.getAdminSetting('device_verification_enabled'),
        dbService.getAdminSetting('monetization_code')
      ]);
      
      setPlatformFee(platformFeeValue || '0.005');
      setConversionFee(conversionFeeValue || '0.1');
      setDeviceVerificationEnabled(deviceVerifyValue === 'true');
      setMonetizationCode(monetizationValue || '');
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
            { id: 'devices', label: 'Devices', icon: Shield },
            { id: 'tasks', label: 'Tasks', icon: ListTodo },
            { id: 'user-tasks', label: 'User Tasks', icon: Upload },
            { id: 'withdrawals', label: 'Withdrawals', icon: ArrowUpRight },
            { id: 'deposits', label: 'Deposits', icon: ArrowDownRight },
            { id: 'payments', label: 'Payments', icon: CreditCard },
            { id: 'ads', label: 'Ads', icon: Monitor },
            { id: 'htmlads', label: 'HTML Ads', icon: Code },
            { id: 'monetization', label: 'Monetization', icon: Activity },
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
          <div className="space-y-6">
            <Card className="bg-gray-800/50 backdrop-blur-xl border-gray-700/50">
              <CardHeader>
                <CardTitle className="text-white">User Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="text-left py-3 px-4 text-gray-300">User ID</th>
                        <th className="text-left py-3 px-4 text-gray-300">User Info</th>
                        <th className="text-left py-3 px-4 text-gray-300">Balances</th>
                        <th className="text-left py-3 px-4 text-gray-300">Activity</th>
                        <th className="text-left py-3 px-4 text-gray-300">Status</th>
                        <th className="text-left py-3 px-4 text-gray-300">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user.id} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                          <td className="py-3 px-4">
                            <div className="text-xs">
                              <p className="text-gray-400 font-mono">ID: {user.telegram_id}</p>
                              <p className="text-gray-500">UUID: {user.id.slice(0, 8)}...</p>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div>
                              <p className="text-white font-medium">
                                {user.first_name} {user.last_name}
                              </p>
                              <p className="text-gray-400 text-xs">@{user.username || 'no_username'}</p>
                              <p className="text-gray-500 text-xs">{user.referral_count || 0} referrals</p>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="text-xs">
                              <p className="text-green-400">Earnings: ${(user.balance || 0).toFixed(3)}</p>
                              <p className="text-blue-400">Deposit: ${(user.deposit_balance || 0).toFixed(3)}</p>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="text-xs">
                              <p className="text-white">Ads: {user.ads_watched_today || 0}</p>
                              <p className="text-gray-400">Spins: {user.spins_used_today || 0}</p>
                              <p className="text-gray-500">Last: {user.last_activity_date || 'Never'}</p>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="space-y-1">
                              <Badge variant={user.channels_joined ? "default" : "secondary"} className="text-xs">
                                {user.channels_joined ? 'Verified' : 'Unverified'}
                              </Badge>
                              <p className="text-xs text-gray-400">
                                Joined: {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}
                              </p>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex space-x-2">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="text-xs border-gray-600 text-white hover:bg-gray-700"
                                onClick={async () => {
                                  const success = await dbService.deleteUser(user.telegram_id);
                                  if (success) {
                                    setUsers(prev => prev.filter(u => u.id !== user.id));
                                    toast({ title: "User deleted successfully" });
                                  } else {
                                    toast({ title: "Failed to delete user", variant: "destructive" });
                                  }
                                }}
                              >
                                Delete
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-gray-800/50 backdrop-blur-xl border-gray-700/50">
                <CardHeader>
                  <CardTitle className="text-white">Withdrawal Requests</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto max-h-96">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-700">
                          <th className="text-left py-2 px-3 text-gray-300">User</th>
                          <th className="text-left py-2 px-3 text-gray-300">Amount</th>
                          <th className="text-left py-2 px-3 text-gray-300">Method</th>
                          <th className="text-left py-2 px-3 text-gray-300">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {withdrawalRequests.slice(0, 10).map((request) => (
                          <tr key={request.id} className="border-b border-gray-700/50">
                            <td className="py-2 px-3 text-white text-xs">{request.username}</td>
                            <td className="py-2 px-3 text-green-400 text-xs">${request.amount}</td>
                            <td className="py-2 px-3 text-gray-300 text-xs">{request.withdrawal_method}</td>
                            <td className="py-2 px-3">
                              <Badge variant={request.status === 'completed' ? 'default' : 'secondary'} className="text-xs">
                                {request.status}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800/50 backdrop-blur-xl border-gray-700/50">
                <CardHeader>
                  <CardTitle className="text-white">Deposit Requests</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto max-h-96">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-700">
                          <th className="text-left py-2 px-3 text-gray-300">User</th>
                          <th className="text-left py-2 px-3 text-gray-300">Amount</th>
                          <th className="text-left py-2 px-3 text-gray-300">Method</th>
                          <th className="text-left py-2 px-3 text-gray-300">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {deposits.slice(0, 10).map((deposit) => (
                          <tr key={deposit.id} className="border-b border-gray-700/50">
                            <td className="py-2 px-3 text-white text-xs">{deposit.user_id}</td>
                            <td className="py-2 px-3 text-blue-400 text-xs">${deposit.amount}</td>
                            <td className="py-2 px-3 text-gray-300 text-xs">{deposit.deposit_method}</td>
                            <td className="py-2 px-3">
                              <Badge variant={deposit.status === 'completed' ? 'default' : 'secondary'} className="text-xs">
                                {deposit.status}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'withdrawals' && (
          <Card className="bg-gray-800/50 backdrop-blur-xl border-gray-700/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <ArrowUpRight className="w-5 h-5" />
                <span>Withdrawal Request Management</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-3 px-4 text-gray-300">User</th>
                      <th className="text-left py-3 px-4 text-gray-300">Amount</th>
                      <th className="text-left py-3 px-4 text-gray-300">Method</th>
                      <th className="text-left py-3 px-4 text-gray-300">Wallet</th>
                      <th className="text-left py-3 px-4 text-gray-300">Status</th>
                      <th className="text-left py-3 px-4 text-gray-300">Date</th>
                      <th className="text-left py-3 px-4 text-gray-300">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {withdrawalRequests.map((request) => (
                      <tr key={request.id} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                        <td className="py-3 px-4">
                          <div>
                            <p className="text-white font-medium">{request.username}</p>
                            <p className="text-gray-400 text-xs">ID: {request.telegram_id}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-green-400 font-bold">${request.amount}</td>
                        <td className="py-3 px-4 text-gray-300">{request.withdrawal_method}</td>
                        <td className="py-3 px-4">
                          <p className="text-white text-xs font-mono">{request.wallet_address}</p>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={
                            request.status === 'completed' ? 'default' : 
                            request.status === 'pending' ? 'secondary' : 'destructive'
                          }>
                            {request.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-gray-400 text-xs">
                          {new Date(request.created_at).toLocaleString()}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              onClick={async () => {
                                const success = await dbService.updateWithdrawalRequestStatus(request.id, 'completed');
                                if (success) {
                                  loadWithdrawalRequests();
                                  toast({ title: "Withdrawal approved" });
                                }
                              }}
                              disabled={request.status === 'completed'}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={async () => {
                                const success = await dbService.updateWithdrawalRequestStatus(request.id, 'rejected');
                                if (success) {
                                  loadWithdrawalRequests();
                                  toast({ title: "Withdrawal rejected" });
                                }
                              }}
                              disabled={request.status !== 'pending'}
                            >
                              <XCircle className="w-3 h-3 mr-1" />
                              Reject
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'deposits' && (
          <Card className="bg-gray-800/50 backdrop-blur-xl border-gray-700/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <ArrowDownRight className="w-5 h-5" />
                <span>Deposit Request Management</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-3 px-4 text-gray-300">User</th>
                      <th className="text-left py-3 px-4 text-gray-300">Amount</th>
                      <th className="text-left py-3 px-4 text-gray-300">Method</th>
                      <th className="text-left py-3 px-4 text-gray-300">Transaction ID</th>
                      <th className="text-left py-3 px-4 text-gray-300">Status</th>
                      <th className="text-left py-3 px-4 text-gray-300">Date</th>
                      <th className="text-left py-3 px-4 text-gray-300">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {depositRequests.map((request) => (
                      <tr key={request.id} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                        <td className="py-3 px-4">
                          <div>
                            <p className="text-white font-medium">{request.user_id}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-blue-400 font-bold">${request.amount}</td>
                        <td className="py-3 px-4 text-gray-300">{request.deposit_method}</td>
                        <td className="py-3 px-4">
                          <p className="text-white text-xs font-mono">{request.transaction_id || 'N/A'}</p>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={
                            request.status === 'completed' ? 'default' : 
                            request.status === 'pending' ? 'secondary' : 'destructive'
                          }>
                            {request.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-gray-400 text-xs">
                          {new Date(request.created_at).toLocaleString()}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              onClick={async () => {
                                const success = await dbService.updateDepositRequestStatus(request.id, 'completed');
                                if (success) {
                                  loadDepositRequests();
                                  toast({ title: "Deposit approved" });
                                }
                              }}
                              disabled={request.status === 'completed'}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={async () => {
                                const success = await dbService.updateDepositRequestStatus(request.id, 'rejected');
                                if (success) {
                                  loadDepositRequests();
                                  toast({ title: "Deposit rejected" });
                                }
                              }}
                              disabled={request.status !== 'pending'}
                            >
                              <XCircle className="w-3 h-3 mr-1" />
                              Reject
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'user-tasks' && (
          <Card className="bg-gray-800/50 backdrop-blur-xl border-gray-700/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <Upload className="w-5 h-5" />
                <span>User Uploaded Tasks</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-3 px-4 text-gray-300">Task Info</th>
                      <th className="text-left py-3 px-4 text-gray-300">Creator</th>
                      <th className="text-left py-3 px-4 text-gray-300">Reward</th>
                      <th className="text-left py-3 px-4 text-gray-300">Budget</th>
                      <th className="text-left py-3 px-4 text-gray-300">Status</th>
                      <th className="text-left py-3 px-4 text-gray-300">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userTasks.map((task) => (
                      <tr key={task.id} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                        <td className="py-3 px-4">
                          <div>
                            <p className="text-white font-medium">{task.title}</p>
                            <p className="text-gray-400 text-xs">{task.description}</p>
                            <p className="text-blue-400 text-xs">{task.task_url}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-white">{task.created_by_user}</td>
                        <td className="py-3 px-4 text-green-400">${task.reward_amount}</td>
                        <td className="py-3 px-4 text-blue-400">${task.total_budget}</td>
                        <td className="py-3 px-4">
                          <Badge variant={
                            task.status === 'active' ? 'default' : 
                            task.status === 'pending' ? 'secondary' : 'destructive'
                          }>
                            {task.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              onClick={async () => {
                                const success = await dbService.updateUserTaskStatus(task.id, 'active');
                                if (success) {
                                  loadUserTasks();
                                  toast({ title: "Task approved" });
                                }
                              }}
                              disabled={task.status === 'active'}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={async () => {
                                const success = await dbService.updateUserTaskStatus(task.id, 'rejected');
                                if (success) {
                                  loadUserTasks();
                                  toast({ title: "Task rejected" });
                                }
                              }}
                              disabled={task.status === 'rejected'}
                            >
                              <XCircle className="w-3 h-3 mr-1" />
                              Reject
                            </Button>
                          </div>
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

        {activeTab === 'devices' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white">Device Management</h2>
              <div className="flex items-center space-x-3 bg-gray-800/50 p-3 rounded-lg">
                <Label className="text-gray-300">Device Verification</Label>
                <Switch
                  checked={deviceVerificationEnabled}
                  onCheckedChange={async (checked) => {
                    setDeviceVerificationEnabled(checked);
                    await dbService.updateAdminSetting('device_verification_enabled', checked.toString());
                    toast({
                      title: checked ? "Device verification enabled" : "Device verification disabled",
                      description: checked 
                        ? "Users are now limited to one account per device"
                        : "Multiple accounts per device are now allowed"
                    });
                  }}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card className="bg-gray-800/50 border-gray-700/50">
                <CardContent className="p-4">
                  <div className="text-center">
                    <Shield className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                    <p className="text-gray-400 text-sm">Total Devices</p>
                    <p className="text-2xl font-bold text-white">{stats.totalDevices}</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gray-800/50 border-gray-700/50">
                <CardContent className="p-4">
                  <div className="text-center">
                    <Users className="w-8 h-8 text-orange-500 mx-auto mb-2" />
                    <p className="text-gray-400 text-sm">Multiple Attempts</p>
                    <p className="text-2xl font-bold text-white">{stats.multipleAccountAttempts}</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gray-800/50 border-gray-700/50">
                <CardContent className="p-4">
                  <div className="text-center">
                    <Activity className="w-8 h-8 text-green-500 mx-auto mb-2" />
                    <p className="text-gray-400 text-sm">Verification Status</p>
                    <Badge variant={deviceVerificationEnabled ? "default" : "secondary"}>
                      {deviceVerificationEnabled ? "Enabled" : "Disabled"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-gray-800/50 border-gray-700/50">
              <CardHeader>
                <CardTitle className="text-white">Device Tracking Data</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="text-left py-3 px-4 text-gray-300">Device IP</th>
                        <th className="text-left py-3 px-4 text-gray-300">First Account</th>
                        <th className="text-left py-3 px-4 text-gray-300">Attempts</th>
                        <th className="text-left py-3 px-4 text-gray-300">Last Seen</th>
                        <th className="text-left py-3 px-4 text-gray-300">Status</th>
                        <th className="text-left py-3 px-4 text-gray-300">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {deviceTrackingData.map((device) => (
                        <tr key={device.id} className="border-b border-gray-700/50">
                          <td className="py-3 px-4 text-white font-mono text-xs">
                            {device.ip_address.substring(0, 12)}...
                          </td>
                          <td className="py-3 px-4 text-white">
                            {device.first_account_telegram_id}
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant={device.total_accounts_attempted > 1 ? "destructive" : "default"}>
                              {device.total_accounts_attempted}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-gray-400 text-xs">
                            {new Date(device.last_seen).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant={device.is_blocked ? "destructive" : "default"}>
                              {device.is_blocked ? "Blocked" : "Active"}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            <Button
                              size="sm"
                              variant={device.is_blocked ? "outline" : "destructive"}
                              onClick={async () => {
                                await dbService.toggleDeviceBlocking(device.telegram_id, !device.is_blocked);
                                loadStats();
                                toast({
                                  title: device.is_blocked ? "Device unblocked" : "Device blocked",
                                  description: `Device ${device.is_blocked ? "unblocked" : "blocked"} successfully`
                                });
                              }}
                            >
                              {device.is_blocked ? "Unblock" : "Block"}
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'monetization' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Monetization Settings</h2>
            
            <Card className="bg-gray-800/50 border-gray-700/50">
              <CardHeader>
                <CardTitle className="text-white">External Monetization Code</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-gray-300">HTML/JavaScript Code</Label>
                  <Textarea
                    value={monetizationCode}
                    onChange={(e) => setMonetizationCode(e.target.value)}
                    placeholder="Enter your AdSense, Google Ads, or other monetization code here..."
                    className="bg-gray-700/50 border-gray-600 text-white mt-2 min-h-[200px]"
                  />
                  <p className="text-gray-400 text-sm mt-2">
                    This code will be injected into all pages. Use for AdSense, Google Ads, analytics, etc.
                  </p>
                </div>
                <Button
                  onClick={async () => {
                    await dbService.updateAdminSetting('monetization_code', monetizationCode);
                    toast({
                      title: "Monetization code updated",
                      description: "The code will be active on all pages"
                    });
                  }}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Save Monetization Code
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-gray-800/50 border-gray-700/50">
              <CardHeader>
                <CardTitle className="text-white">Revenue Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
                    <h3 className="text-green-400 font-semibold">Platform Fees</h3>
                    <p className="text-2xl font-bold text-white">$0.00</p>
                    <p className="text-gray-400 text-sm">From task platform fees</p>
                  </div>
                  <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                    <h3 className="text-blue-400 font-semibold">Conversion Fees</h3>
                    <p className="text-2xl font-bold text-white">$0.00</p>
                    <p className="text-gray-400 text-sm">From balance conversions</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
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
