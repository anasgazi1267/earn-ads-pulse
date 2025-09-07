import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface NotifyRequest {
  telegramId: string
  message: string
  type: 'deposit' | 'withdrawal' | 'earning' | 'activity' | 'welcome'
}

const getMessageTemplate = (type: string, data: any) => {
  switch (type) {
    case 'deposit':
      return `💰 Deposit Confirmed!\nAmount: ${data.amount} USDT\nTransaction ID: ${data.transactionId}\nYour deposit balance has been updated. ✅`;
    
    case 'withdrawal':
      return `💸 Withdrawal Request Received!\nAmount: ${data.amount} USDT\nMethod: ${data.method}\nStatus: Processing... ⏳\nWe'll notify you once completed!`;
    
    case 'earning':
      return `🎉 Congratulations!\nYou earned ${data.amount} USDT from ${data.activity}!\n💎 Keep completing tasks to earn more!`;
    
    case 'activity':
      return `🔔 Activity Update\n${data.message}\n📊 Check your dashboard for details!`;
    
    case 'welcome':
      return `🎊 Welcome to Ads USDT Earn!\n\n🚀 Start earning USDT by:\n• Joining Telegram channels\n• Watching ads\n• Completing tasks\n• Referring friends\n\n💰 Your earning journey begins now!`;
    
    default:
      return data.message || 'Notification from Ads USDT Earn';
  }
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { telegramId, message, type }: NotifyRequest = await req.json();
    
    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
    if (!botToken) {
      throw new Error('Bot token not configured');
    }

    // Get message template based on type
    const finalMessage = message || getMessageTemplate(type, { message });
    
    // Send message via Telegram Bot API
    const telegramResponse = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: telegramId,
          text: finalMessage,
          parse_mode: 'HTML'
        })
      }
    );
    
    const telegramData = await telegramResponse.json();
    console.log(`Message sent to ${telegramId}:`, telegramData);
    
    if (!telegramData.ok) {
      throw new Error(`Telegram API error: ${telegramData.description}`);
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        messageId: telegramData.result.message_id,
        message: 'Notification sent successfully!'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in telegram-bot-notify:', error);
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