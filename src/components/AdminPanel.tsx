import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { useAdmin } from '../contexts/AdminContext';
import { dbService, WithdrawalRequest, User } from '../services/database';
import { taskService, Task } from '../services/taskService';
import { Settings, Users, DollarSign, BarChart3, Globe, Shield, Eye, EyeOff, UserPlus, Edit2, Check, X, Plus, Trash2, Trophy } from 'lucide-react';

const AdminPanel: React.FC = () => {
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [adminId, setAdminId] = useState('');
  const [showAdminId, setShowAdminId] = useState(false);
  const [editingBalance, setEditingBalance] = useState<string | null>(null);
  const [editBalance, setEditBalance] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Task form states
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    task_type: 'telegram_channel' as const,
    task_url: '',
    reward_amount: 0.01,
    is_active: true
  });

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
      // Subscribe to real-time updates
      const unsubscribeWithdrawals = dbService.subscribeToWithdrawals((withdrawals) => {
        setWithdrawalRequests(withdrawals);
      });

      const unsubscribeUsers = dbService.subscribeToUsers((users) => {
        setAllUsers(users);
      });

      return () => {
        if (unsubscribeWithdrawals) unsubscribeWithdrawals();
        if (unsubscribeUsers) unsubscribeUsers();
      };
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
      setLoading(true);
      const [withdrawals, users, tasks] = await Promise.all([
        dbService.getWithdrawalRequests(),
        dbService.getAllUsers(),
        taskService.getAllTasks()
      ]);
      
      setWithdrawalRequests(withdrawals);
      setAllUsers(users);
      setAllTasks(tasks);
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

  const handleWithdrawalAction = async (withdrawalId: string, action: 'approve' | 'reject') => {
    try {
      const status = action === 'approve' ? 'completed' : 'rejected';
      const success = await dbService.updateWithdrawalStatus(withdrawalId, status);
      
      if (success) {
        toast({
          title: `Withdrawal ${action === 'approve' ? 'Approved' : 'Rejected'}`,
          description: `Request processed successfully`,
        });
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

  const handleBalanceEdit = (telegramId: string, currentBalance: number) => {
    setEditingBalance(telegramId);
    setEditBalance(currentBalance.toFixed(3));
  };

  const handleBalanceUpdate = async (telegramId: string) => {
    try {
      const newBalance = parseFloat(editBalance);
      if (isNaN(newBalance) || newBalance < 0) {
        toast({
          title: "Invalid Balance",
          description: "Please enter a valid positive number",
          variant: "destructive"
        });
        return;
      }

      const success = await dbService.adminUpdateUserBalance(telegramId, newBalance);
      
      if (success) {
        toast({
          title: "Balance Updated",
          description: `User balance updated to $${newBalance.toFixed(3)}`,
        });
        setEditingBalance(null);
        loadAdminData(); // Refresh data
      } else {
        toast({
          title: "Error",
          description: "Failed to update user balance",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error updating balance:', error);
      toast({
        title: "Error",
        description: "Failed to update user balance",
        variant: "destructive"
      });
    }
  };

  const cancelBalanceEdit = () => {
    setEditingBalance(null);
    setEditBalance('');
  };

  // Task management functions
  const handleCreateTask = async () => {
    try {
      if (!newTask.title || !newTask.task_url) {
        toast({
          title: "Validation Error",
          description: "Title and URL are required",
          variant: "destructive"
        });
        return;
      }

      const success = await taskService.createTask(newTask);
      
      if (success) {
        toast({
          title: "Task Created",
          description: "New task has been created successfully",
        });
        
        // Reset form
        setNewTask({
          title: '',
          description: '',
          task_type: 'telegram_channel',
          task_url: '',
          reward_amount: 0.01,
          is_active: true
        });
        
        // Reload tasks
        const tasks = await taskService.getAllTasks();
        setAllTasks(tasks);
      } else {
        toast({
          title: "Error",
          description: "Failed to create task",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error creating task:', error);
      toast({
        title: "Error",
        description: "Failed to create task",
        variant: "destructive"
      });
    }
  };

  const handleToggleTaskStatus = async (taskId: string, currentStatus: boolean) => {
    try {
      const success = await taskService.updateTask(taskId, { is_active: !currentStatus });
      
      if (success) {
        toast({
          title: "Task Updated",
          description: `Task ${!currentStatus ? 'activated' : 'deactivated'} successfully`,
        });
        
        // Update local state
        setAllTasks(allTasks.map(task => 
          task.id === taskId ? { ...task, is_active: !currentStatus } : task
        ));
      } else {
        toast({
          title: "Error",
          description: "Failed to update task",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error updating task:', error);
      toast({
        title: "Error",
        description: "Failed to update task",
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
        
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 bg-gray-800/50 backdrop-blur-sm border border-gray-700">
            <TabsTrigger value="users" className="flex items-center space-x-2">
              <Users className="w-4 h-4" />
              <span>Users</span>
            </TabsTrigger>
            <TabsTrigger value="tasks" className="flex items-center space-x-2">
              <Trophy className="w-4 h-4" />
              <span>Tasks</span>
            </TabsTrigger>
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

          {/* Tasks Management Tab */}
          <TabsContent value="tasks">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Create New Task */}
              <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Plus className="w-5 h-5 mr-2" />
                    Create New Task
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-white">Task Title</Label>
                    <Input
                      value={newTask.title}
                      onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                      className="bg-gray-700 border-gray-600 text-white"
                      placeholder="e.g., Join our Telegram Channel"
                    />
                  </div>

                  <div>
                    <Label className="text-white">Description</Label>
                    <Textarea
                      value={newTask.description}
                      onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                      className="bg-gray-700 border-gray-600 text-white"
                      placeholder="Optional description..."
                    />
                  </div>

                  <div>
                    <Label className="text-white">Task Type</Label>
                    <Select
                      value={newTask.task_type}
                      onValueChange={(value: any) => setNewTask({ ...newTask, task_type: value })}
                    >
                      <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-700 border-gray-600">
                        <SelectItem value="telegram_join">Telegram Bot Join</SelectItem>
                        <SelectItem value="telegram_channel">Telegram Channel</SelectItem>
                        <SelectItem value="youtube_subscribe">YouTube Subscribe</SelectItem>
                        <SelectItem value="website_visit">Website Visit</SelectItem>
                        <SelectItem value="social_follow">Social Follow</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-white">Task URL</Label>
                    <Input
                      value={newTask.task_url}
                      onChange={(e) => setNewTask({ ...newTask, task_url: e.target.value })}
                      className="bg-gray-700 border-gray-600 text-white"
                      placeholder="https://t.me/yourchannel"
                    />
                  </div>

                  <div>
                    <Label className="text-white">Reward Amount (USDT)</Label>
                    <Input
                      type="number"
                      step="0.001"
                      value={newTask.reward_amount}
                      onChange={(e) => setNewTask({ ...newTask, reward_amount: parseFloat(e.target.value) || 0 })}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={newTask.is_active}
                      onCheckedChange={(checked) => setNewTask({ ...newTask, is_active: checked })}
                    />
                    <Label className="text-white">Active</Label>
                  </div>

                  <Button
                    onClick={handleCreateTask}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Task
                  </Button>
                </CardContent>
              </Card>

              {/* Task Statistics */}
              <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Task Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-600/20 p-4 rounded-lg">
                      <h3 className="text-blue-300 text-sm">Total Tasks</h3>
                      <p className="text-2xl font-bold text-white">{allTasks.length}</p>
                    </div>
                    <div className="bg-green-600/20 p-4 rounded-lg">
                      <h3 className="text-green-300 text-sm">Active Tasks</h3>
                      <p className="text-2xl font-bold text-white">
                        {allTasks.filter(t => t.is_active).length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Existing Tasks */}
            <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">All Tasks ({allTasks.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">
                    <p className="text-gray-400">Loading tasks...</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-gray-600">
                          <TableHead className="text-gray-300">Task</TableHead>
                          <TableHead className="text-gray-300">Type</TableHead>
                          <TableHead className="text-gray-300">Reward</TableHead>
                          <TableHead className="text-gray-300">Status</TableHead>
                          <TableHead className="text-gray-300">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {allTasks.map((task) => (
                          <TableRow key={task.id} className="border-gray-600">
                            <TableCell>
                              <div>
                                <p className="text-white font-medium">{task.title}</p>
                                {task.description && (
                                  <p className="text-gray-400 text-sm">{task.description}</p>
                                )}
                                <p className="text-blue-400 text-xs">{task.task_url}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="text-gray-300 capitalize">
                                {task.task_type.replace('_', ' ')}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className="text-green-400 font-bold">
                                ${task.reward_amount.toFixed(3)}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className={`px-2 py-1 rounded text-xs ${
                                task.is_active 
                                  ? 'bg-green-600/20 text-green-300' 
                                  : 'bg-red-600/20 text-red-300'
                              }`}>
                                {task.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                variant={task.is_active ? "destructive" : "default"}
                                onClick={() => handleToggleTaskStatus(task.id, task.is_active)}
                                className="h-8 px-3"
                              >
                                {task.is_active ? 'Deactivate' : 'Activate'}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Management Tab */}
          <TabsContent value="users">
            <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <UserPlus className="w-5 h-5 mr-2" />
                  User Management ({allUsers.length} total users)
                  <span className="ml-auto text-xs bg-green-600/20 text-green-300 px-2 py-1 rounded">LIVE</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">
                    <p className="text-gray-400">Loading users...</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-gray-600">
                          <TableHead className="text-gray-300">User</TableHead>
                          <TableHead className="text-gray-300">Balance</TableHead>
                          <TableHead className="text-gray-300">Referrals</TableHead>
                          <TableHead className="text-gray-300">Ads Today</TableHead>
                          <TableHead className="text-gray-300">Channels</TableHead>
                          <TableHead className="text-gray-300">Joined</TableHead>
                          <TableHead className="text-gray-300">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {allUsers.map((user) => (
                          <TableRow key={user.telegram_id} className="border-gray-600">
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="text-white font-medium">
                                  {user.first_name} {user.last_name}
                                </span>
                                <span className="text-gray-400 text-sm">
                                  @{user.username || 'N/A'} • ID: {user.telegram_id}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {editingBalance === user.telegram_id ? (
                                <div className="flex items-center space-x-2">
                                  <Input
                                    type="number"
                                    step="0.001"
                                    value={editBalance}
                                    onChange={(e) => setEditBalance(e.target.value)}
                                    className="w-24 h-8 bg-gray-700 border-gray-600 text-white"
                                  />
                                  <Button
                                    size="sm"
                                    onClick={() => handleBalanceUpdate(user.telegram_id)}
                                    className="h-8 px-2 bg-green-600 hover:bg-green-700"
                                  >
                                    <Check className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={cancelBalanceEdit}
                                    className="h-8 px-2"
                                  >
                                    <X className="w-4 h-4" />
                                  </Button>
                                </div>
                              ) : (
                                <div className="flex items-center space-x-2">
                                  <span className="text-green-400 font-bold">
                                    ${(user.balance || 0).toFixed(3)}
                                  </span>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleBalanceEdit(user.telegram_id, user.balance || 0)}
                                    className="h-6 w-6 p-0 text-gray-400 hover:text-white"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                  </Button>
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              <span className="text-blue-400 font-medium">{user.referral_count || 0}</span>
                            </TableCell>
                            <TableCell>
                              <span className="text-purple-400">{user.ads_watched_today || 0}/30</span>
                            </TableCell>
                            <TableCell>
                              <span className={`px-2 py-1 rounded text-xs ${
                                user.channels_joined 
                                  ? 'bg-green-600/20 text-green-300' 
                                  : 'bg-red-600/20 text-red-300'
                              }`}>
                                {user.channels_joined ? 'Joined' : 'Not Joined'}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className="text-gray-400 text-sm">
                                {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 px-2 text-xs border-gray-600 text-gray-300"
                                >
                                  View
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

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
                        <p className="text-gray-500 text-xs">{new Date(request.created_at || '').toLocaleDateString()}</p>
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
                  <h3 className="text-2xl font-bold text-white">{allUsers.length}</h3>
                  <p className="text-gray-400">Total Users</p>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-green-600/20 to-blue-600/20 border-green-500/30">
                <CardContent className="p-6 text-center">
                  <DollarSign className="w-12 h-12 text-green-400 mx-auto mb-2" />
                  <h3 className="text-2xl font-bold text-white">
                    ${allUsers.reduce((sum, user) => sum + (user.balance || 0), 0).toFixed(2)}
                  </h3>
                  <p className="text-gray-400">Total Balance</p>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 border-purple-500/30">
                <CardContent className="p-6 text-center">
                  <BarChart3 className="w-12 h-12 text-purple-400 mx-auto mb-2" />
                  <h3 className="text-2xl font-bold text-white">
                    {allUsers.reduce((sum, user) => sum + (user.ads_watched_today || 0), 0)}
                  </h3>
                  <p className="text-gray-400">Ads Watched Today</p>
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
