import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Upload, DollarSign, Trophy, CheckCircle, Clock, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { taskService } from '@/services/taskService';
import { dbService } from '@/services/database';

interface UserTask {
  id: string;
  title: string;
  description?: string;
  task_type: string;
  task_url: string;
  reward_amount: number;
  max_completions?: number;
  total_budget: number;
  current_completions: number;
  status: string;
  created_at: string;
}

interface UserTaskUploadPageProps {
  userInfo: any;
  onBack: () => void;
}

const UserTaskUploadPage: React.FC<UserTaskUploadPageProps> = ({ userInfo, onBack }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [taskType, setTaskType] = useState('');
  const [taskUrl, setTaskUrl] = useState('');
  const [rewardAmount, setRewardAmount] = useState('');
  const [maxCompletions, setMaxCompletions] = useState('');
  const [totalBudget, setTotalBudget] = useState('');
  const [loading, setLoading] = useState(false);
  const [userTasks, setUserTasks] = useState<UserTask[]>([]);
  const [activeTab, setActiveTab] = useState<'upload' | 'manage'>('upload');
  const [adminFee, setAdminFee] = useState(0.1);
  const { toast } = useToast();

  useEffect(() => {
    loadAdminFee();
    if (activeTab === 'manage') {
      loadUserTasks();
    }
  }, [activeTab]);

  const loadAdminFee = async () => {
    try {
      const fee = await dbService.getAdminSetting('task_admin_fee');
      setAdminFee(parseFloat(fee) || 0.1);
    } catch (error) {
      console.error('Error loading admin fee:', error);
    }
  };

  const loadUserTasks = async () => {
    try {
      const tasks = await taskService.getUserCreatedTasks(userInfo.telegram_id);
      const userTasksData = tasks.map(task => ({
        ...task,
        description: task.description || '',
        total_budget: task.total_budget || 0,
        status: task.status || 'pending'
      }));
      setUserTasks(userTasksData);
    } catch (error) {
      console.error('Error loading user tasks:', error);
    }
  };

  const calculateTotalCost = () => {
    const reward = parseFloat(rewardAmount) || 0;
    const completions = parseInt(maxCompletions) || 1;
    const taskCost = reward * completions;
    const adminFeeAmount = taskCost * adminFee;
    return taskCost + adminFeeAmount;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !description || !taskType || !taskUrl || !rewardAmount || !maxCompletions) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    const reward = parseFloat(rewardAmount);
    const completions = parseInt(maxCompletions);
    const budget = parseFloat(totalBudget) || calculateTotalCost();

    if (reward < 0.002) {
      toast({
        title: "Invalid CPC",
        description: "Minimum CPC is $0.002",
        variant: "destructive"
      });
      return;
    }

    if (reward <= 0 || completions <= 0) {
      toast({
        title: "Invalid values",
        description: "Reward amount and max completions must be greater than 0",
        variant: "destructive"
      });
      return;
    }

    if (budget < calculateTotalCost()) {
      toast({
        title: "Insufficient budget",
        description: `Total cost is $${calculateTotalCost().toFixed(3)} (including ${(adminFee * 100)}% admin fee)`,
        variant: "destructive"
      });
      return;
    }

    // Check if user has enough deposit balance
    if ((userInfo.deposit_balance || 0) < budget) {
      toast({
        title: "Insufficient deposit balance",
        description: `You need $${budget.toFixed(3)} in deposit balance. Current: $${(userInfo.deposit_balance || 0).toFixed(3)}`,
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const taskData = {
        title,
        description,
        task_type: taskType,
        task_url: taskUrl,
        reward_amount: reward,
        max_completions: completions,
        total_budget: budget,
        current_completions: 0,
        user_created: true,
        created_by_user: userInfo.telegram_id,
        admin_fee: budget * adminFee,
        status: 'pending',
        is_active: false
      };

      const success = await taskService.createTask(taskData);

      if (success) {
        // Deduct budget from user's deposit balance
        await dbService.updateUserDepositBalance(userInfo.telegram_id, -budget);
        
        toast({
          title: "Task submitted!",
          description: "Your task is under review and will be activated once approved",
        });
        
        // Reset form
        setTitle('');
        setDescription('');
        setTaskType('');
        setTaskUrl('');
        setRewardAmount('');
        setMaxCompletions('');
        setTotalBudget('');
        setActiveTab('manage');
      } else {
        throw new Error('Failed to create task');
      }
    } catch (error) {
      console.error('Error creating task:', error);
      toast({
        title: "Error",
        description: "Failed to submit task",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="text-white hover:bg-white/10 mr-4"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold text-white">Task Management</h1>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-4 mb-6">
          <Button
            variant={activeTab === 'upload' ? 'default' : 'outline'}
            onClick={() => setActiveTab('upload')}
            className={activeTab === 'upload' 
              ? 'bg-blue-600 text-white' 
              : 'border-gray-600 text-gray-300 hover:bg-gray-700'
            }
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload Task
          </Button>
          <Button
            variant={activeTab === 'manage' ? 'default' : 'outline'}
            onClick={() => setActiveTab('manage')}
            className={activeTab === 'manage' 
              ? 'bg-blue-600 text-white' 
              : 'border-gray-600 text-gray-300 hover:bg-gray-700'
            }
          >
            <Trophy className="w-4 h-4 mr-2" />
            My Tasks
          </Button>
        </div>

        {/* Bot Admin Warning for Telegram Campaigns */}
        <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-800 mb-6">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <div className="text-orange-500 mt-1">⚠️</div>
              <div className="space-y-2">
                <h3 className="font-semibold text-orange-800 dark:text-orange-200">
                  🔔 Telegram Campaign Setup Required
                </h3>
                <p className="text-sm text-orange-700 dark:text-orange-300">
                  To activate automatic join verification and reward users with coins, please add our bot <strong>@Ads_Usdt_earn_bot</strong> as an admin in your Telegram channel.
                </p>
                <div className="text-xs text-orange-600 dark:text-orange-400 space-y-1">
                  <p><strong>Why is this required?</strong></p>
                  <p>✅ Our system uses Telegram's API to confirm whether users have successfully joined your channel.</p>
                  <p>🚫 Without admin access, the bot cannot verify membership status.</p>
                </div>
                <div className="text-xs text-orange-600 dark:text-orange-400 space-y-1">
                  <p><strong>How to add @Ads_Usdt_earn_bot:</strong></p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Open your Telegram channel settings</li>
                    <li>Go to "Administrators"</li>
                    <li>Tap "Add Admin" and search for @Ads_Usdt_earn_bot</li>
                    <li>Grant basic permissions (no message access needed)</li>
                    <li>Save changes</li>
                  </ol>
                  <p className="mt-2">Once added, your campaign will be verified automatically and users will start earning coins for joining your channel! 🚀</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {activeTab === 'upload' ? (
          /* Upload Task Form */
          <Card className="bg-gray-800/50 backdrop-blur-xl border-gray-700/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Upload className="w-5 h-5 mr-2" />
                Create New Task
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="title" className="text-gray-300">
                      Task Title *
                    </Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Enter task title"
                      className="bg-gray-700/50 border-gray-600 text-white"
                    />
                  </div>

                  <div>
                    <Label htmlFor="taskType" className="text-gray-300">
                      Task Type *
                    </Label>
                    <Select value={taskType} onValueChange={setTaskType}>
                      <SelectTrigger className="bg-gray-700/50 border-gray-600 text-white">
                        <SelectValue placeholder="Select task type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="social">Social Media</SelectItem>
                        <SelectItem value="survey">Survey</SelectItem>
                        <SelectItem value="review">Review</SelectItem>
                        <SelectItem value="signup">Sign Up</SelectItem>
                        <SelectItem value="download">App Download</SelectItem>
                        <SelectItem value="visit">Website Visit</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="description" className="text-gray-300">
                    Task Description *
                  </Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe what users need to do..."
                    className="bg-gray-700/50 border-gray-600 text-white"
                    rows={4}
                  />
                </div>

                <div>
                  <Label htmlFor="taskUrl" className="text-gray-300">
                    Task URL *
                  </Label>
                  <Input
                    id="taskUrl"
                    value={taskUrl}
                    onChange={(e) => setTaskUrl(e.target.value)}
                    placeholder="https://example.com"
                    className="bg-gray-700/50 border-gray-600 text-white"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="rewardAmount" className="text-gray-300">
                      Reward per Completion ($) *
                    </Label>
                    <Input
                      id="rewardAmount"
                      type="number"
                      step="0.001"
                      min="0.002"
                      value={rewardAmount}
                      onChange={(e) => setRewardAmount(e.target.value)}
                      placeholder="0.002 (minimum)"
                      className="bg-gray-700/50 border-gray-600 text-white"
                    />
                    <p className="text-xs text-yellow-400 mt-1">
                      Minimum CPC: $0.002
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="maxCompletions" className="text-gray-300">
                      Max Completions *
                    </Label>
                    <Input
                      id="maxCompletions"
                      type="number"
                      value={maxCompletions}
                      onChange={(e) => setMaxCompletions(e.target.value)}
                      placeholder="100"
                      className="bg-gray-700/50 border-gray-600 text-white"
                    />
                  </div>

                  <div>
                    <Label className="text-gray-300">
                      Total Cost (including {(adminFee * 100)}% fee)
                    </Label>
                    <div className="bg-gray-700/50 border border-gray-600 rounded-md px-3 py-2">
                      <span className="text-white font-semibold">
                        ${calculateTotalCost().toFixed(3)}
                      </span>
                    </div>
                    {rewardAmount && maxCompletions && (
                      <p className="text-xs text-blue-400 mt-1">
                        {parseInt(maxCompletions) || 0} users can complete this task
                      </p>
                    )}
                  </div>
                </div>

                <div className="bg-blue-900/20 border border-blue-600/30 rounded-lg p-4">
                  <h3 className="text-blue-400 font-semibold mb-2">Cost Breakdown:</h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between text-gray-300">
                      <span>Task Rewards:</span>
                      <span>${((parseFloat(rewardAmount) || 0) * (parseInt(maxCompletions) || 1)).toFixed(3)}</span>
                    </div>
                    <div className="flex justify-between text-gray-300">
                      <span>Admin Fee ({(adminFee * 100)}%):</span>
                      <span>${(calculateTotalCost() - ((parseFloat(rewardAmount) || 0) * (parseInt(maxCompletions) || 1))).toFixed(3)}</span>
                    </div>
                    <div className="flex justify-between text-white font-semibold border-t border-gray-600 pt-1">
                      <span>Total:</span>
                      <span>${calculateTotalCost().toFixed(3)}</span>
                    </div>
                  </div>
                  <p className="text-gray-400 text-xs mt-2">
                    Your current deposit balance: ${(userInfo.deposit_balance || 0).toFixed(3)}
                  </p>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                >
                  {loading ? "Submitting..." : "Submit Task for Review"}
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : (
          /* Manage Tasks */
          <div className="space-y-6">
            {userTasks.length === 0 ? (
              <Card className="bg-gray-800/50 backdrop-blur-xl border-gray-700/50 text-center p-8">
                <CardContent className="pt-6">
                  <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">No Tasks Yet</h3>
                  <p className="text-gray-400">
                    You haven't created any tasks yet. Click "Upload Task" to create your first task.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6">
                {userTasks.map((task: UserTask) => (
                  <Card key={task.id} className="bg-gray-800/50 backdrop-blur-xl border-gray-700/50">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-white text-lg">{task.title}</CardTitle>
                          <p className="text-gray-400 text-sm mt-1">{task.description}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          {task.status === 'pending' && (
                            <div className="flex items-center text-yellow-400">
                              <Clock className="w-4 h-4 mr-1" />
                              <span className="text-sm">Pending</span>
                            </div>
                          )}
                          {task.status === 'active' && (
                            <div className="flex items-center text-green-400">
                              <CheckCircle className="w-4 h-4 mr-1" />
                              <span className="text-sm">Active</span>
                            </div>
                          )}
                          <div className="text-right">
                            <p className="text-green-400 font-semibold">${task.reward_amount.toFixed(3)}</p>
                            <p className="text-gray-400 text-xs">per completion</p>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-400">Completions</p>
                          <p className="text-white font-semibold">
                            {task.current_completions}/{task.max_completions}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-400">Total Budget</p>
                          <p className="text-white font-semibold">${task.total_budget.toFixed(3)}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Task Type</p>
                          <p className="text-white font-semibold">{task.task_type}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Created</p>
                          <p className="text-white font-semibold">
                            {new Date(task.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      
                      {task.max_completions && (
                        <div className="mt-4">
                          <div className="flex justify-between text-sm text-gray-400 mb-1">
                            <span>Progress</span>
                            <span>{Math.round((task.current_completions / task.max_completions) * 100)}%</span>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-300"
                              style={{ 
                                width: `${Math.min((task.current_completions / task.max_completions) * 100, 100)}%` 
                              }}
                            ></div>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between mt-4">
                        <a
                          href={task.task_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 text-sm flex items-center"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View Task
                        </a>
                        
                        {task.status === 'active' && (
                          <div className="text-green-400 text-sm">
                            Earning: ${(task.current_completions * task.reward_amount).toFixed(3)}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserTaskUploadPage;