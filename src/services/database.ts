import { supabase } from '@/integrations/supabase/client';

export interface User {
  id: string;
  telegram_id: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  balance?: number;
  deposit_balance?: number;
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
      
      console.log('🔍 Creating/updating user:', { 
        telegramId: telegramUser.id, 
        referredBy,
        hasReferrer: !!referredBy 
      });
      
      // First check if user exists
      const existingUser = await this.getUserByTelegramId(telegramUser.id.toString());
      
      if (existingUser) {
        console.log('👤 Existing user found:', {
          id: existingUser.telegram_id,
          hasReferrer: !!existingUser.referred_by,
          currentReferrer: existingUser.referred_by
        });

        // Check if existing user doesn't have a referrer but one is provided
        if (referredBy && !existingUser.referred_by && referredBy !== telegramUser.id.toString()) {
          console.log('🎯 Processing referral for returning user without referrer:', { 
            userId: telegramUser.id, 
            referrer: referredBy 
          });
          
          // Update user first with referrer info
          const { error: updateError } = await supabase
            .from('users')
            .update({
              referred_by: referredBy,
              updated_at: new Date().toISOString()
            })
            .eq('telegram_id', telegramUser.id.toString());

          if (updateError) {
            console.error('❌ Error updating user with referrer:', updateError);
          } else {
            console.log('✅ User updated with referrer');
            // Process the referral bonus
            const referralSuccess = await this.processReferral(referredBy, telegramUser.id.toString());
            console.log('💰 Referral processing result for returning user:', referralSuccess);
          }
        }
        
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
        console.log('✅ Updated existing user:', data);
        return data;
      } else {
        // Create new user with zero balance
        console.log('🆕 Creating new user with referrer:', referredBy);
        
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
        console.log('✅ Created new user:', data);
        
        // Process referral if exists - Only for new users
        if (referredBy && referredBy !== telegramUser.id.toString()) {
          console.log('🎯 Processing referral for new user:', { 
            newUser: telegramUser.id, 
            referrer: referredBy 
          });
          
          // Add a small delay to ensure user is fully created
          setTimeout(async () => {
            const referralSuccess = await this.processReferral(referredBy, telegramUser.id.toString());
            console.log('💰 Referral processing result:', referralSuccess);
          }, 1000);
        }
        
        return data;
      }
    } catch (error) {
      console.error('❌ Error creating/updating user:', error);
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

  // Delete user for admin purposes
  async deleteUser(telegramId: string): Promise<boolean> {
    try {
      // Delete user's activities first
      await supabase
        .from('user_activities')
        .delete()
        .eq('telegram_id', telegramId);

      // Delete user's completed tasks
      await supabase
        .from('user_tasks')
        .delete()
        .eq('user_id', telegramId);

      // Delete user's referrals (both as referrer and referred)
      await supabase
        .from('referrals')
        .delete()
        .or(`referrer_telegram_id.eq.${telegramId},referred_telegram_id.eq.${telegramId}`);

      // Delete withdrawal requests
      await supabase
        .from('withdrawal_requests')
        .delete()
        .eq('telegram_id', telegramId);

      // Finally delete the user
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('telegram_id', telegramId);

      if (error) throw error;
      console.log(`User ${telegramId} deleted successfully`);
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
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
      // Use database function for atomic increment
      const { data, error } = await supabase.rpc('increment_ads_watched', {
        user_telegram_id: telegramId
      });

      if (error) {
        console.error('Error incrementing ads watched:', error);
        return false;
      }

      console.log(`✅ Successfully updated ads watched for ${telegramId}`);
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

  async getAdminSetting(key: string): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('admin_settings')
        .select('setting_value')
        .eq('setting_key', key)
        .single();

      if (error) throw error;
      return data?.setting_value || '';
    } catch (error) {
      console.error('Error getting admin setting:', error);
      return '';
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

  // Payment methods
  async getPaymentMethods(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('is_active', true)
        .order('display_name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting payment methods:', error);
      return [];
    }
  }

  async createDepositRequest(depositData: any): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_deposits')
        .insert(depositData);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error creating deposit request:', error);
      return false;
    }
  }

  async convertEarningsToDeposit(telegramId: string, amount: number): Promise<boolean> {
    try {
      // Get conversion fee
      const conversionFeeStr = await this.getAdminSetting('conversion_fee_percentage');
      const conversionFee = parseFloat(conversionFeeStr) || 0.1;
      
      // Calculate the fee and final amount
      const fee = amount * conversionFee;
      const finalAmount = amount - fee;
      
      // Get current user data
      const user = await this.getUserByTelegramId(telegramId);
      if (!user) return false;
      
      if (user.balance < amount) return false;
      
      // Update both balances in a transaction
      const { error } = await supabase
        .from('users')
        .update({
          balance: user.balance - amount,
          deposit_balance: (user.deposit_balance || 0) + finalAmount,
          updated_at: new Date().toISOString()
        })
        .eq('telegram_id', telegramId);

      if (error) throw error;

      // Log the conversion
      await this.logActivity(telegramId, 'balance_conversion', amount);
      
      return true;
    } catch (error) {
      console.error('Error converting earnings to deposit:', error);
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

  async getAllDeposits(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('user_deposits')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting deposits:', error);
      return [];
    }
  }

  // Enhanced referral processing
  async processReferral(referrerTelegramId: string, newUserTelegramId: string): Promise<boolean> {
    try {
      console.log(`🎯 Processing referral: ${referrerTelegramId} -> ${newUserTelegramId}`);
      
      // Validate referrer is not same as new user
      if (referrerTelegramId === newUserTelegramId) {
        console.log('❌ Self-referral not allowed');
        return false;
      }
      
      // Check if referrer exists
      const { data: referrer, error: referrerError } = await supabase
        .from('users')
        .select('*')
        .eq('telegram_id', referrerTelegramId)
        .single();

      if (referrerError || !referrer) {
        console.error('❌ Referrer not found:', referrerError);
        return false;
      }

      // Check if new user exists
      const { data: newUser, error: newUserError } = await supabase
        .from('users')
        .select('*')
        .eq('telegram_id', newUserTelegramId)
        .single();

      if (newUserError || !newUser) {
        console.error('❌ New user not found:', newUserError);
        return false;
      }

      // Check if referral already exists
      const { data: existingReferral } = await supabase
        .from('referrals')
        .select('*')
        .eq('referrer_telegram_id', referrerTelegramId)
        .eq('referred_telegram_id', newUserTelegramId)
        .single();

      if (existingReferral) {
        console.log('⚠️ Referral already exists');
        return false;
      }

      // Process the referral
      const referralBonus = 0.01; // $0.01 per referral
      const newReferralCount = (referrer.referral_count || 0) + 1;
      const newBalance = (referrer.balance || 0) + referralBonus;

      console.log('💰 Applying referral bonus:', {
        referrer: referrerTelegramId,
        oldBalance: referrer.balance,
        newBalance: newBalance,
        oldReferralCount: referrer.referral_count,
        newReferralCount: newReferralCount
      });

      // Update referrer's stats and balance
      const { error: updateReferrerError } = await supabase
        .from('users')
        .update({ 
          referral_count: newReferralCount,
          balance: newBalance,
          updated_at: new Date().toISOString()
        })
        .eq('telegram_id', referrerTelegramId);

      if (updateReferrerError) {
        console.error('❌ Error updating referrer:', updateReferrerError);
        return false;
      }

      // Log the referral in referrals table
      const { error: referralError } = await supabase
        .from('referrals')
        .insert({
          referrer_telegram_id: referrerTelegramId,
          referred_telegram_id: newUserTelegramId,
          earnings: referralBonus
        });

      if (referralError) {
        console.error('❌ Error logging referral:', referralError);
        return false;
      }

      // Log activity
      await this.logActivity(referrerTelegramId, 'referral_bonus', referralBonus);

      console.log(`✅ Referral processed successfully: +$${referralBonus} for ${referrerTelegramId}`);
      return true;
    } catch (error) {
      console.error('❌ Error processing referral:', error);
      return false;
    }
  }

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

  async updateDepositStatus(depositId: string, status: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_deposits')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', depositId);

      if (error) throw error;
      
      // If approved, update user's deposit balance
      if (status === 'completed') {
        const { data: deposit } = await supabase
          .from('user_deposits')
          .select('*')
          .eq('id', depositId)
          .single();

        if (deposit) {
          const user = await this.getUserByTelegramId(deposit.user_id);
          if (user) {
            const newDepositBalance = (user.deposit_balance || 0) + deposit.amount;
            await supabase
              .from('users')
              .update({ 
                deposit_balance: newDepositBalance,
                updated_at: new Date().toISOString()
              })
              .eq('telegram_id', deposit.user_id);
          }
        }
      }

      return true;
    } catch (error) {
      console.error('Error updating deposit status:', error);
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

  // Get referral statistics
  async getReferralStats(telegramId: string): Promise<{ count: number; earnings: number; referrals: any[] }> {
    try {
      console.log('📊 Getting referral stats for:', telegramId);
      
      const { data: referrals, error } = await supabase
        .from('referrals')
        .select('*')
        .eq('referrer_telegram_id', telegramId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching referral stats:', error);
        return { count: 0, earnings: 0, referrals: [] };
      }

      const count = referrals?.length || 0;
      const earnings = referrals?.reduce((sum, ref) => sum + (ref.earnings || 0), 0) || 0;

      console.log('📈 Referral stats result:', { count, earnings, referralsLength: referrals?.length });

      return { count, earnings, referrals: referrals || [] };
    } catch (error) {
      console.error('❌ Error getting referral stats:', error);
      return { count: 0, earnings: 0, referrals: [] };
    }
  }

  async getDeviceTrackingData() {
    const { data, error } = await supabase
      .from('user_device_tracking')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching device tracking data:', error);
      throw error;
    }

    return data || [];
  }

  async toggleDeviceBlocking(telegramId: string, isBlocked: boolean) {
    const { error } = await supabase
      .from('user_device_tracking')
      .update({ is_blocked: isBlocked })
      .eq('telegram_id', telegramId);

    if (error) {
      console.error('Error toggling device blocking:', error);
      throw error;
    }

    return true;
  }

  // Get all withdrawal requests
  async getAllWithdrawalRequests(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('withdrawal_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting withdrawal requests:', error);
      return [];
    }
  }

  // Get all deposit requests  
  async getAllDepositRequests(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('user_deposits')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting deposit requests:', error);
      return [];
    }
  }

  // Update withdrawal request status
  async updateWithdrawalRequestStatus(requestId: string, status: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('withdrawal_requests')
        .update({ 
          status, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', requestId);

      return !error;
    } catch (error) {
      console.error('Error updating withdrawal request:', error);
      return false;
    }
  }

  // Update deposit request status
  async updateDepositRequestStatus(requestId: string, status: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_deposits')
        .update({ 
          status, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', requestId);

      return !error;
    } catch (error) {
      console.error('Error updating deposit request:', error);
      return false;
    }
  }

  // Get user-uploaded tasks
  async getUserUploadedTasks(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_created', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting user uploaded tasks:', error);
      return [];
    }
  }

  // Update user uploaded task status
  async updateUserTaskStatus(taskId: string, status: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ 
          status, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', taskId);

      return !error;
    } catch (error) {
      console.error('Error updating task status:', error);
      return false;
    }
  }

  // Missing methods for compatibility
  async getUserAdsWatchedToday(telegramId: string): Promise<number> {
    try {
      const user = await this.getUserByTelegramId(telegramId);
      return user?.ads_watched_today || 0;
    } catch (error) {
      console.error('Error getting ads watched today:', error);
      return 0;
    }
  }

  async updateUserDepositBalance(telegramId: string, amountChange: number): Promise<boolean> {
    try {
      // Get current user to calculate new balance
      const user = await this.getUserByTelegramId(telegramId);
      if (!user) {
        console.error('User not found for deposit balance update');
        return false;
      }

      const currentBalance = user.deposit_balance || 0;
      const newBalance = currentBalance + amountChange; // Positive for deposit, negative for deduction

      if (newBalance < 0) {
        console.error('Insufficient deposit balance');
        return false;
      }

      const { error } = await supabase
        .from('users')
        .update({ 
          deposit_balance: newBalance, 
          updated_at: new Date().toISOString() 
        })
        .eq('telegram_id', telegramId);

      if (error) {
        console.error('Database error updating deposit balance:', error);
        return false;
      }

      console.log(`✅ Updated deposit balance for ${telegramId}: ${currentBalance} → ${newBalance} (change: ${amountChange})`);
      return true;
    } catch (error) {
      console.error('Error updating deposit balance:', error);
      return false;
    }
  }
}

export const dbService = new DatabaseService();