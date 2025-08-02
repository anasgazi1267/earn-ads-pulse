import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Calculator, Eye, Users, DollarSign, Target, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { dbService } from '@/services/database';
import { taskService } from '@/services/taskService';

interface EnhancedTaskUploadProps {
  userInfo: any;
  onBack: () => void;
}

const EnhancedTaskUpload = ({ userInfo, onBack }: EnhancedTaskUploadProps) => {
  const [taskData, setTaskData] = useState({
    title: '',
    description: '',
    task_type: 'social',
    task_url: '',
    reward_amount: 0.005,
    total_budget: 1.0,
    max_completions: 0
  });
  const [adminSettings, setAdminSettings] = useState<Record<string, string>>({});
  const [userTasks, setUserTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
    loadUserTasks();
  }, []);

  useEffect(() => {
    // Auto-calculate max completions when budget or CPC changes
    if (taskData.total_budget > 0 && taskData.reward_amount > 0) {
      const maxCompletions = Math.floor(taskData.total_budget / taskData.reward_amount);
      setTaskData(prev => ({ ...prev, max_completions: maxCompletions }));
    }
  }, [taskData.total_budget, taskData.reward_amount]);

  const loadSettings = async () => {
    try {
      const settings = await dbService.getAdminSettings();
      setAdminSettings(settings);
      
      // Set default values from admin settings
      setTaskData(prev => ({
        ...prev,
        reward_amount: parseFloat(settings.min_task_cpc || '0.005'),
        total_budget: parseFloat(settings.min_task_budget || '1.0')
      }));
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const loadUserTasks = async () => {
    try {
      setLoadingTasks(true);
      const allTasks = await taskService.getAllTasks();
      const userTasks = allTasks.filter(task => task.created_by_user === userInfo.telegram_id);
      setUserTasks(userTasks);
    } catch (error) {
      console.error('Error loading user tasks:', error);
    } finally {
      setLoadingTasks(false);
    }
  };

  const minCPC = parseFloat(adminSettings.min_task_cpc || '0.005');
  const minBudget = parseFloat(adminSettings.min_task_budget || '1.0');
  const userDepositBalance = userInfo.deposit_balance || 0;

  const handleSubmit = async () => {
    // Validations
    if (!taskData.title.trim()) {
      toast({
        title: "Error",
        description: "Please enter a task title",
        variant: "destructive"
      });
      return;
    }

    if (!taskData.task_url.trim()) {
      toast({
        title: "Error",
        description: "Please enter a task URL",
        variant: "destructive"
      });
      return;
    }

    if (taskData.reward_amount < minCPC) {
      toast({
        title: "Error",
        description: `Minimum CPC is $${minCPC}`,
        variant: "destructive"
      });
      return;
    }

    if (taskData.total_budget < minBudget) {
      toast({
        title: "Error",
        description: `Minimum budget is $${minBudget}`,
        variant: "destructive"
      });
      return;
    }

    if (taskData.total_budget > userDepositBalance) {
      toast({
        title: "Error",
        description: "Insufficient deposit balance",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Deduct budget from user's deposit balance
      const newDepositBalance = userDepositBalance - taskData.total_budget;
      const balanceUpdated = await dbService.updateUserDepositBalance(
        userInfo.telegram_id,
        newDepositBalance
      );

      if (!balanceUpdated) {
        throw new Error('Failed to deduct budget');
      }

      // Create the task
      const success = await taskService.createTask({
        ...taskData,
        user_created: true,
        created_by_user: userInfo.telegram_id,
        status: 'active',
        is_active: true,
        current_completions: 0
      });

      if (success) {
        toast({
          title: "Success",
          description: "Task uploaded successfully!",
        });
        
        // Reset form
        setTaskData({
          title: '',
          description: '',
          task_type: 'social',
          task_url: '',
          reward_amount: minCPC,
          total_budget: minBudget,
          max_completions: 0
        });
        
        loadUserTasks();
        // Trigger parent to refresh user data
        window.location.reload();
      } else {
        throw new Error('Task creation failed');
      }
    } catch (error) {
      console.error('Error creating task:', error);
      toast({
        title: "Error",
        description: "Failed to upload task",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'paused': return 'bg-yellow-500';
      case 'completed': return 'bg-blue-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="text-white hover:text-gray-300"
          >
            ← Back
          </Button>
          <h1 className="text-2xl font-bold text-white">Upload Task</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Task Upload Form */}
          <div className="lg:col-span-2">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Plus className="w-5 h-5 mr-2" />
                  Create New Task
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Balance Info */}
                <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-3 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-blue-300">Deposit Balance:</span>
                    <span className="text-blue-300 font-bold">${userDepositBalance.toFixed(3)} USDT</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label className="text-white">Task Title *</Label>
                    <Input
                      value={taskData.title}
                      onChange={(e) => setTaskData({ ...taskData, title: e.target.value })}
                      className="bg-gray-700 border-gray-600 text-white"
                      placeholder="e.g., Follow our Instagram page"
                    />
                  </div>

                  <div>
                    <Label className="text-white">Task Type</Label>
                    <Select value={taskData.task_type} onValueChange={(value) => setTaskData({ ...taskData, task_type: value })}>
                      <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="social">Social Media</SelectItem>
                        <SelectItem value="follow">Follow/Subscribe</SelectItem>
                        <SelectItem value="like">Like/React</SelectItem>
                        <SelectItem value="share">Share/Retweet</SelectItem>
                        <SelectItem value="comment">Comment</SelectItem>
                        <SelectItem value="survey">Survey/Form</SelectItem>
                        <SelectItem value="download">App Download</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-white">Task URL *</Label>
                    <Input
                      value={taskData.task_url}
                      onChange={(e) => setTaskData({ ...taskData, task_url: e.target.value })}
                      className="bg-gray-700 border-gray-600 text-white"
                      placeholder="https://..."
                    />
                  </div>

                  <div>
                    <Label className="text-white">CPC (Cost Per Completion) *</Label>
                    <Input
                      type="number"
                      step="0.001"
                      min={minCPC}
                      value={taskData.reward_amount}
                      onChange={(e) => setTaskData({ ...taskData, reward_amount: parseFloat(e.target.value) || 0 })}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                    <p className="text-gray-400 text-xs mt-1">Minimum: ${minCPC}</p>
                  </div>

                  <div>
                    <Label className="text-white">Total Budget *</Label>
                    <Input
                      type="number"
                      step="0.1"
                      min={minBudget}
                      max={userDepositBalance}
                      value={taskData.total_budget}
                      onChange={(e) => setTaskData({ ...taskData, total_budget: parseFloat(e.target.value) || 0 })}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                    <p className="text-gray-400 text-xs mt-1">Minimum: ${minBudget}</p>
                  </div>

                  <div className="md:col-span-2">
                    <Label className="text-white">Description</Label>
                    <Textarea
                      value={taskData.description}
                      onChange={(e) => setTaskData({ ...taskData, description: e.target.value })}
                      className="bg-gray-700 border-gray-600 text-white"
                      placeholder="Detailed instructions for users..."
                      rows={3}
                    />
                  </div>
                </div>

                {/* Budget Calculator */}
                <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
                  <div className="flex items-center gap-2 mb-3">
                    <Calculator className="w-5 h-5 text-blue-400" />
                    <h3 className="text-white font-medium">Budget Calculator</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Max Completions:</span>
                      <span className="text-white font-bold ml-2">{taskData.max_completions}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Total Cost:</span>
                      <span className="text-white font-bold ml-2">${taskData.total_budget.toFixed(3)}</span>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleSubmit}
                  disabled={loading || taskData.total_budget > userDepositBalance}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  {loading ? "Uploading..." : "Upload Task"}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Requirements */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white text-lg">Requirements</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-yellow-400" />
                  <span className="text-gray-300">Min CPC: ${minCPC}</span>
                </div>
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-yellow-400" />
                  <span className="text-gray-300">Min Budget: ${minBudget}</span>
                </div>
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-blue-400" />
                  <span className="text-gray-300">Uses deposit balance</span>
                </div>
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-green-400" />
                  <span className="text-gray-300">Auto-stops when budget ends</span>
                </div>
              </CardContent>
            </Card>

            {/* Balance Info */}
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-4">
                <div className="text-center">
                  <DollarSign className="w-8 h-8 text-green-500 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">Available Budget</p>
                  <p className="text-2xl font-bold text-white">${userDepositBalance.toFixed(3)}</p>
                  <p className="text-gray-400 text-xs">Deposit Balance</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* User's Tasks */}
        <Card className="bg-gray-800 border-gray-700 mt-6">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Target className="w-5 h-5 mr-2" />
              My Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingTasks ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                <p className="text-gray-400">Loading your tasks...</p>
              </div>
            ) : userTasks.length === 0 ? (
              <div className="text-center py-8">
                <Target className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">No tasks uploaded yet</p>
                <p className="text-gray-500 text-sm">Upload your first task to get started</p>
              </div>
            ) : (
              <div className="space-y-3">
                {userTasks.map((task) => (
                  <div key={task.id} className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-white font-medium">{task.title}</h3>
                      <Badge className={getStatusColor(task.status)}>
                        {task.status}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-400">CPC:</span>
                        <span className="text-white ml-1">${task.reward_amount}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Budget:</span>
                        <span className="text-white ml-1">${task.total_budget}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Completed:</span>
                        <span className="text-white ml-1">{task.current_completions || 0}/{task.max_completions}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Remaining:</span>
                        <span className="text-white ml-1">${((task.total_budget || 0) - ((task.current_completions || 0) * task.reward_amount)).toFixed(3)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EnhancedTaskUpload;