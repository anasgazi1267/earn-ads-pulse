import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type TaskRow = Database['public']['Tables']['tasks']['Row'];
type UserTaskRow = Database['public']['Tables']['user_tasks']['Row'];

export interface Task {
  id: string;
  title: string;
  description?: string;
  task_type: 'telegram_join' | 'telegram_channel' | 'youtube_subscribe' | 'website_visit' | 'social_follow';
  task_url: string;
  reward_amount: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserTask {
  id: string;
  user_id: string;
  task_id: string;
  completed_at: string;
  reward_earned: number;
}

export interface TaskWithCompletion extends Task {
  completed: boolean;
  completion_date?: string;
}

export class TaskService {
  // Get all active tasks for users
  async getActiveTasks(): Promise<Task[]> {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      return (data || []).map(task => ({
        ...task,
        task_type: task.task_type as Task['task_type'],
        description: task.description || undefined
      }));
    } catch (error) {
      console.error('Error fetching tasks:', error);
      return [];
    }
  }

  // Get tasks with completion status for a user
  async getTasksForUser(userId: string): Promise<TaskWithCompletion[]> {
    try {
      const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (tasksError) throw tasksError;

      const { data: completedTasks, error: completedError } = await supabase
        .from('user_tasks')
        .select('task_id, completed_at')
        .eq('user_id', userId);

      if (completedError) throw completedError;

      const completedTaskIds = new Set(completedTasks?.map(ct => ct.task_id) || []);

      return (tasks || []).map(task => ({
        ...task,
        task_type: task.task_type as Task['task_type'],
        description: task.description || undefined,
        completed: completedTaskIds.has(task.id),
        completion_date: completedTasks?.find(ct => ct.task_id === task.id)?.completed_at
      }));
    } catch (error) {
      console.error('Error fetching user tasks:', error);
      return [];
    }
  }

  // Complete a task
  async completeTask(userId: string, taskId: string): Promise<boolean> {
    try {
      // Check if task already completed
      const { data: existing } = await supabase
        .from('user_tasks')
        .select('id')
        .eq('user_id', userId)
        .eq('task_id', taskId)
        .single();

      if (existing) {
        console.log('Task already completed');
        return false;
      }

      // Get task details
      const { data: task, error: taskError } = await supabase
        .from('tasks')
        .select('reward_amount')
        .eq('id', taskId)
        .eq('is_active', true)
        .single();

      if (taskError || !task) {
        console.error('Task not found or inactive');
        return false;
      }

      // Mark task as completed
      const { error: insertError } = await supabase
        .from('user_tasks')
        .insert({
          user_id: userId,
          task_id: taskId,
          reward_earned: task.reward_amount
        });

      if (insertError) throw insertError;

      // Update user balance
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('balance')
        .eq('telegram_id', userId)
        .single();

      if (userError || !user) {
        console.error('User not found');
        return false;
      }

      const { error: balanceError } = await supabase
        .from('users')
        .update({ 
          balance: user.balance + task.reward_amount,
          updated_at: new Date().toISOString()
        })
        .eq('telegram_id', userId);

      if (balanceError) throw balanceError;

      console.log(`Task completed: +$${task.reward_amount}`);
      return true;
    } catch (error) {
      console.error('Error completing task:', error);
      return false;
    }
  }

  // Admin: Create new task - Fixed version
  async createTask(task: Omit<Task, 'id' | 'created_at' | 'updated_at'>): Promise<boolean> {
    try {
      console.log('Creating task with data:', task);
      
      // Validate required fields
      if (!task.title?.trim()) {
        console.error('Task title is required');
        return false;
      }
      
      if (!task.task_url?.trim()) {
        console.error('Task URL is required');
        return false;
      }

      if (!task.task_type) {
        console.error('Task type is required');
        return false;
      }

      if (typeof task.reward_amount !== 'number' || task.reward_amount <= 0) {
        console.error('Invalid reward amount');
        return false;
      }

      const { data, error } = await supabase
        .from('tasks')
        .insert({
          title: task.title.trim(),
          description: task.description?.trim() || null,
          task_type: task.task_type,
          task_url: task.task_url.trim(),
          reward_amount: task.reward_amount,
          is_active: task.is_active
        })
        .select()
        .single();

      if (error) {
        console.error('Supabase insert error:', error);
        throw error;
      }

      console.log('Task created successfully:', data);
      return true;
    } catch (error) {
      console.error('Error creating task:', error);
      return false;
    }
  }

  // Admin: Update task
  async updateTask(taskId: string, updates: Partial<Task>): Promise<boolean> {
    try {
      const updateData: any = {};
      
      if (updates.title !== undefined) updateData.title = updates.title;
      if (updates.description !== undefined) updateData.description = updates.description || null;
      if (updates.task_type !== undefined) updateData.task_type = updates.task_type;
      if (updates.task_url !== undefined) updateData.task_url = updates.task_url;
      if (updates.reward_amount !== undefined) updateData.reward_amount = updates.reward_amount;
      if (updates.is_active !== undefined) updateData.is_active = updates.is_active;

      const { error } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', taskId);

      if (error) throw error;
      console.log('Task updated successfully');
      return true;
    } catch (error) {
      console.error('Error updating task:', error);
      return false;
    }
  }

  // Admin: Get all tasks
  async getAllTasks(): Promise<Task[]> {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(task => ({
        ...task,
        task_type: task.task_type as Task['task_type'],
        description: task.description || undefined
      }));
    } catch (error) {
      console.error('Error fetching all tasks:', error);
      return [];
    }
  }

  // Get user's completed tasks with earnings
  async getUserCompletedTasks(userId: string): Promise<Array<UserTask & { task_title: string }>> {
    try {
      const { data, error } = await supabase
        .from('user_tasks')
        .select(`
          *,
          tasks(title)
        `)
        .eq('user_id', userId)
        .order('completed_at', { ascending: false });

      if (error) throw error;
      
      return (data || []).map(item => ({
        id: item.id,
        user_id: item.user_id,
        task_id: item.task_id,
        completed_at: item.completed_at,
        reward_earned: item.reward_earned,
        task_title: (item.tasks as any)?.title || 'Unknown Task'
      }));
    } catch (error) {
      console.error('Error fetching user completed tasks:', error);
      return [];
    }
  }
}

export const taskService = new TaskService();
