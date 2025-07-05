import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  Clock, 
  ExternalLink, 
  Trophy, 
  Youtube, 
  MessageCircle, 
  Globe, 
  Users,
  DollarSign,
  RefreshCw,
  Timer,
  Plus
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { taskService, TaskWithCompletion } from '../services/taskService';

interface TasksPageProps {
  userInfo: any;
  userBalance: number;
  updateUserBalance: (newBalance: number) => void;
}

const TasksPage: React.FC<TasksPageProps> = ({ userInfo, userBalance, updateUserBalance }) => {
  const [tasks, setTasks] = useState<TaskWithCompletion[]>([]);
  const [loading, setLoading] = useState(true);
  const [completingTask, setCompletingTask] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [taskTimers, setTaskTimers] = useState<Record<string, number>>({});
  const [showContactPage, setShowContactPage] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadTasks();
  }, [userInfo]);

  // Timer countdown effect
  useEffect(() => {
    const interval = setInterval(() => {
      setTaskTimers(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(taskId => {
          if (updated[taskId] > 0) {
            updated[taskId] -= 1;
          }
        });
        return updated;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const loadTasks = async () => {
    if (userInfo?.id) {
      setLoading(true);
      try {
        const userTasks = await taskService.getTasksForUser(userInfo.id.toString());
        setTasks(userTasks);
      } catch (error) {
        console.error('Error loading tasks:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const refreshTasks = async () => {
    setRefreshing(true);
    await loadTasks();
    setRefreshing(false);
    toast({
      title: "Refreshed!",
      description: "Task list has been updated",
    });
  };

  const startTaskTimer = (taskId: string) => {
    // Set timer between 30-60 seconds for better validation
    const waitTime = Math.floor(Math.random() * 31) + 30;
    setTaskTimers(prev => ({ ...prev, [taskId]: waitTime }));
    
    toast({
      title: "Task Started!",
      description: `Please complete the task first, then wait ${waitTime} seconds before claiming reward`,
    });
  };

  const handleCompleteTask = async (taskId: string) => {
    if (!userInfo?.id) return;

    // Check if timer is still running
    if (taskTimers[taskId] > 0) {
      toast({
        title: "Please Wait!",
        description: `Complete the task first, then wait ${taskTimers[taskId]} more seconds`,
        variant: "destructive"
      });
      return;
    }

    // Additional validation - ensure user has visited the task
    const taskStartTime = localStorage.getItem(`task_start_${taskId}`);
    if (!taskStartTime) {
      toast({
        title: "Task Not Started!",
        description: "Please visit the task link first before claiming reward",
        variant: "destructive"
      });
      return;
    }

    // Check if enough time has passed since task start
    const timeElapsed = Date.now() - parseInt(taskStartTime);
    if (timeElapsed < 30000) { // Minimum 30 seconds
      toast({
        title: "Complete the Task!",
        description: "Please spend more time completing the task",
        variant: "destructive"
      });
      return;
    }

    setCompletingTask(taskId);
    try {
      const success = await taskService.completeTask(userInfo.id.toString(), taskId);
      
      if (success) {
        const task = tasks.find(t => t.id === taskId);
        const reward = task?.reward_amount || 0;
        
        toast({
          title: "🎉 Task Completed!",
          description: `Congratulations! You earned $${reward.toFixed(3)} USDT!`,
        });

        // Update local state
        updateUserBalance(userBalance + reward);
        setTasks(tasks.map(t => 
          t.id === taskId 
            ? { ...t, completed: true, completion_date: new Date().toISOString() }
            : t
        ));

        // Clear timer and localStorage
        setTaskTimers(prev => {
          const updated = { ...prev };
          delete updated[taskId];
          return updated;
        });
        localStorage.removeItem(`task_start_${taskId}`);
      } else {
        toast({
          title: "Error",
          description: "Task already completed or invalid",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error completing task:', error);
      toast({
        title: "Error",
        description: "Failed to complete task. Please try again.",
        variant: "destructive"
      });
    } finally {
      setCompletingTask(null);
    }
  };

  const getTaskIcon = (taskType: string) => {
    switch (taskType) {
      case 'telegram_join':
      case 'telegram_channel':
        return <MessageCircle className="w-6 h-6 text-blue-400" />;
      case 'youtube_subscribe':
        return <Youtube className="w-6 h-6 text-red-400" />;
      case 'website_visit':
        return <Globe className="w-6 h-6 text-green-400" />;
      case 'social_follow':
        return <Users className="w-6 h-6 text-purple-400" />;
      default:
        return <Trophy className="w-6 h-6 text-yellow-400" />;
    }
  };

  const getTaskTypeText = (taskType: string) => {
    switch (taskType) {
      case 'telegram_join':
        return 'Telegram Bot';
      case 'telegram_channel':
        return 'Telegram Channel';
      case 'youtube_subscribe':
        return 'YouTube Subscribe';
      case 'website_visit':
        return 'Website Visit';
      case 'social_follow':
        return 'Social Media';
      default:
        return 'Other';
    }
  };

  const completedTasks = tasks.filter(t => t.completed);
  const availableTasks = tasks.filter(t => !t.completed);
  const totalEarned = completedTasks.reduce((sum, task) => sum + task.reward_amount, 0);

  const ContactPage = () => (
    <div className="p-4 space-y-6">
      <div className="text-center py-4">
        <h1 className="text-2xl font-bold text-white mb-2">Add Your Task</h1>
        <p className="text-gray-400">Contact us to add your custom task</p>
      </div>

      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white text-center">Contact Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-4">
            <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 p-6 rounded-lg border border-blue-500/30">
              <h3 className="text-white text-lg font-bold mb-4">Get in touch with us</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-center space-x-3">
                  <MessageCircle className="w-6 h-6 text-blue-400" />
                  <div>
                    <p className="text-gray-300 text-sm">Telegram Username</p>
                    <p className="text-white font-bold">@Owner_USDTBot</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-center space-x-3">
                  <Globe className="w-6 h-6 text-green-400" />
                  <div>
                    <p className="text-gray-300 text-sm">Phone Number</p>
                    <p className="text-white font-bold">+8801305188972</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-700/50 p-4 rounded-lg">
              <h4 className="text-white font-medium mb-2">How to Add Your Task</h4>
              <div className="text-gray-300 text-sm space-y-1">
                <p>• Contact us via Telegram or phone</p>
                <p>• Provide task details and requirements</p>
                <p>• We'll add your task to the platform</p>
                <p>• Users will complete your task and earn rewards</p>
              </div>
            </div>

            <Button
              onClick={() => setShowContactPage(false)}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              Back to Tasks
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  if (showContactPage) {
    return <ContactPage />;
  }

  if (loading) {
    return (
      <div className="p-4 space-y-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="text-center py-4">
        <div className="flex items-center justify-center space-x-2 mb-2">
          <h1 className="text-2xl font-bold text-white">Task Center</h1>
          <Button
            onClick={refreshTasks}
            disabled={refreshing}
            variant="ghost"
            size="sm"
            className="text-blue-400 hover:text-blue-300"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        <p className="text-gray-400">
          Complete tasks to earn USDT
        </p>
        
        {/* Add Your Task Button */}
        <div className="mt-4">
          <Button
            onClick={() => setShowContactPage(true)}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Your Task
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-blue-500/30">
          <CardContent className="p-4 text-center">
            <Trophy className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
            <p className="text-white font-bold text-lg">{completedTasks.length}</p>
            <p className="text-gray-400 text-sm">Completed</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-600/20 to-blue-600/20 border-green-500/30">
          <CardContent className="p-4 text-center">
            <DollarSign className="w-8 h-8 text-green-400 mx-auto mb-2" />
            <p className="text-white font-bold text-lg">${totalEarned.toFixed(3)}</p>
            <p className="text-gray-400 text-sm">Earned</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border-purple-500/30">
          <CardContent className="p-4 text-center">
            <Clock className="w-8 h-8 text-purple-400 mx-auto mb-2" />
            <p className="text-white font-bold text-lg">{availableTasks.length}</p>
            <p className="text-gray-400 text-sm">Available</p>
          </CardContent>
        </Card>
      </div>

      {/* Available Tasks */}
      {availableTasks.length > 0 && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Available Tasks</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {availableTasks.map((task) => (
              <div
                key={task.id}
                className="group relative overflow-hidden bg-gradient-to-br from-card/50 to-card/30 backdrop-blur-sm rounded-xl border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative p-6">
                  <div className="flex items-start space-x-4">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/20">
                      {getTaskIcon(task.task_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-foreground font-semibold text-lg truncate">{task.title}</h3>
                        <Badge variant="secondary" className="bg-primary/15 text-primary border border-primary/20 shrink-0">
                          {getTaskTypeText(task.task_type)}
                        </Badge>
                      </div>
                      
                      {task.description && (
                        <p className="text-muted-foreground text-sm mb-3 line-clamp-2">{task.description}</p>
                      )}
                      
                      <div className="flex items-center space-x-4 mb-3">
                        <div className="flex items-center space-x-2">
                          <DollarSign className="w-4 h-4 text-green-400" />
                          <span className="text-green-400 font-bold text-lg">
                            +${task.reward_amount.toFixed(3)}
                          </span>
                          <span className="text-muted-foreground text-sm">USDT</span>
                        </div>
                        
                        {task.max_completions && (
                          <div className="flex items-center space-x-2">
                            <Users className="w-4 h-4 text-blue-400" />
                            <span className="text-blue-400 text-sm">
                              {task.current_completions}/{task.max_completions} completed
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {taskTimers[task.id] > 0 && (
                        <div className="flex items-center space-x-2 p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                          <Timer className="w-4 h-4 text-orange-400 animate-pulse" />
                          <span className="text-orange-400 text-sm font-medium">
                            Please wait {taskTimers[task.id]} seconds to claim reward
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-3 pt-4 border-t border-border/50">
                    <Button
                      onClick={() => {
                        // Store task start time
                        localStorage.setItem(`task_start_${task.id}`, Date.now().toString());
                        window.open(task.task_url, '_blank');
                        if (!taskTimers[task.id]) {
                          startTaskTimer(task.id);
                        }
                      }}
                      variant="outline"
                      size="sm"
                      className="border-primary/50 text-primary hover:bg-primary/10 hover:border-primary transition-all duration-300"
                    >
                      <ExternalLink className="w-4 h-4 mr-1" />
                      Start Task
                    </Button>
                    <Button
                      onClick={() => handleCompleteTask(task.id)}
                      disabled={completingTask === task.id || taskTimers[task.id] > 0}
                      className={`flex-1 sm:flex-none font-semibold transition-all duration-300 ${
                        taskTimers[task.id] > 0 
                          ? 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600' 
                          : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 shadow-lg hover:shadow-green-500/25'
                      }`}
                      size="sm"
                    >
                      {completingTask === task.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      ) : taskTimers[task.id] > 0 ? (
                        <>
                          <Timer className="w-4 h-4 mr-2" />
                          Claim in {taskTimers[task.id]}s
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Claim Reward
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Completed Tasks */}
      {completedTasks.length > 0 && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Completed Tasks ({completedTasks.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {completedTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between p-3 bg-green-600/10 rounded-lg border border-green-600/30"
              >
                <div className="flex items-center space-x-3">
                  {getTaskIcon(task.task_type)}
                  <div>
                    <h4 className="text-white font-medium">{task.title}</h4>
                    <p className="text-gray-400 text-sm">
                      {task.completion_date && new Date(task.completion_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-green-400 font-bold">
                    +${task.reward_amount.toFixed(3)}
                  </span>
                  <CheckCircle className="w-5 h-5 text-green-400" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {tasks.length === 0 && (
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-8 text-center">
            <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-white text-lg font-medium mb-2">No Tasks Found</h3>
            <p className="text-gray-400">
              Admin will add new tasks soon
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TasksPage;
