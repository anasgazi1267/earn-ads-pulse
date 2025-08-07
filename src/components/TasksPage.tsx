import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Coins, ExternalLink, CheckCircle, Clock, Trophy, Gift } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { taskService, Task } from '@/services/taskService';

interface TasksPageProps {
  userInfo: any;
  userBalance: number;
  updateUserBalance: (newBalance: number) => void;
  setCurrentPage?: (page: string) => void;
}

const TasksPage: React.FC<TasksPageProps> = ({ userInfo, userBalance, updateUserBalance, setCurrentPage }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [completingTask, setCompletingTask] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadTasks();
  }, [userInfo]);

  const loadTasks = async () => {
    if (!userInfo) return;
    
    try {
      setLoading(true);
      const [availableTasks, userCompletedTasks] = await Promise.all([
        taskService.getActiveTasks(),
        taskService.getUserCompletedTasks(userInfo.id.toString())
      ]);

      // Create set of completed task IDs for quick lookup
      const completedTaskIds = new Set(userCompletedTasks.map((task: any) => task.task_id));
      setCompletedTasks(completedTaskIds);

      // Filter out tasks that are completed by user or reached max completions
      const filteredTasks = availableTasks.filter(task => {
        const isCompletedByUser = completedTaskIds.has(task.id);
        const hasReachedLimit = task.max_completions && task.current_completions >= task.max_completions;
        return !isCompletedByUser && !hasReachedLimit;
      });

      setTasks(filteredTasks);
    } catch (error) {
      console.error('Error loading tasks:', error);
      toast({
        title: "Error",
        description: "Failed to load tasks",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTaskComplete = async (task: Task) => {
    if (!userInfo || completingTask) return;

    setCompletingTask(task.id);
    
    try {
      // Open task URL
      window.open(task.task_url, '_blank');
      
      // Wait a bit for user to complete the task
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Complete the task
      const success = await taskService.completeTask(
        userInfo.id.toString(),
        task.id
      );

      if (success) {
        // Update balance
        const newBalance = userBalance + task.reward_amount;
        updateUserBalance(newBalance);
        
        // Remove task from list
        setTasks(prev => prev.filter(t => t.id !== task.id));
        setCompletedTasks(prev => new Set([...prev, task.id]));
        
        toast({
          title: "Task Completed! 🎉",
          description: `You earned $${task.reward_amount.toFixed(3)} USDT`,
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to complete task. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error completing task:', error);
      toast({
        title: "Error",
        description: "Failed to complete task",
        variant: "destructive"
      });
    } finally {
      setCompletingTask(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-500 mx-auto mb-4"></div>
            <p className="text-white">Loading tasks...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-4">
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-8">
        <div className="text-center py-6">
          <div className="flex items-center justify-center mb-4">
            <Trophy className="w-8 h-8 text-yellow-400 mr-3" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500 bg-clip-text text-transparent">
              Complete Tasks & Earn
            </h1>
          </div>
          
          {/* Add Your Task Button */}
          <div className="mb-6">
            <Button
              onClick={() => {
                if (setCurrentPage) {
                  setCurrentPage('task-upload');
                } else {
                  // Fallback if setCurrentPage is not available
                  console.log('Navigate to task upload page');
                }
              }}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-300"
            >
              <Trophy className="w-5 h-5 mr-2" />
              Add Your Task
            </Button>
            <p className="text-gray-400 text-sm mt-2">
              Upload your own tasks and earn when others complete them
            </p>
          </div>
          <p className="text-gray-300 text-lg">
            Complete simple tasks to earn USDT instantly
          </p>
          
          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 mt-6 max-w-md mx-auto">
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-600/30">
              <div className="flex items-center justify-center mb-2">
                <Coins className="w-5 h-5 text-yellow-400 mr-2" />
                <span className="text-sm text-gray-400">Your Balance</span>
              </div>
              <p className="text-xl font-bold text-white">${userBalance.toFixed(3)}</p>
            </div>
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-600/30">
              <div className="flex items-center justify-center mb-2">
                <Gift className="w-5 h-5 text-green-400 mr-2" />
                <span className="text-sm text-gray-400">Available Tasks</span>
              </div>
              <p className="text-xl font-bold text-white">{tasks.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tasks Grid */}
      <div className="max-w-4xl mx-auto">
        {tasks.length === 0 ? (
          <Card className="bg-gray-800/50 backdrop-blur-xl border-gray-700/50 text-center p-8">
            <CardContent className="pt-6">
              <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No Tasks Available</h3>
              <p className="text-gray-400">
                All tasks completed! Check back later for new earning opportunities.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {tasks.map((task) => (
              <Card key={task.id} className="bg-gray-800/50 backdrop-blur-xl border-gray-700/50 hover:border-blue-500/50 transition-all duration-300 group">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between mb-2">
                    <Badge variant="secondary" className="bg-blue-600/20 text-blue-400 border-blue-500/30">
                      {task.task_type.toUpperCase()}
                    </Badge>
                    <div className="flex items-center text-green-400 font-bold">
                      <Coins className="w-4 h-4 mr-1" />
                      ${task.reward_amount.toFixed(3)}
                    </div>
                  </div>
                  <CardTitle className="text-white text-lg leading-tight">
                    {task.title}
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <p className="text-gray-300 text-sm mb-4 line-clamp-2">
                    {task.description || 'Complete this task to earn rewards'}
                  </p>
                  
                  {/* Progress indicator */}
                  {task.max_completions && (
                    <div className="mb-4">
                      <div className="flex justify-between text-sm text-gray-400 mb-1">
                        <span>Progress</span>
                        <span>{task.current_completions}/{task.max_completions}</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                          style={{ 
                            width: `${Math.min(((task.current_completions || 0) / task.max_completions) * 100, 100)}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                  )}
                  
                  <Button
                    onClick={() => handleTaskComplete(task)}
                    disabled={completingTask === task.id}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-300 group-hover:scale-105"
                  >
                    {completingTask === task.id ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Completing...
                      </>
                    ) : (
                      <>
                        Complete Task
                        <ExternalLink className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Info Banner */}
      <div className="max-w-4xl mx-auto mt-8">
        <div className="bg-gradient-to-r from-indigo-900/30 to-purple-900/30 backdrop-blur-sm rounded-xl p-6 border border-indigo-500/30">
          <div className="flex items-start space-x-4">
            <div className="w-8 h-8 bg-indigo-500/20 rounded-full flex items-center justify-center mt-1">
              <CheckCircle className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-white font-semibold mb-2">How it works</h3>
              <ul className="text-gray-300 text-sm space-y-1">
                <li>• Click "Complete Task" to open the task link</li>
                <li>• Follow the instructions (like, subscribe, etc.)</li>
                <li>• Return here and your reward will be credited automatically</li>
                <li>• Each task can only be completed once per user</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TasksPage;
