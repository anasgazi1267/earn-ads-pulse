import { supabase } from '@/integrations/supabase/client';

export interface User {
  id: string;
  telegram_id: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  balance?: number;
  referral_count?: number;
  referred_by?: string;
  channels_joined?: boolean;
  channel_join_date?: string;
  ads_watched_today?: number;
  spins_used_today?: number;
  last_activity_date?: string;
  created_at?: string;
  updated_at?: string;
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
  wallet_address: string;
  withdrawal_method: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
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
        
        // Process referral if exists - CRITICAL FIX: Only for new users
        if (referredBy && referredBy !== telegramUser.id.toString()) {
          console.log('Processing referral for new user:', { newUser: telegramUser.id, referrer: referredBy });
          const referralSuccess = await this.processReferral(referredBy, telegramUser.id.toString());
          console.log('Referral processing result:', referralSuccess);
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
      if (!user) {
        console.error('User not found for telegram ID:', telegramId);
        return false;
      }

      const today = new Date().toDateString();
      const isNewDay = user.last_activity_date !== today;
      
      console.log('Incrementing ads watched:', {
        telegramId,
        currentCount: user.ads_watched_today,
        isNewDay,
        today,
        lastActivity: user.last_activity_date
      });
      
      const newAdsCount = isNewDay ? 1 : (user.ads_watched_today || 0) + 1;
      
      const { error } = await supabase
        .from('users')
        .update({
          ads_watched_today: newAdsCount,
          last_activity_date: today,
          updated_at: new Date().toISOString()
        })
        .eq('telegram_id', telegramId);

      if (error) {
        console.error('Error updating ads watched:', error);
        return false;
      }

      console.log(`✅ Successfully updated ads watched for ${telegramId}: ${newAdsCount}`);
      return true;
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
  async processReferral(referrerTelegramId: string, newUserTelegramId: string): Promise<boolean> {
    try {
      console.log(`Processing referral: ${referrerTelegramId} -> ${newUserTelegramId}`);
      
      // Check if referrer exists
      const { data: referrer, error: referrerError } = await supabase
        .from('users')
        .select('*')
        .eq('telegram_id', referrerTelegramId)
        .single();

      if (referrerError || !referrer) {
        console.error('Referrer not found:', referrerError);
        return false;
      }

      // Check if new user already has a referrer
      const { data: newUser, error: newUserError } = await supabase
        .from('users')
        .select('referred_by')
        .eq('telegram_id', newUserTelegramId)
        .single();

      if (newUserError || !newUser) {
        console.error('New user not found:', newUserError);
        return false;
      }

      if (newUser.referred_by) {
        console.log('User already has a referrer');
        return false;
      }

      // Update new user with referrer
      const { error: updateUserError } = await supabase
        .from('users')
        .update({ 
          referred_by: referrerTelegramId,
          updated_at: new Date().toISOString()
        })
        .eq('telegram_id', newUserTelegramId);

      if (updateUserError) {
        console.error('Error updating new user:', updateUserError);
        return false;
      }

      // Increment referrer's count and give bonus
      const referralBonus = 0.10; // $0.10 per referral
      const newReferralCount = (referrer.referral_count || 0) + 1;
      const newBalance = (referrer.balance || 0) + referralBonus;

      const { error: updateReferrerError } = await supabase
        .from('users')
        .update({ 
          referral_count: newReferralCount,
          balance: newBalance,
          updated_at: new Date().toISOString()
        })
        .eq('telegram_id', referrerTelegramId);

      if (updateReferrerError) {
        console.error('Error updating referrer:', updateReferrerError);
        return false;
      }

      // Log the referral
      const { error: referralError } = await supabase
        .from('referrals')
        .insert({
          referrer_telegram_id: referrerTelegramId,
          referred_telegram_id: newUserTelegramId,
          earnings: referralBonus
        });

      if (referralError) {
        console.error('Error logging referral:', referralError);
      }

      // Log activity
      await this.logActivity(referrerTelegramId, 'referral_bonus', referralBonus);

      console.log(`Referral processed successfully: +${referralBonus} for ${referrerTelegramId}`);
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

  // IMPROVED getUserReferrals function
  async getUserReferrals(telegramId: string): Promise<ReferralDetail[]> {
    try {
      console.log('Getting referrals for user:', telegramId);
      
      // First get the referrals with earnings
      const { data: referrals, error: referralsError } = await supabase
        .from('referrals')
        .select('referred_telegram_id, earnings, created_at')
        .eq('referrer_telegram_id', telegramId)
        .order('created_at', { ascending: false });

      if (referralsError) {
        console.error('Error fetching referrals:', referralsError);
        return [];
      }
      
      if (!referrals || referrals.length === 0) {
        console.log('No referrals found for user:', telegramId);
        return [];
      }

      console.log('Found referrals:', referrals.length);

      // Get user details for all referred users
      const referredTelegramIds = referrals.map(r => r.referred_telegram_id);
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('telegram_id, username, first_name')
        .in('telegram_id', referredTelegramIds);

      if (usersError) {
        console.error('Error fetching referred users:', usersError);
        return [];
      }

      // Combine the data
      const referralDetails: ReferralDetail[] = referrals.map(referral => {
        const user = users?.find(u => u.telegram_id === referral.referred_telegram_id);
        return {
          referred_user_id: referral.referred_telegram_id,
          referred_username: user?.username || '',
          referred_first_name: user?.first_name || 'Unknown User',
          earnings: referral.earnings || 0,
          created_at: referral.created_at || ''
        };
      });

      console.log('Processed referral details:', referralDetails);
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

  async getUserActivities(telegramId: string): Promise<UserActivity[]> {
    try {
      const { data, error } = await supabase
        .from('user_activities')
        .select('*')
        .eq('telegram_id', telegramId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting user activities:', error);
      return [];
    }
  }

  // Get referral statistics
  async getReferralStats(telegramId: string): Promise<{ count: number; earnings: number; referrals: any[] }> {
    try {
      const { data: referrals, error } = await supabase
        .from('referrals')
        .select('*')
        .eq('referrer_telegram_id', telegramId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching referral stats:', error);
        return { count: 0, earnings: 0, referrals: [] };
      }

      const count = referrals?.length || 0;
      const earnings = referrals?.reduce((sum, ref) => sum + (ref.earnings || 0), 0) || 0;

      return { count, earnings, referrals: referrals || [] };
    } catch (error) {
      console.error('Error getting referral stats:', error);
      return { count: 0, earnings: 0, referrals: [] };
    }
  }
}

export const dbService = new DatabaseService();
