
import { supabase } from '@/integrations/supabase/client';

export interface Channel {
  id: string;
  name: string;
  url: string;
  description?: string;
  logo_url?: string;
  subscribers_count?: string;
  is_active: boolean;
  display_order?: number;
  created_at?: string;
  updated_at?: string;
}

export class ChannelService {
  // Get all active channels
  async getActiveChannels(): Promise<Channel[]> {
    try {
      const { data, error } = await supabase
        .from('channels')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting active channels:', error);
      return [];
    }
  }

  // Get all channels (for admin)
  async getAllChannels(): Promise<Channel[]> {
    try {
      const { data, error } = await supabase
        .from('channels')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting all channels:', error);
      return [];
    }
  }

  // Create new channel
  async createChannel(channelData: Omit<Channel, 'id' | 'created_at' | 'updated_at'>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('channels')
        .insert(channelData);

      if (error) throw error;
      console.log('Channel created successfully');
      return true;
    } catch (error) {
      console.error('Error creating channel:', error);
      return false;
    }
  }

  // Update channel
  async updateChannel(id: string, updates: Partial<Channel>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('channels')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
      console.log('Channel updated successfully');
      return true;
    } catch (error) {
      console.error('Error updating channel:', error);
      return false;
    }
  }

  // Delete channel
  async deleteChannel(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('channels')
        .delete()
        .eq('id', id);

      if (error) throw error;
      console.log('Channel deleted successfully');
      return true;
    } catch (error) {
      console.error('Error deleting channel:', error);
      return false;
    }
  }

  // Toggle channel active status
  async toggleChannelStatus(id: string, isActive: boolean): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('channels')
        .update({
          is_active: isActive,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
      console.log(`Channel ${isActive ? 'activated' : 'deactivated'} successfully`);
      return true;
    } catch (error) {
      console.error('Error toggling channel status:', error);
      return false;
    }
  }

  // Upload channel logo
  async uploadChannelLogo(file: File): Promise<string | null> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('channel-logos')
        .upload(fileName, file);

      if (error) throw error;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('channel-logos')
        .getPublicUrl(fileName);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Error uploading channel logo:', error);
      return null;
    }
  }

  // Delete channel logo
  async deleteChannelLogo(logoUrl: string): Promise<boolean> {
    try {
      if (!logoUrl.includes('channel-logos')) return true;
      
      const fileName = logoUrl.split('/').pop();
      if (!fileName) return true;

      const { error } = await supabase.storage
        .from('channel-logos')
        .remove([fileName]);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting channel logo:', error);
      return false;
    }
  }
}

export const channelService = new ChannelService();
