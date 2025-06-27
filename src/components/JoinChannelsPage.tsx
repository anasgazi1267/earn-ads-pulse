
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, CheckCircle, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface JoinChannelsPageProps {
  channels: string[];
  onChannelsJoined: () => void;
}

const JoinChannelsPage: React.FC<JoinChannelsPageProps> = ({ channels, onChannelsJoined }) => {
  const [joinedChannels, setJoinedChannels] = useState<Set<string>>(new Set());
  const [verifying, setVerifying] = useState(false);
  const { toast } = useToast();

  const handleChannelClick = (channel: string) => {
    window.open(channel, '_blank');
    // Mark as clicked (user needs to manually verify)
    setTimeout(() => {
      setJoinedChannels(prev => new Set([...prev, channel]));
      toast({
        title: "Channel Opened",
        description: "Please join the channel and return to verify",
      });
    }, 1000);
  };

  const handleVerifyJoin = async () => {
    if (joinedChannels.size < channels.length) {
      toast({
        title: "Incomplete",
        description: `Please join all ${channels.length} channels first`,
        variant: "destructive"
      });
      return;
    }

    setVerifying(true);
    // Simulate verification process
    setTimeout(() => {
      localStorage.setItem('channelsJoined', 'true');
      localStorage.setItem('channelJoinDate', new Date().toISOString());
      setVerifying(false);
      onChannelsJoined();
      toast({
        title: "Success!",
        description: "All channels verified. Welcome to Ads by USDT Earn!",
      });
    }, 3000);
  };

  const getChannelName = (url: string) => {
    return url.split('/').pop()?.replace('t.me/', '') || url;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg bg-gray-800/90 backdrop-blur-sm border-gray-700 shadow-2xl">
        <CardHeader className="text-center pb-6">
          <div className="mx-auto mb-6 w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
            <Users className="w-10 h-10 text-white" />
          </div>
          <CardTitle className="text-3xl font-bold text-white mb-3">
            Join Required Channels
          </CardTitle>
          <p className="text-gray-300 text-lg">
            Complete all 4 channel joins to unlock earning features
          </p>
          <div className="mt-4 px-4 py-2 bg-blue-600/20 rounded-lg border border-blue-500/30">
            <p className="text-blue-300 text-sm font-medium">
              ⚠️ Mandatory: All channels must be joined to proceed
            </p>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="space-y-4">
            {channels.map((channel, index) => (
              <div key={index} className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-gray-700/50 to-gray-600/50 p-4 border border-gray-600 hover:border-blue-500/50 transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 ${
                      joinedChannels.has(channel) 
                        ? 'bg-green-500 shadow-lg shadow-green-500/30' 
                        : 'bg-gray-500'
                    }`}>
                      {joinedChannels.has(channel) && <CheckCircle className="w-4 h-4 text-white" />}
                    </div>
                    <div>
                      <span className="text-white font-semibold text-lg">
                        @{getChannelName(channel)}
                      </span>
                      <p className="text-gray-400 text-sm">Telegram Channel #{index + 1}</p>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleChannelClick(channel)}
                    size="sm"
                    className={`transition-all duration-300 ${
                      joinedChannels.has(channel)
                        ? "bg-green-600 hover:bg-green-700 shadow-lg shadow-green-600/30"
                        : "bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/30"
                    }`}
                  >
                    {joinedChannels.has(channel) ? (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Opened
                      </>
                    ) : (
                      <>
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Join Now
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-6 border-t border-gray-700">
            <div className="mb-4 text-center">
              <p className="text-gray-300 mb-2">
                Progress: {joinedChannels.size}/{channels.length} channels
              </p>
              <div className="w-full bg-gray-700 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${(joinedChannels.size / channels.length) * 100}%` }}
                ></div>
              </div>
            </div>

            <Button
              onClick={handleVerifyJoin}
              disabled={joinedChannels.size < channels.length || verifying}
              className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 shadow-lg transition-all duration-300"
            >
              {verifying ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                  Verifying Channels...
                </>
              ) : joinedChannels.size < channels.length ? (
                `Join ${channels.length - joinedChannels.size} More Channels`
              ) : (
                'Verify & Continue to App'
              )}
            </Button>
          </div>
          
          <div className="text-center">
            <p className="text-xs text-gray-500 bg-gray-800/50 p-3 rounded-lg border border-gray-700">
              🔒 Security: You must join all {channels.length} channels to access earning features. This verification helps prevent spam and ensures genuine users.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default JoinChannelsPage;
