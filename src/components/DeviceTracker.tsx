import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface DeviceTrackerProps {
  userInfo: any;
  onDeviceBlocked: () => void;
}

const DeviceTracker = ({ userInfo, onDeviceBlocked }: DeviceTrackerProps) => {
  useEffect(() => {
    if (!userInfo?.id) return;

    // Allow admin to have multiple accounts on same device
    const isAdmin = userInfo?.username === 'zahidulislamnayon' || userInfo?.id?.toString() === '6096745315';
    if (isAdmin) {
      console.log('Admin user detected - skipping device verification');
      return;
    }
    
    trackDevice();
  }, [userInfo]);

  const getDeviceFingerprint = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx!.textBaseline = 'top';
    ctx!.font = '14px Arial';
    ctx!.fillText('Device fingerprint', 2, 2);
    
    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset(),
      canvas.toDataURL()
    ].join('|');
    
    return btoa(fingerprint).substring(0, 32);
  };

  const getClientIP = async () => {
    try {
      // In production, you might want to use a proper IP detection service
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch (error) {
      // Fallback for development
      return 'local_' + Math.random().toString(36).substring(7);
    }
  };

  const trackDevice = async () => {
    try {
      // Check if device verification is enabled
      const { data: settings } = await supabase
        .from('admin_settings')
        .select('setting_value')
        .eq('setting_key', 'device_verification_enabled')
        .single();

      if (settings?.setting_value === 'false') {
        console.log('Device verification disabled - skipping check');
        return;
      }

      const deviceFingerprint = getDeviceFingerprint();
      const ipAddress = await getClientIP();
      
      // Check if this device has any existing accounts
      const { data: existingDevices, error: checkError } = await supabase
        .from('user_device_tracking')
        .select('telegram_id, first_account_telegram_id, is_blocked, total_accounts_attempted')
        .eq('ip_address', ipAddress);

      if (checkError) {
        console.error('Error checking device:', checkError);
        return;
      }

      if (existingDevices && existingDevices.length > 0) {
        const existingDevice = existingDevices[0];
        
        // Check if device is blocked
        if (existingDevice.is_blocked) {
          toast({
            title: "অ্যাকাউন্ট ব্লক",
            description: "আপনার ডিভাইস এডমিন দ্বারা ব্লক করা হয়েছে।",
            variant: "destructive"
          });
          onDeviceBlocked();
          return;
        }

        // If this is not the first account registered on this device
        if (existingDevice.first_account_telegram_id && 
            existingDevice.first_account_telegram_id !== userInfo.id.toString()) {
          
          // Update attempt count
          await supabase
            .from('user_device_tracking')
            .update({ 
              total_accounts_attempted: (existingDevice.total_accounts_attempted || 1) + 1,
              last_seen: new Date().toISOString()
            })
            .eq('ip_address', ipAddress);

          toast({
            title: "একাউন্ট সীমাবদ্ধতা",
            description: "এই ডিভাইসে আপনার আগে থেকেই একটি অ্যাকাউন্ট রয়েছে। প্রথম অ্যাকাউন্টটি ব্যবহার করুন।",
            variant: "destructive"
          });
          onDeviceBlocked();
          return;
        }

        // If this is the first account, allow access
        if (existingDevice.first_account_telegram_id === userInfo.id.toString()) {
          await supabase
            .from('user_device_tracking')
            .update({ 
              last_seen: new Date().toISOString(),
              user_agent: navigator.userAgent,
              device_fingerprint: deviceFingerprint
            })
            .eq('ip_address', ipAddress);
          return;
        }
      }

      // This is a new device, register the first account
      const { error: upsertError } = await supabase
        .from('user_device_tracking')
        .upsert({
          telegram_id: userInfo.id.toString(),
          ip_address: ipAddress,
          device_fingerprint: deviceFingerprint,
          user_agent: navigator.userAgent,
          first_account_telegram_id: userInfo.id.toString(),
          total_accounts_attempted: 1,
          last_seen: new Date().toISOString()
        }, {
          onConflict: 'ip_address'
        });

      if (upsertError) {
        console.error('Error updating device tracking:', upsertError);
      }
    } catch (error) {
      console.error('Error in device tracking:', error);
    }
  };

  return null; // This is a utility component with no UI
};

export default DeviceTracker;