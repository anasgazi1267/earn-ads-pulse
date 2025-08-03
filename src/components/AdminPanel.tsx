
import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Users, Settings, DollarSign, Activity, Target, Trash2, UserX, Plus, Edit, Eye } from 'lucide-react';
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
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalBalance: 0,
    pendingWithdrawals: 0,
    totalReferrals: 0
  });
  const { toast } = useToast();

  useEffect(() => {
    loadAdminData();
    
    // Set up real-time subscriptions
    const unsubscribeUsers = dbService.subscribeToUsers(setUsers);
    const unsubscribeWithdrawals = dbService.subscribeToWithdrawals(setWithdrawalRequests);
    const unsubscribeSettings = dbService.subscribeToAdminSettings(setAdminSettings);

    return () => {
      unsubscribeUsers();
      unsubscribeWithdrawals();
      unsubscribeSettings();
    };
  }, []);

  useEffect(() => {
    // Calculate stats when users or withdrawals change
    if (users.length > 0) {
      const totalBalance = users.reduce((sum, user) => sum + (user.balance || 0), 0);
      const totalReferrals = users.reduce((sum, user) => sum + (user.referral_count || 0), 0);
      const pendingWithdrawals = withdrawalRequests
        .filter(req => req.status === 'pending')
        .reduce((sum, req) => sum + req.amount, 0);

      setStats({
        totalUsers: users.length,
        totalBalance,
        totalReferrals,
        pendingWithdrawals
      });
    }
  }, [users, withdrawalRequests]);

  const loadAdminData = async () => {
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

  const handleCreateTask = async (taskData: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const success = await taskService.createTask(taskData);
      if (success) {
        toast({
          title: "Success",
          description: "Task created successfully",
        });
        setShowTaskForm(false);
        loadAdminData();
      } else {
        throw new Error('Task creation failed');
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

  const handleUpdateTask = async (taskId: string, updates: Partial<Task>) => {
    try {
      const success = await taskService.updateTask(taskId, updates);
      if (success) {
        toast({
          title: "Success",
          description: "Task updated successfully",
        });
        setEditingTask(null);
        loadAdminData();
      } else {
        throw new Error('Task update failed');
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

  const handleApproveDeposit = async (depositId: string) => {
    try {
      const success = await dbService.updateDepositStatus(depositId, 'completed');
      if (success) {
        toast({
          title: "Success",
          description: "Deposit approved successfully",
        });
        loadAdminData();
      } else {
        throw new Error('Deposit approval failed');
      }
    } catch (error) {
      console.error('Error approving deposit:', error);
      toast({
        title: "Error",
        description: "Failed to approve deposit",
        variant: "destructive"
      });
    }
  };

  const handleUpdateBalance = async (telegramId: string, newBalance: number) => {
    try {
      const success = await dbService.adminUpdateUserBalance(telegramId, newBalance);
      if (success) {
        toast({
          title: "Success",
          description: "User balance updated successfully",
        });
        loadAdminData();
      } else {
        throw new Error('Update failed');
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

  const handleDeleteUser = async (telegramId: string, username: string) => {
    if (!confirm(`Are you sure you want to delete user "${username || telegramId}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const success = await dbService.deleteUser(telegramId);
      if (success) {
        toast({
          title: "Success",
          description: "User deleted successfully",
        });
        loadAdminData();
      } else {
        throw new Error('Delete failed');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: "Error",
        description: "Failed to delete user",
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

  const handleWithdrawalAction = async (id: string, action: 'approve' | 'reject') => {
    try {
      const status = action === 'approve' ? 'completed' : 'rejected';
      const success = await dbService.updateWithdrawalStatus(id, status);
      
      if (success) {
        toast({
          title: "Success",
          description: `Withdrawal ${action}d successfully`,
        });
        loadAdminData();
      } else {
        throw new Error('Update failed');
      }
    } catch (error) {
      console.error('Error updating withdrawal:', error);
      toast({
        title: "Error",
        description: `Failed to ${action} withdrawal`,
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
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
          <p className="text-gray-400">Manage your Telegram Mini App</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gray-800 border-gray-700">
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

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Balance</p>
                  <p className="text-2xl font-bold text-white">${stats.totalBalance.toFixed(3)}</p>
                </div>
                <DollarSign className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Pending Withdrawals</p>
                  <p className="text-2xl font-bold text-white">${stats.pendingWithdrawals.toFixed(3)}</p>
                </div>
                <Activity className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Referrals</p>
                  <p className="text-2xl font-bold text-white">{stats.totalReferrals}</p>
                </div>
                <Target className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="bg-gray-800 border-gray-700">
            <TabsTrigger value="users" className="data-[state=active]:bg-gray-700">Users</TabsTrigger>
            <TabsTrigger value="channels" className="data-[state=active]:bg-gray-700">Channels</TabsTrigger>
            <TabsTrigger value="tasks" className="data-[state=active]:bg-gray-700">Tasks</TabsTrigger>
            <TabsTrigger value="deposits" className="data-[state=active]:bg-gray-700">Deposits</TabsTrigger>
            <TabsTrigger value="withdrawals" className="data-[state=active]:bg-gray-700">Withdrawals</TabsTrigger>
            <TabsTrigger value="payments" className="data-[state=active]:bg-gray-700">Payments</TabsTrigger>
            <TabsTrigger value="ads" className="data-[state=active]:bg-gray-700">Ads</TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-gray-700">Settings</TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card className="bg-gray-800 border-gray-700">
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
                        <th className="text-left py-3 px-4 text-gray-300">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user.id} className="border-b border-gray-700/50">
                          <td className="py-3 px-4">
                            <div>
                              <p className="text-white font-medium">
                                {user.first_name} {user.last_name}
                              </p>
                              <p className="text-gray-400 text-xs">@{user.username || 'no_username'}</p>
                              <p className="text-gray-500 text-xs">ID: {user.telegram_id}</p>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-2">
                              <Input
                                type="number"
                                step="0.001"
                                defaultValue={user.balance?.toFixed(3) || '0.000'}
                                className="w-24 bg-gray-700 border-gray-600 text-white text-sm"
                                onBlur={(e) => {
                                  const newBalance = parseFloat(e.target.value) || 0;
                                  if (newBalance !== user.balance) {
                                    handleUpdateBalance(user.telegram_id, newBalance);
                                  }
                                }}
                              />
                              <span className="text-gray-400 text-xs">USDT</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-white">{user.referral_count || 0}</span>
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant={user.channels_joined ? "default" : "secondary"}>
                              {user.channels_joined ? 'Verified' : 'Unverified'}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteUser(user.telegram_id, user.username || user.first_name || '')}
                              className="border-red-600 text-red-400 hover:bg-red-900/20"
                            >
                              <UserX className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Channels Tab */}
          <TabsContent value="channels">
            <ChannelManagement />
          </TabsContent>

          {/* Tasks Tab */}
          <TabsContent value="tasks">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-white">Task Management</CardTitle>
                  <Button 
                    onClick={() => setShowTaskForm(true)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Task
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {showTaskForm && (
                  <div className="mb-6 p-4 bg-gray-700/50 rounded-lg border border-gray-600">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-white">Title</Label>
                        <Input 
                          placeholder="Task title"
                          className="bg-gray-700 border-gray-600 text-white"
                          id="task-title"
                        />
                      </div>
                      <div>
                        <Label className="text-white">Type</Label>
                        <Input 
                          placeholder="e.g., social, survey, follow"
                          className="bg-gray-700 border-gray-600 text-white"
                          id="task-type"
                        />
                      </div>
                      <div>
                        <Label className="text-white">URL</Label>
                        <Input 
                          placeholder="Task URL"
                          className="bg-gray-700 border-gray-600 text-white"
                          id="task-url"
                        />
                      </div>
                      <div>
                        <Label className="text-white">Reward (USDT)</Label>
                        <Input 
                          type="number"
                          step="0.001"
                          placeholder="0.010"
                          className="bg-gray-700 border-gray-600 text-white"
                          id="task-reward"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label className="text-white">Description</Label>
                        <Input 
                          placeholder="Task description"
                          className="bg-gray-700 border-gray-600 text-white"
                          id="task-description"
                        />
                      </div>
                      <div>
                        <Label className="text-white">Max Completions</Label>
                        <Input 
                          type="number"
                          placeholder="100"
                          className="bg-gray-700 border-gray-600 text-white"
                          id="task-max"
                        />
                      </div>
                      <div>
                        <Label className="text-white">Total Budget (USDT)</Label>
                        <Input 
                          type="number"
                          step="0.001"
                          placeholder="1.000"
                          className="bg-gray-700 border-gray-600 text-white"
                          id="task-budget"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button 
                        onClick={() => {
                          const title = (document.getElementById('task-title') as HTMLInputElement).value;
                          const type = (document.getElementById('task-type') as HTMLInputElement).value;
                          const url = (document.getElementById('task-url') as HTMLInputElement).value;
                          const reward = parseFloat((document.getElementById('task-reward') as HTMLInputElement).value);
                          const description = (document.getElementById('task-description') as HTMLInputElement).value;
                          const maxCompletions = parseInt((document.getElementById('task-max') as HTMLInputElement).value);
                          const totalBudget = parseFloat((document.getElementById('task-budget') as HTMLInputElement).value);
                          
                          if (title && type && url && reward) {
                            handleCreateTask({
                              title,
                              task_type: type,
                              task_url: url,
                              reward_amount: reward,
                              description: description || null,
                              max_completions: maxCompletions || null,
                              total_budget: totalBudget || null,
                              is_active: true,
                              current_completions: 0,
                              user_created: false,
                              created_by_user: null,
                              admin_fee: 0.01,
                              status: 'active'
                            });
                          }
                        }}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Create Task
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => setShowTaskForm(false)}
                        className="border-gray-600 text-gray-300"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
                
                <div className="space-y-4">
                  {tasks.length === 0 ? (
                    <p className="text-gray-400 text-center py-8">No tasks found</p>
                  ) : (
                    tasks.map((task) => (
                      <div key={task.id} className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h3 className="text-white font-medium">{task.title}</h3>
                            <p className="text-gray-400 text-sm">{task.description}</p>
                            <div className="flex items-center gap-4 mt-2 text-sm">
                              <span className="text-green-400">Reward: ${task.reward_amount}</span>
                              <span className="text-blue-400">Type: {task.task_type}</span>
                              <span className="text-purple-400">
                                Completed: {task.current_completions || 0}/{task.max_completions || '∞'}
                              </span>
                              {task.user_created && (
                                <Badge variant="secondary">User Created</Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant={task.is_active ? "default" : "secondary"}>
                              {task.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(task.task_url, '_blank')}
                              className="border-blue-600 text-blue-400"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                const updates = { is_active: !task.is_active };
                                handleUpdateTask(task.id, updates);
                              }}
                              className="border-yellow-600 text-yellow-400"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Deposits Tab */}
          <TabsContent value="deposits">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Deposit Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {deposits.length === 0 ? (
                    <p className="text-gray-400 text-center py-8">No deposits found</p>
                  ) : (
                    deposits.map((deposit) => (
                      <div key={deposit.id} className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-white font-medium">
                              {deposit.users?.first_name} {deposit.users?.last_name}
                            </p>
                            <p className="text-gray-400 text-sm">@{deposit.users?.username}</p>
                            <p className="text-gray-400 text-sm">Amount: ৳{deposit.amount} BDT</p>
                            <p className="text-gray-400 text-sm">Method: {deposit.deposit_method}</p>
                            {deposit.transaction_id && (
                              <p className="text-gray-400 text-sm">TXN: {deposit.transaction_id}</p>
                            )}
                            <p className="text-gray-500 text-xs">
                              {new Date(deposit.created_at).toLocaleString()}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant={
                              deposit.status === 'completed' ? 'default' :
                              deposit.status === 'rejected' ? 'destructive' : 'secondary'
                            }>
                              {deposit.status || 'pending'}
                            </Badge>
                            {deposit.status === 'pending' && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => handleApproveDeposit(deposit.id)}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => dbService.updateDepositStatus(deposit.id, 'rejected')}
                                  className="border-red-600 text-red-400"
                                >
                                  Reject
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Withdrawals Tab */}
          <TabsContent value="withdrawals">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Withdrawal Requests</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {withdrawalRequests.length === 0 ? (
                    <p className="text-gray-400 text-center py-8">No withdrawal requests found</p>
                  ) : (
                    withdrawalRequests.map((request) => (
                      <div key={request.id} className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-white font-medium">@{request.username}</p>
                            <p className="text-gray-400 text-sm">Amount: ${request.amount.toFixed(3)} USDT</p>
                            <p className="text-gray-400 text-sm">Method: {request.withdrawal_method}</p>
                            <p className="text-gray-400 text-sm">Wallet: {request.wallet_address}</p>
                            <p className="text-gray-500 text-xs">
                              {new Date(request.created_at!).toLocaleString()}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant={
                              request.status === 'completed' ? 'default' :
                              request.status === 'rejected' ? 'destructive' : 'secondary'
                            }>
                              {request.status || 'pending'}
                            </Badge>
                            {request.status === 'pending' && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => handleWithdrawalAction(request.id, 'approve')}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleWithdrawalAction(request.id, 'reject')}
                                  className="border-red-600 text-red-400"
                                >
                                  Reject
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Settings className="w-5 h-5 mr-2" />
                  App Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Channel Verification Setting */}
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

                {/* Ad Reward Setting */}
                <div className="p-4 bg-gray-700/50 rounded-lg">
                  <Label className="text-white font-medium mb-2 block">Ad Reward Amount (USDT)</Label>
                  <Input
                    type="number"
                    step="0.001"
                    defaultValue={adminSettings.ad_reward_amount || '0.001'}
                    className="bg-gray-700 border-gray-600 text-white max-w-xs"
                    onBlur={(e) => handleUpdateSetting('ad_reward_amount', e.target.value)}
                  />
                  <p className="text-gray-400 text-sm mt-1">Amount users earn per ad view</p>
                </div>

                {/* Daily Ad Limit Setting */}
                <div className="p-4 bg-gray-700/50 rounded-lg">
                  <Label className="text-white font-medium mb-2 block">Daily Ad Limit</Label>
                  <Input
                    type="number"
                    defaultValue={adminSettings.daily_ad_limit || '50'}
                    className="bg-gray-700 border-gray-600 text-white max-w-xs"
                    onBlur={(e) => handleUpdateSetting('daily_ad_limit', e.target.value)}
                  />
                  <p className="text-gray-400 text-sm mt-1">Maximum ads per user per day</p>
                </div>

                {/* Referral Bonus Setting */}
                <div className="p-4 bg-gray-700/50 rounded-lg">
                  <Label className="text-white font-medium mb-2 block">Referral Bonus (USDT)</Label>
                  <Input
                    type="number"
                    step="0.001"
                    defaultValue={adminSettings.referral_bonus || '0.01'}
                    className="bg-gray-700 border-gray-600 text-white max-w-xs"
                    onBlur={(e) => handleUpdateSetting('referral_bonus', e.target.value)}
                  />
                  <p className="text-gray-400 text-sm mt-1">Bonus amount per successful referral</p>
                </div>

                {/* Minimum Withdrawal Setting */}
                <div className="p-4 bg-gray-700/50 rounded-lg">
                  <Label className="text-white font-medium mb-2 block">Minimum Withdrawal (USDT)</Label>
                  <Input
                    type="number"
                    step="0.001"
                    defaultValue={adminSettings.min_withdrawal_amount || '5.000'}
                    className="bg-gray-700 border-gray-600 text-white max-w-xs"
                    onBlur={(e) => handleUpdateSetting('min_withdrawal_amount', e.target.value)}
                  />
                  <p className="text-gray-400 text-sm mt-1">Minimum amount for withdrawal requests</p>
                </div>

                {/* Bkash Exchange Rate Setting */}
                <div className="p-4 bg-gray-700/50 rounded-lg">
                  <Label className="text-white font-medium mb-2 block">Bkash Exchange Rate (BDT per 1 USD)</Label>
                  <Input
                    type="number"
                    defaultValue={adminSettings.bkash_rate || '120'}
                    className="bg-gray-700 border-gray-600 text-white max-w-xs"
                    onBlur={(e) => handleUpdateSetting('bkash_rate', e.target.value)}
                  />
                  <p className="text-gray-400 text-sm mt-1">How many BDT equals 1 USD for Bkash deposits</p>
                </div>

                {/* Minimum Deposit Setting */}
                <div className="p-4 bg-gray-700/50 rounded-lg">
                  <Label className="text-white font-medium mb-2 block">Minimum Deposit Amount (BDT)</Label>
                  <Input
                    type="number"
                    defaultValue={adminSettings.min_deposit_amount || '120'}
                    className="bg-gray-700 border-gray-600 text-white max-w-xs"
                    onBlur={(e) => handleUpdateSetting('min_deposit_amount', e.target.value)}
                  />
                  <p className="text-gray-400 text-sm mt-1">Minimum deposit amount in BDT</p>
                </div>

                {/* Conversion Settings */}
                <div className="p-4 bg-gray-700/50 rounded-lg">
                  <Label className="text-white font-medium mb-2 block">Minimum Conversion Amount (USDT)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    defaultValue={adminSettings.min_conversion_amount || '1.0'}
                    className="bg-gray-700 border-gray-600 text-white max-w-xs"
                    onBlur={(e) => handleUpdateSetting('min_conversion_amount', e.target.value)}
                  />
                  <p className="text-gray-400 text-sm mt-1">Minimum earning balance to convert to deposit balance</p>
                </div>

                <div className="p-4 bg-gray-700/50 rounded-lg">
                  <Label className="text-white font-medium mb-2 block">Conversion Fee (USDT)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    defaultValue={adminSettings.conversion_fee || '0.1'}
                    className="bg-gray-700 border-gray-600 text-white max-w-xs"
                    onBlur={(e) => handleUpdateSetting('conversion_fee', e.target.value)}
                  />
                  <p className="text-gray-400 text-sm mt-1">Fee charged for converting earning to deposit balance</p>
                </div>

                {/* User Task Admin Fee */}
                <div className="p-4 bg-gray-700/50 rounded-lg">
                  <Label className="text-white font-medium mb-2 block">User Task Admin Fee (USDT)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    defaultValue={adminSettings.user_task_admin_fee || '0.01'}
                    className="bg-gray-700 border-gray-600 text-white max-w-xs"
                    onBlur={(e) => handleUpdateSetting('user_task_admin_fee', e.target.value)}
                  />
                  <p className="text-gray-400 text-sm mt-1">Admin fee earned per user-uploaded task completion</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payment Methods Tab */}
          <TabsContent value="payments">
            <PaymentMethodsManager />
          </TabsContent>

          {/* Ads Tab */}
          <TabsContent value="ads">
            <AdCodeManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminPanel;
