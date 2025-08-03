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
      const deviceFingerprint = getDeviceFingerprint();
      const ipAddress = await getClientIP();
      
      // Check if this IP is already used by another user
      const { data: existingDevices, error: checkError } = await supabase
        .from('user_device_tracking')
        .select('telegram_id, is_blocked')
        .eq('ip_address', ipAddress);

      if (checkError) {
        console.error('Error checking device:', checkError);
        return;
      }

      // If IP exists and belongs to different user, block access
      if (existingDevices && existingDevices.length > 0) {
        const existingDevice = existingDevices[0];
        if (existingDevice.telegram_id !== userInfo.id.toString()) {
          toast({
            title: "Device Restriction",
            description: "This device is already registered to another account. One device per account allowed.",
            variant: "destructive"
          });
          onDeviceBlocked();
          return;
        }
        
        if (existingDevice.is_blocked) {
          toast({
            title: "Account Blocked",
            description: "Your device has been blocked by admin.",
            variant: "destructive"
          });
          onDeviceBlocked();
          return;
        }
      }

      // Update or insert device tracking
      const { error: upsertError } = await supabase
        .from('user_device_tracking')
        .upsert({
          telegram_id: userInfo.id.toString(),
          ip_address: ipAddress,
          device_fingerprint: deviceFingerprint,
          user_agent: navigator.userAgent,
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