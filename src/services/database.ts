
import { supabase } from '@/integrations/supabase/client';

export interface User {
  id: string;
  telegram_id: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  balance: number;
  referral_count: number;
  channels_joined: boolean;
  channel_join_date?: string;
  ads_watched_today: number;
  spins_used_today: number;
  last_activity_date: string;
  referred_by?: string;
  created_at: string;
  updated_at: string;
}

export interface AdminSetting {
  id: string;
  setting_key: string;
  setting_value: string;
  created_at: string;
  updated_at: string;
}

export interface WithdrawalRequest {
  id: string;
  telegram_id: string;
  username: string;
  amount: number;
  withdrawal_method: string;
  wallet_address: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface UserActivity {
  id: string;
  telegram_id: string;
  activity_type: string;
  amount: number;
  activity_date: string;
  created_at: string;
}

export interface Referral {
  id: string;
  referrer_telegram_id: string;
  referred_telegram_id: string;
  earnings: number;
  created_at: string;
}

export class DatabaseService {
  // User operations
  async createOrUpdateUser(telegramUser: any, referredBy?: string): Promise<User | null> {
    try {
      const today = new Date().toDateString();
      const userData = {
        telegram_id: telegramUser.id.toString(),
        username: telegramUser.username || null,
        first_name: telegramUser.first_name || null,
        last_name: telegramUser.last_name || null,
        balance: 0.000,
        referral_count: 0,
        channels_joined: false,
        ads_watched_today: 0,
        spins_used_today: 0,
        last_activity_date: today,
        referred_by: referredBy || null
      };

      const { data, error } = await supabase
        .from('users')
        .upsert(userData, { 
          onConflict: 'telegram_id',
          ignoreDuplicates: false 
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating/updating user:', error);
      return null;
    }
  }

  async getUserByTelegramId(telegramId: string): Promise<User | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('telegram_id', telegramId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error) {
      console.error('Error getting user:', error);
      return null;
    }
  }

  async updateUserBalance(telegramId: string, newBalance: number): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('users')
        .update({ balance: newBalance, updated_at: new Date().toISOString() })
        .eq('telegram_id', telegramId);

      return !error;
    } catch (error) {
      console.error('Error updating balance:', error);
      return false;
    }
  }

  async updateChannelJoinStatus(telegramId: string, joined: boolean): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('users')
        .update({ 
          channels_joined: joined,
          channel_join_date: joined ? new Date().toISOString() : null,
          updated_at: new Date().toISOString()
        })
        .eq('telegram_id', telegramId);

      return !error;
    } catch (error) {
      console.error('Error updating channel status:', error);
      return false;
    }
  }

  async incrementUserAdsWatched(telegramId: string): Promise<boolean> {
    try {
      const { error } = await supabase.rpc('increment_ads_watched', {
        user_telegram_id: telegramId
      });

      return !error;
    } catch (error) {
      console.error('Error incrementing ads watched:', error);
      return false;
    }
  }

  // Admin settings operations
  async getAdminSettings(): Promise<Record<string, string>> {
    try {
      const { data, error } = await supabase
        .from('admin_settings')
        .select('setting_key, setting_value');

      if (error) throw error;

      const settings: Record<string, string> = {};
      data?.forEach(setting => {
        settings[setting.setting_key] = setting.setting_value;
      });

      return settings;
    } catch (error) {
      console.error('Error getting admin settings:', error);
      return {};
    }
  }

  async updateAdminSetting(key: string, value: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('admin_settings')
        .upsert({ 
          setting_key: key, 
          setting_value: value,
          updated_at: new Date().toISOString()
        }, { onConflict: 'setting_key' });

      return !error;
    } catch (error) {
      console.error('Error updating admin setting:', error);
      return false;
    }
  }

  // Activity tracking
  async logActivity(telegramId: string, activityType: string, amount: number = 0): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_activities')
        .insert({
          telegram_id: telegramId,
          activity_type: activityType,
          amount: amount,
          activity_date: new Date().toDateString()
        });

      return !error;
    } catch (error) {
      console.error('Error logging activity:', error);
      return false;
    }
  }

  // Referral operations
  async createReferral(referrerTelegramId: string, referredTelegramId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('referrals')
        .insert({
          referrer_telegram_id: referrerTelegramId,
          referred_telegram_id: referredTelegramId,
          earnings: 0
        });

      return !error;
    } catch (error) {
      console.error('Error creating referral:', error);
      return false;
    }
  }

  async updateReferralEarnings(referrerTelegramId: string, referredTelegramId: string, earnings: number): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('referrals')
        .update({ earnings })
        .eq('referrer_telegram_id', referrerTelegramId)
        .eq('referred_telegram_id', referredTelegramId);

      return !error;
    } catch (error) {
      console.error('Error updating referral earnings:', error);
      return false;
    }
  }

  // Withdrawal operations
  async createWithdrawalRequest(data: Omit<WithdrawalRequest, 'id' | 'created_at' | 'updated_at'>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('withdrawal_requests')
        .insert(data);

      return !error;
    } catch (error) {
      console.error('Error creating withdrawal request:', error);
      return false;
    }
  }

  async getWithdrawalRequests(status?: string): Promise<WithdrawalRequest[]> {
    try {
      let query = supabase.from('withdrawal_requests').select('*');
      
      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting withdrawal requests:', error);
      return [];
    }
  }

  async updateWithdrawalStatus(id: string, status: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('withdrawal_requests')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      return !error;
    } catch (error) {
      console.error('Error updating withdrawal status:', error);
      return false;
    }
  }

  // Real-time subscriptions
  subscribeToAdminSettings(callback: (settings: Record<string, string>) => void) {
    const channel = supabase
      .channel('admin_settings_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'admin_settings' },
        async () => {
          const settings = await this.getAdminSettings();
          callback(settings);
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }

  subscribeToWithdrawals(callback: (withdrawals: WithdrawalRequest[]) => void) {
    const channel = supabase
      .channel('withdrawal_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'withdrawal_requests' },
        async () => {
          const withdrawals = await this.getWithdrawalRequests();
          callback(withdrawals);
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }
}

export const dbService = new DatabaseService();
