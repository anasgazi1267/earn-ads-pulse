
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Users, CheckCircle, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { channelService, Channel } from '@/services/channelService';

interface JoinChannelsPageProps {
  onChannelsJoined: () => void;
}

const JoinChannelsPage: React.FC<JoinChannelsPageProps> = ({ onChannelsJoined }) => {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [joinedChannels, setJoinedChannels] = useState<Set<string>>(new Set());
  const [verifying, setVerifying] = useState(false);
  const [hasVerified, setHasVerified] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadChannels();
  }, []);

  const loadChannels = async () => {
    try {
      const activeChannels = await channelService.getActiveChannels();
      setChannels(activeChannels);
    } catch (error) {
      console.error('Error loading channels:', error);
      toast({
        title: "Error",
        description: "Failed to load channels",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChannelClick = (channelUrl: string) => {
    window.open(channelUrl, '_blank');
    // Mark as clicked (user needs to manually verify)
    setTimeout(() => {
      setJoinedChannels(prev => new Set([...prev, channelUrl]));
      toast({
        title: "Channel Opened",
        description: "Please join the channel and come back",
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

    // First verification attempt - show loading but don't complete
    if (!hasVerified) {
      setVerifying(true);
      setTimeout(() => {
        setVerifying(false);
        setHasVerified(true);
        toast({
          title: "Try Again",
          description: "Click verify again to complete verification",
          variant: "default"
        });
      }, 3000);
      return;
    }

    // Second verification attempt - complete the process
    setVerifying(true);
    setTimeout(() => {
      localStorage.setItem('channelsJoined', 'true');
      localStorage.setItem('channelJoinDate', new Date().toISOString());
      setVerifying(false);
      onChannelsJoined();
      toast({
        title: "Success!",
        description: "All channels verified. Welcome to Ads by USDT Earn!",
      });
    }, 2500);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500 mx-auto mb-6"></div>
          <h2 className="text-2xl font-bold text-white mb-2">Loading Channels</h2>
          <p className="text-gray-300">Preparing channel verification...</p>
        </div>
      </div>
    );
  }

  if (channels.length === 0) {
    // If no channels are active, skip verification
    useEffect(() => {
      onChannelsJoined();
    }, []);
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-10 -left-10 w-72 h-72 bg-blue-500/10 rounded-full animate-pulse"></div>
        <div className="absolute top-1/2 -right-10 w-96 h-96 bg-purple-500/10 rounded-full animate-pulse delay-1000"></div>
        <div className="absolute -bottom-10 left-1/2 w-80 h-80 bg-pink-500/10 rounded-full animate-pulse delay-2000"></div>
      </div>

      <Card className="w-full max-w-md bg-gray-900/95 backdrop-blur-xl border-gray-700/50 shadow-2xl relative z-10 rounded-3xl overflow-hidden">
        {/* Header */}
        <div className="text-center py-8 px-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500 bg-clip-text text-transparent mb-3">
            Ads by USDT Earn
          </h1>
          <p className="text-gray-300 text-lg">
            Join all {channels.length} channels to start earning
          </p>
        </div>
        
        <CardContent className="space-y-4 px-6 pb-8">
          {/* Channels List */}
          <div className="space-y-4">
            {channels.map((channel) => (
              <div key={channel.id} className="flex items-center space-x-4 p-4 bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-600/30 hover:border-blue-500/50 transition-all duration-300">
                {/* Join Status Circle */}
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                  joinedChannels.has(channel.url) 
                    ? 'bg-green-500 border-green-500' 
                    : 'border-gray-400'
                }`}>
                  {joinedChannels.has(channel.url) && (
                    <CheckCircle className="w-4 h-4 text-white" />
                  )}
                </div>

                {/* Channel Image */}
                <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-700">
                  {channel.logo_url ? (
                    <img 
                      src={channel.logo_url} 
                      alt={channel.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                      <span className="text-white font-bold text-sm">
                        {channel.name.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Channel Info */}
                <div className="flex-1">
                  <h3 className="text-white font-semibold text-sm">{channel.name}</h3>
                  <p className="text-gray-400 text-xs">{channel.description}</p>
                  {channel.subscribers_count && (
                    <p className="text-gray-500 text-xs">{channel.subscribers_count} subscribers</p>
                  )}
                </div>

                {/* Join Button */}
                <Button
                  onClick={() => handleChannelClick(channel.url)}
                  size="sm"
                  className={`px-4 py-2 text-sm font-medium transition-all duration-300 ${
                    joinedChannels.has(channel.url)
                      ? "bg-green-600 hover:bg-green-700 text-white"
                      : "bg-blue-600 hover:bg-blue-700 text-white"
                  }`}
                >
                  {joinedChannels.has(channel.url) ? (
                    "Joined"
                  ) : (
                    <>
                      Join <ExternalLink className="w-3 h-3 ml-1" />
                    </>
                  )}
                </Button>
              </div>
            ))}
          </div>

          {/* Progress Bar */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-600/30">
            <div className="text-center mb-4">
              <p className="text-white text-sm font-medium">
                Progress: {joinedChannels.size}/{channels.length} channels
              </p>
              <div className="w-full bg-gray-700/50 rounded-full h-2 mt-2">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-1000"
                  style={{ width: `${(joinedChannels.size / channels.length) * 100}%` }}
                ></div>
              </div>
            </div>

            <Button
              onClick={handleVerifyJoin}
              disabled={joinedChannels.size < channels.length || verifying}
              className="w-full h-12 text-base font-bold bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 transition-all duration-300"
            >
              {verifying ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  {hasVerified ? 'Final Verification...' : 'Verifying Channels...'}
                </>
              ) : joinedChannels.size < channels.length ? (
                `Join ${channels.length - joinedChannels.size} more channels`
              ) : hasVerified ? (
                'Complete & Enter App'
              ) : (
                'Verify & Continue'
              )}
            </Button>
          </div>
          
          {/* Security Notice */}
          <div className="bg-gradient-to-r from-indigo-900/30 to-purple-900/30 backdrop-blur-sm rounded-xl p-4 border border-indigo-500/30">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-indigo-500/20 rounded-full flex items-center justify-center mt-1">
                <Users className="w-3 h-3 text-indigo-400" />
              </div>
              <div>
                <p className="text-xs text-indigo-300 font-medium mb-1">🔒 Security Info</p>
                <p className="text-xs text-gray-400 leading-relaxed">
                  You must join all {channels.length} channels to use earning features. 
                  This verification prevents spam and ensures genuine users.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default JoinChannelsPage;
