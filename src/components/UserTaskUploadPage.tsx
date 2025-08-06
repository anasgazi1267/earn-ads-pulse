import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Upload, Wallet, DollarSign, RefreshCw, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { dbService } from '@/services/database';
import { taskService } from '@/services/taskService';

interface UserTaskUploadPageProps {
  userInfo: any;
  onBack: () => void;
}

const UserTaskUploadPage = ({ userInfo, onBack }: UserTaskUploadPageProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [taskType, setTaskType] = useState('');
  const [taskUrl, setTaskUrl] = useState('');
  const [rewardAmount, setRewardAmount] = useState('');
  const [maxCompletions, setMaxCompletions] = useState('');
  const [loading, setLoading] = useState(false);
  const [adminSettings, setAdminSettings] = useState<Record<string, string>>({});
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const settings = await dbService.getAdminSettings();
      setAdminSettings(settings);
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const adminFee = parseFloat(adminSettings.user_task_admin_fee || '0.01');
  
  const calculateTotalCost = () => {
    const reward = parseFloat(rewardAmount) || 0;
    const completions = parseInt(maxCompletions) || 1;
    const taskCost = reward * completions;
    const totalAdminFee = adminFee * completions;
    return taskCost + totalAdminFee;
  };

  const handleSubmit = async () => {
    if (!title || !taskType || !taskUrl || !rewardAmount || !maxCompletions) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    const reward = parseFloat(rewardAmount);
    const completions = parseInt(maxCompletions);
    const totalCost = calculateTotalCost();

    if (reward <= 0 || completions <= 0) {
      toast({
        title: "Error",
        description: "Reward amount and max completions must be greater than 0",
        variant: "destructive"
      });
      return;
    }

    if (totalCost > (userInfo.deposit_balance || 0)) {
      toast({
        title: "Error",
        description: "Insufficient deposit balance. Please deposit more funds.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Create the task
      const taskData = {
        title,
        description: description || null,
        task_type: taskType,
        task_url: taskUrl,
        reward_amount: reward,
        max_completions: completions,
        total_budget: totalCost,
        is_active: true,
        current_completions: 0,
        user_created: true,
        created_by_user: userInfo.telegram_id,
        admin_fee: adminFee,
        status: 'active'
      };

      const success = await taskService.createTask(taskData);
      
      if (success) {
        // Deduct from user's deposit balance
        const newDepositBalance = (userInfo.deposit_balance || 0) - totalCost;
        await dbService.updateUserDepositBalance(userInfo.telegram_id, newDepositBalance);
        
        toast({
          title: "Success",
          description: `Task uploaded successfully! Cost: $${totalCost.toFixed(3)} USDT`,
        });
        
        // Reset form
        setTitle('');
        setDescription('');
        setTaskType('');
        setTaskUrl('');
        setRewardAmount('');
        setMaxCompletions('');
        
        // Refresh page to update balance
        setTimeout(() => {
          window.location.reload();
        }, 1500);
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

  const totalCost = calculateTotalCost();
  const canAfford = totalCost <= (userInfo.deposit_balance || 0);

  return (
    <div className="min-h-screen bg-gray-900 p-4">
      <div className="max-w-md mx-auto">
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

        {/* Balance Info */}
        <Card className="bg-gray-800 border-gray-700 mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Wallet className="w-5 h-5 text-blue-500 mr-2" />
                <span className="text-gray-300">Deposit Balance:</span>
              </div>
              <span className="text-xl font-bold text-white">
                ${(userInfo.deposit_balance || 0).toFixed(3)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Task Upload Form */}
        <Card className="bg-gray-800 border-gray-700 mb-6">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Upload className="w-5 h-5 mr-2" />
              Create New Task
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-white">Task Title *</Label>
              <Input
                type="text"
                placeholder="Enter task title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>

            <div>
              <Label className="text-white">Description</Label>
              <Input
                type="text"
                placeholder="Task description (optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>

            <div>
              <Label className="text-white">Task Type *</Label>
              <Input
                type="text"
                placeholder="e.g., social, survey, follow, like"
                value={taskType}
                onChange={(e) => setTaskType(e.target.value)}
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>

            <div>
              <Label className="text-white">Task URL *</Label>
              <Input
                type="url"
                placeholder="https://example.com"
                value={taskUrl}
                onChange={(e) => setTaskUrl(e.target.value)}
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>

            <div>
              <Label className="text-white">Reward per Completion (USDT) *</Label>
              <Input
                type="number"
                step="0.001"
                placeholder="0.010"
                value={rewardAmount}
                onChange={(e) => setRewardAmount(e.target.value)}
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>

            <div>
              <Label className="text-white">Max Completions *</Label>
              <Input
                type="number"
                placeholder="100"
                value={maxCompletions}
                onChange={(e) => setMaxCompletions(e.target.value)}
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>

            {/* Cost Breakdown */}
            {rewardAmount && maxCompletions && (
              <div className="bg-gray-700/50 rounded-lg p-3 border border-gray-600">
                <h4 className="text-white font-medium mb-2">Cost Breakdown:</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between text-gray-300">
                    <span>Task Rewards:</span>
                    <span>${(parseFloat(rewardAmount) * parseInt(maxCompletions)).toFixed(3)}</span>
                  </div>
                  <div className="flex justify-between text-gray-300">
                    <span>Admin Fee ({parseInt(maxCompletions)} × ${adminFee}):</span>
                    <span>${(adminFee * parseInt(maxCompletions)).toFixed(3)}</span>
                  </div>
                  <div className="flex justify-between text-white font-medium border-t border-gray-600 pt-1">
                    <span>Total Cost:</span>
                    <span>${totalCost.toFixed(3)}</span>
                  </div>
                </div>
                
                {!canAfford && (
                  <div className="flex items-center gap-2 mt-2 text-red-400">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-sm">Insufficient balance</span>
                  </div>
                )}
              </div>
            )}

            <Button 
              onClick={handleSubmit}
              disabled={loading || !canAfford || !title || !taskType || !taskUrl || !rewardAmount || !maxCompletions}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Upload className="w-4 h-4 mr-2" />
              )}
              Upload Task (${totalCost.toFixed(3)} USDT)
            </Button>
          </CardContent>
        </Card>

        {/* Info */}
        <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
          <h3 className="text-white font-medium mb-2">How it works:</h3>
          <ul className="text-gray-400 text-sm space-y-1">
            <li>• Tasks are paid from your deposit balance</li>
            <li>• Admin earns ${adminFee} USDT per task completion</li>
            <li>• Your task will be visible to all users</li>
            <li>• Users earn rewards for completing your tasks</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default UserTaskUploadPage;