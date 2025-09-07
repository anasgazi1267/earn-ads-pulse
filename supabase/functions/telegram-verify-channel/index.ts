import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface VerifyRequest {
  userId: string
  channelUsername: string
  telegramId: string
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, channelUsername, telegramId }: VerifyRequest = await req.json();
    
    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
    if (!botToken) {
      throw new Error('Bot token not configured');
    }

    // Check if user is member of the channel
    const telegramResponse = await fetch(
      `https://api.telegram.org/bot${botToken}/getChatMember?chat_id=${channelUsername}&user_id=${telegramId}`
    );
    
    const telegramData = await telegramResponse.json();
    
    console.log(`Telegram API Response for ${telegramId}:`, telegramData);
    
    let isJoined = false;
    if (telegramData.ok) {
      const status = telegramData.result.status;
      isJoined = ['member', 'administrator', 'creator'].includes(status);
    }

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Update user's channel join status if verified
    if (isJoined) {
      const { error } = await supabase
        .from('users')
        .update({
          channels_joined: true,
          channel_join_date: new Date().toISOString()
        })
        .eq('telegram_id', telegramId);

      if (error) {
        console.error('Error updating user:', error);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        isJoined,
        message: isJoined ? 'Channel membership verified!' : 'Not a member of the channel'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in telegram-verify-channel:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});