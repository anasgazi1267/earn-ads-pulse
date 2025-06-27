
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';

interface JoinChannelsPageProps {
  channels: string[];
  onChannelsJoined: () => void;
}

const JoinChannelsPage: React.FC<JoinChannelsPageProps> = ({ channels, onChannelsJoined }) => {
  const [joinedChannels, setJoinedChannels] = useState<Set<string>>(new Set());

  const handleChannelClick = (channel: string) => {
    window.open(channel, '_blank');
    // Mark as joined (in real app, this would be verified)
    setJoinedChannels(prev => new Set([...prev, channel]));
  };

  const handleContinue = () => {
    if (joinedChannels.size >= channels.length) {
      onChannelsJoined();
    }
  };

  const getChannelName = (url: string) => {
    return url.split('/').pop() || url;
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-gray-800 border-gray-700">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
            <Users className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-white">
            Join Required Channels
          </CardTitle>
          <p className="text-gray-400 mt-2">
            Please join all required channels to continue using Ads by USDT Earn
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {channels.map((channel, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className={`w-4 h-4 rounded-full ${
                  joinedChannels.has(channel) ? 'bg-green-500' : 'bg-gray-500'
                }`} />
                <span className="text-white font-medium">
                  @{getChannelName(channel)}
                </span>
              </div>
              <Button
                onClick={() => handleChannelClick(channel)}
                size="sm"
                variant={joinedChannels.has(channel) ? "secondary" : "default"}
                className={joinedChannels.has(channel) ? "bg-green-600 hover:bg-green-700" : ""}
              >
                {joinedChannels.has(channel) ? 'Joined' : 'Join'}
              </Button>
            </div>
          ))}
          
          <div className="pt-4">
            <Button
              onClick={handleContinue}
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={joinedChannels.size < channels.length}
            >
              {joinedChannels.size < channels.length 
                ? `Join ${channels.length - joinedChannels.size} more channels`
                : 'Continue to App'
              }
            </Button>
          </div>
          
          <p className="text-xs text-gray-500 text-center mt-4">
            You must join all {channels.length} channels to access the earning features
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default JoinChannelsPage;
