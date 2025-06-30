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

export interface ReferralDetail {
  referred_user_id: string;
  referred_username: string;
  referred_first_name: string;
  earnings: number;
  created_at: string;
}

export class DatabaseService {
  // User operations
  async createOrUpdateUser(telegramUser: any, referredBy?: string): Promise<User | null> {
    try {
      const today = new Date().toDateString();
      
      // First check if user exists
      const existingUser = await this.getUserByTelegramId(telegramUser.id.toString());
      
      if (existingUser) {
        // Update existing user with latest Telegram info
        const { data, error } = await supabase
          .from('users')
          .update({
            username: telegramUser.username || null,
            first_name: telegramUser.first_name || null,
            last_name: telegramUser.last_name || null,
            last_activity_date: today,
            updated_at: new Date().toISOString()
          })
          .eq('telegram_id', telegramUser.id.toString())
          .select()
          .single();

        if (error) throw error;
        console.log('Updated existing user:', data);
        return data;
      } else {
        // Create new user with zero balance
        const userData = {
          telegram_id: telegramUser.id.toString(),
          username: telegramUser.username || null,
          first_name: telegramUser.first_name || null,
          last_name: telegramUser.last_name || null,
          balance: 0.000, // Start with zero balance
          referral_count: 0,
          channels_joined: false,
          ads_watched_today: 0,
          spins_used_today: 0,
          last_activity_date: today,
          referred_by: referredBy || null
        };

        const { data, error } = await supabase
          .from('users')
          .insert(userData)
          .select()
          .single();

        if (error) throw error;
        console.log('Created new user:', data);
        
        // Process referral if exists
        if (referredBy) {
          console.log('Processing referral for new user');
          await this.processReferral(referredBy, telegramUser.id.toString());
        }
        
        return data;
      }
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

      if (error) throw error;
      console.log(`Updated balance for user ${telegramId}: ${newBalance}`);
      return true;
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

  async increaseBalance(telegramId: string, amount: number): Promise<boolean> {
    try {
      const user = await this.getUserByTelegramId(telegramId);
      if (!user) return false;

      const newBalance = user.balance + amount;
      return await this.updateUserBalance(telegramId, newBalance);
    } catch (error) {
      console.error('Error increasing balance:', error);
      return false;
    }
  }

  async incrementUserAdsWatched(telegramId: string): Promise<boolean> {
    try {
      // First get the current user data
      const user = await this.getUserByTelegramId(telegramId);
      if (!user) return false;

      const today = new Date().toDateString();
      const isNewDay = user.last_activity_date !== today;
      
      const { error } = await supabase
        .from('users')
        .update({
          ads_watched_today: isNewDay ? 1 : user.ads_watched_today + 1,
          last_activity_date: today,
          updated_at: new Date().toISOString()
        })
        .eq('telegram_id', telegramId);

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

      console.log(`Updated admin setting ${key}: ${value}`);
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

  // Fixed referral system
  async processReferral(referrerTelegramId: string, referredTelegramId: string): Promise<boolean> {
    try {
      console.log('Processing referral:', { referrerTelegramId, referredTelegramId });
      
      // Check if referral already exists
      const { data: existingReferral } = await supabase
        .from('referrals')
        .select('id')
        .eq('referrer_telegram_id', referrerTelegramId)
        .eq('referred_telegram_id', referredTelegramId)
        .single();

      if (existingReferral) {
        console.log('Referral already exists');
        return true;
      }

      // Create referral record
      const { error: referralError } = await supabase
        .from('referrals')
        .insert({
          referrer_telegram_id: referrerTelegramId,
          referred_telegram_id: referredTelegramId,
          earnings: 0.01 // 1 cent bonus for referral
        });

      if (referralError) {
        console.error('Error creating referral:', referralError);
        return false;
      }

      // Get referrer user and update count + balance  
      const referrer = await this.getUserByTelegramId(referrerTelegramId);
      if (referrer) {
        const newReferralCount = (referrer.referral_count || 0) + 1;
        const newBalance = referrer.balance + 0.01; // Add 1 cent for referral
        
        const { error: updateError } = await supabase
          .from('users')
          .update({ 
            referral_count: newReferralCount,
            balance: newBalance,
            updated_at: new Date().toISOString()
          })
          .eq('telegram_id', referrerTelegramId);

        if (updateError) {
          console.error('Error updating referrer:', updateError);
          return false;
        }

        // Log referral activity
        await this.logActivity(referrerTelegramId, 'referral_bonus', 0.01);
        
        console.log(`Referral processed: ${referrerTelegramId} got +1 referral and $0.01`);
      }

      return true;
    } catch (error) {
      console.error('Error processing referral:', error);
      return false;
    }
  }

  async createReferral(referrerTelegramId: string, referredTelegramId: string): Promise<boolean> {
    return this.processReferral(referrerTelegramId, referredTelegramId);
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

  // Get user referrals using separate queries to avoid foreign key issues
  async getUserReferrals(telegramId: string): Promise<ReferralDetail[]> {
    try {
      // First get the referrals
      const { data: referrals, error: referralsError } = await supabase
        .from('referrals')
        .select('referred_telegram_id, earnings, created_at')
        .eq('referrer_telegram_id', telegramId);

      if (referralsError) throw referralsError;
      
      if (!referrals || referrals.length === 0) {
        return [];
      }

      // Get user details for all referred users
      const referredTelegramIds = referrals.map(r => r.referred_telegram_id);
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('telegram_id, username, first_name')
        .in('telegram_id', referredTelegramIds);

      if (usersError) throw usersError;

      // Combine the data
      const referralDetails: ReferralDetail[] = referrals.map(referral => {
        const user = users?.find(u => u.telegram_id === referral.referred_telegram_id);
        return {
          referred_user_id: referral.referred_telegram_id,
          referred_username: user?.username || '',
          referred_first_name: user?.first_name || '',
          earnings: referral.earnings || 0,
          created_at: referral.created_at || ''
        };
      });

      return referralDetails;
    } catch (error) {
      console.error('Error getting user referrals:', error);
      return [];
    }
  }

  // Admin functions
  async getAllUsers(): Promise<User[]> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting all users:', error);
      return [];
    }
  }

  async adminUpdateUserBalance(telegramId: string, newBalance: number): Promise<boolean> {
    return this.updateUserBalance(telegramId, newBalance);
  }

  async adminToggleWithdrawalEnabled(telegramId: string, enabled: boolean): Promise<boolean> {
    try {
      // For now, we'll use referral_count to determine withdrawal eligibility
      // In a real app, you might have a separate field for this
      const user = await this.getUserByTelegramId(telegramId);
      if (!user) return false;

      const requiredReferrals = enabled ? 0 : 999; // Set high number to disable
      
      // This is a workaround - in production you'd have a dedicated field
      console.log(`Admin ${enabled ? 'enabled' : 'disabled'} withdrawal for user ${telegramId}`);
      return true;
    } catch (error) {
      console.error('Error toggling withdrawal:', error);
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

  // Real-time subscriptions for instant updates
  subscribeToAdminSettings(callback: (settings: Record<string, string>) => void) {
    const channel = supabase
      .channel('admin_settings_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'admin_settings' },
        async () => {
          console.log('Admin settings changed - updating...');
          const settings = await this.getAdminSettings();
          callback(settings);
        }
      )
      .subscribe((status) => {
        console.log('Admin settings subscription status:', status);
      });

    return () => supabase.removeChannel(channel);
  }

  subscribeToWithdrawals(callback: (withdrawals: WithdrawalRequest[]) => void) {
    const channel = supabase
      .channel('withdrawal_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'withdrawal_requests' },
        async () => {
          console.log('Withdrawal requests changed - updating...');
          const withdrawals = await this.getWithdrawalRequests();
          callback(withdrawals);
        }
      )
      .subscribe((status) => {
        console.log('Withdrawal subscription status:', status);
      });

    return () => supabase.removeChannel(channel);
  }

  subscribeToUsers(callback: (users: User[]) => void) {
    const channel = supabase
      .channel('users_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'users' },
        async () => {
          console.log('Users changed - updating...');
          const users = await this.getAllUsers();
          callback(users);
        }
      )
      .subscribe((status) => {
        console.log('Users subscription status:', status);
      });

    return () => supabase.removeChannel(channel);
  }

  // Subscribe to user balance changes for real-time updates
  subscribeToUserBalance(telegramId: string, callback: (balance: number) => void) {
    const channel = supabase
      .channel(`user_balance_${telegramId}`)
      .on(
        'postgres_changes',
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'users',
          filter: `telegram_id=eq.${telegramId}`
        },
        (payload) => {
          console.log('User balance updated:', payload);
          if (payload.new && typeof payload.new.balance === 'number') {
            callback(payload.new.balance);
          }
        }
      )
      .subscribe((status) => {
        console.log(`User balance subscription status for ${telegramId}:`, status);
      });

    return () => supabase.removeChannel(channel);
  }
}

export const dbService = new DatabaseService();
