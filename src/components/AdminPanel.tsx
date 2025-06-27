
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';

const AdminPanel: React.FC = () => {
  const [withdrawalRequests, setWithdrawalRequests] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({
    adRewardRate: '0.05',
    referralRate: '10',
    minWithdrawal: '1.0',
    dailyAdLimit: '30',
    dailySpinLimit: '30',
    spinWinPercentage: '15',
    htmlAdCode: '',
    requiredReferrals: '5'
  });
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [adminId, setAdminId] = useState('');
  const { toast } = useToast();

  const ADMIN_TELEGRAM_ID = '7390932497';

  useEffect(() => {
    // Check if user is admin
    if (window.Telegram?.WebApp) {
      const user = window.Telegram.WebApp.initDataUnsafe?.user;
      if (user && user.id.toString() === ADMIN_TELEGRAM_ID) {
        setIsAuthorized(true);
        loadAdminData();
      }
    } else {
      // For development - allow access with admin ID input
      console.log('Development mode - Admin panel accessible');
    }
  }, []);

  const handleAdminLogin = () => {
    if (adminId === ADMIN_TELEGRAM_ID) {
      setIsAuthorized(true);
      loadAdminData();
      toast({
        title: "Access Granted",
        description: "Welcome to the admin panel",
      });
    } else {
      toast({
        title: "Access Denied",
        description: "Invalid admin ID",
        variant: "destructive"
      });
    }
  };

  const loadAdminData = () => {
    // Mock data - in production this would load from Google Sheets
    setWithdrawalRequests([
      {
        id: '1',
        userId: 'user123',
        username: 'JohnDoe',
        amount: 5.00,
        method: 'binance',
        address: 'binance123',
        status: 'pending',
        date: '2023-12-20'
      },
      {
        id: '2',
        userId: 'user456',
        username: 'JaneSmith',
        amount: 10.00,
        method: 'usdt',
        address: 'TXabc123...',
        status: 'pending',
        date: '2023-12-21'
      }
    ]);

    setUsers([
      {
        id: 'user123',
        username: 'JohnDoe',
        balance: 15.50,
        referrals: 3,
        adsWatched: 25,
        spinsUsed: 20,
        joinDate: '2023-12-01'
      },
      {
        id: 'user456',
        username: 'JaneSmith',
        balance: 8.75,
        referrals: 7,
        adsWatched: 30,
        spinsUsed: 30,
        joinDate: '2023-12-05'
      }
    ]);

    // Load settings from localStorage for demo
    const storedSettings = localStorage.getItem('adminSettings');
    if (storedSettings) {
      setSettings(JSON.parse(storedSettings));
    }
  };

  const handleWithdrawalAction = (withdrawalId: string, action: 'approve' | 'reject') => {
    setWithdrawalRequests(prev => 
      prev.map(request => 
        request.id === withdrawalId 
          ? { ...request, status: action === 'approve' ? 'completed' : 'failed' }
          : request
      )
    );

    toast({
      title: `Withdrawal ${action === 'approve' ? 'Approved' : 'Rejected'}`,
      description: `Withdrawal request has been ${action === 'approve' ? 'approved' : 'rejected'}`,
    });
  };

  const updateSetting = (key: string, value: string) => {
    const updatedSettings = { ...settings, [key]: value };
    setSettings(updatedSettings);
    localStorage.setItem('adminSettings', JSON.stringify(updatedSettings));
    
    toast({
      title: "Setting Updated",
      description: `${key} has been updated to ${value}`,
    });
  };

  const saveAllSettings = () => {
    localStorage.setItem('adminSettings', JSON.stringify(settings));
    toast({
      title: "Settings Saved",
      description: "All settings have been saved successfully",
    });
  };

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white text-center">Admin Access</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="adminId" className="text-white">Admin Telegram ID</Label>
              <Input
                id="adminId"
                type="text"
                placeholder="Enter admin Telegram ID"
                value={adminId}
                onChange={(e) => setAdminId(e.target.value)}
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>
            <Button onClick={handleAdminLogin} className="w-full">
              Access Admin Panel
            </Button>
            <p className="text-gray-400 text-sm text-center">
              Only authorized admin (ID: {ADMIN_TELEGRAM_ID}) can access this panel
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center">Admin Control Panel</h1>
        
        <Tabs defaultValue="withdrawals" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-gray-800">
            <TabsTrigger value="withdrawals">Withdrawals</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="ads">Ads & Content</TabsTrigger>
          </TabsList>

          {/* Withdrawal Management */}
          <TabsContent value="withdrawals">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Pending Withdrawals</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {withdrawalRequests
                    .filter(request => request.status === 'pending')
                    .map((request) => (
                    <div key={request.id} className="flex justify-between items-center p-4 bg-gray-700 rounded-lg">
                      <div className="space-y-1">
                        <p className="text-white font-medium">@{request.username}</p>
                        <p className="text-green-400">${request.amount.toFixed(2)} USDT</p>
                        <p className="text-gray-400 text-sm">{request.method === 'binance' ? 'Binance Pay' : 'USDT TRC20'}</p>
                        <p className="text-gray-400 text-sm">{request.address}</p>
                        <p className="text-gray-500 text-xs">{request.date}</p>
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
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* User Management */}
          <TabsContent value="users">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">User Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users.map((user) => (
                    <div key={user.id} className="p-4 bg-gray-700 rounded-lg">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-white font-medium">@{user.username}</p>
                          <p className="text-gray-400 text-sm">Joined: {user.joinDate}</p>
                        </div>
                        <div>
                          <p className="text-green-400">${user.balance.toFixed(2)}</p>
                          <p className="text-gray-400 text-sm">Balance</p>
                        </div>
                        <div>
                          <p className="text-blue-400">{user.referrals} referrals</p>
                          <p className="text-gray-400 text-sm">{user.adsWatched}/30 ads</p>
                        </div>
                        <div>
                          <p className="text-purple-400">{user.spinsUsed}/30 spins</p>
                          <p className="text-gray-400 text-sm">Daily usage</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings */}
          <TabsContent value="settings">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Earning Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-white">Ad Reward Rate (USDT)</Label>
                    <Input
                      value={settings.adRewardRate}
                      onChange={(e) => setSettings({...settings, adRewardRate: e.target.value})}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-white">Referral Rate (%)</Label>
                    <Input
                      value={settings.referralRate}
                      onChange={(e) => setSettings({...settings, referralRate: e.target.value})}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-white">Min Withdrawal (USDT)</Label>
                    <Input
                      value={settings.minWithdrawal}
                      onChange={(e) => setSettings({...settings, minWithdrawal: e.target.value})}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>

                  <div>
                    <Label className="text-white">Required Referrals for Withdrawal</Label>
                    <Input
                      value={settings.requiredReferrals}
                      onChange={(e) => setSettings({...settings, requiredReferrals: e.target.value})}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Limits & Controls</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-white">Daily Ad Limit</Label>
                    <Input
                      value={settings.dailyAdLimit}
                      onChange={(e) => setSettings({...settings, dailyAdLimit: e.target.value})}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-white">Daily Spin Limit</Label>
                    <Input
                      value={settings.dailySpinLimit}
                      onChange={(e) => setSettings({...settings, dailySpinLimit: e.target.value})}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-white">Spin Win Percentage (%)</Label>
                    <Input
                      value={settings.spinWinPercentage}
                      onChange={(e) => setSettings({...settings, spinWinPercentage: e.target.value})}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                    <p className="text-gray-400 text-sm mt-1">Percentage of spins that result in wins</p>
                  </div>

                  <Button onClick={saveAllSettings} className="w-full bg-blue-600 hover:bg-blue-700">
                    Save All Settings
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Ads & Content */}
          <TabsContent value="ads">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Advertisement Management</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-white">HTML Ad Code</Label>
                  <Textarea
                    value={settings.htmlAdCode}
                    onChange={(e) => setSettings({...settings, htmlAdCode: e.target.value})}
                    className="bg-gray-700 border-gray-600 text-white min-h-[200px]"
                    placeholder="Enter your HTML ad code here..."
                  />
                  <p className="text-gray-400 text-sm mt-2">
                    This HTML code will be displayed to users when they watch ads
                  </p>
                </div>

                <Button 
                  onClick={() => updateSetting('htmlAdCode', settings.htmlAdCode)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Update Ad Code
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminPanel;
