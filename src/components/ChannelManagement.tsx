
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Upload, ExternalLink, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { channelService, Channel } from '@/services/channelService';

const ChannelManagement = () => {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingChannel, setEditingChannel] = useState<Channel | null>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    url: '',
    description: '',
    subscribers_count: '',
    is_active: true,
    display_order: 0,
    logo_url: ''
  });

  useEffect(() => {
    loadChannels();
  }, []);

  const loadChannels = async () => {
    try {
      setLoading(true);
      const allChannels = await channelService.getAllChannels();
      setChannels(allChannels);
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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File",
        description: "Please select an image file",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive"
      });
      return;
    }

    try {
      setUploading(true);
      const logoUrl = await channelService.uploadChannelLogo(file);
      
      if (logoUrl) {
        setFormData(prev => ({ ...prev, logo_url: logoUrl }));
        toast({
          title: "Success",
          description: "Logo uploaded successfully",
        });
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload logo. Please try again.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.url.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in channel name and URL",
        variant: "destructive"
      });
      return;
    }

    try {
      let success = false;
      
      if (editingChannel) {
        success = await channelService.updateChannel(editingChannel.id, formData);
      } else {
        success = await channelService.createChannel(formData);
      }

      if (success) {
        toast({
          title: "Success",
          description: `Channel ${editingChannel ? 'updated' : 'created'} successfully`,
        });
        setDialogOpen(false);
        resetForm();
        loadChannels();
      } else {
        throw new Error('Operation failed');
      }
    } catch (error) {
      console.error('Error saving channel:', error);
      toast({
        title: "Error",
        description: `Failed to ${editingChannel ? 'update' : 'create'} channel`,
        variant: "destructive"
      });
    }
  };

  const handleEdit = (channel: Channel) => {
    setEditingChannel(channel);
    setFormData({
      name: channel.name,
      url: channel.url,
      description: channel.description || '',
      subscribers_count: channel.subscribers_count || '',
      is_active: channel.is_active,
      display_order: channel.display_order || 0,
      logo_url: channel.logo_url || ''
    });
    setDialogOpen(true);
  };

  const handleDelete = async (channel: Channel) => {
    if (!confirm(`Are you sure you want to delete "${channel.name}"?`)) return;

    try {
      const success = await channelService.deleteChannel(channel.id);
      
      if (success) {
        // Delete logo if exists
        if (channel.logo_url) {
          await channelService.deleteChannelLogo(channel.logo_url);
        }
        
        toast({
          title: "Success",
          description: "Channel deleted successfully",
        });
        loadChannels();
      } else {
        throw new Error('Delete failed');
      }
    } catch (error) {
      console.error('Error deleting channel:', error);
      toast({
        title: "Error",
        description: "Failed to delete channel",
        variant: "destructive"
      });
    }
  };

  const handleToggleStatus = async (channel: Channel) => {
    try {
      const success = await channelService.toggleChannelStatus(channel.id, !channel.is_active);
      
      if (success) {
        toast({
          title: "Success",
          description: `Channel ${!channel.is_active ? 'activated' : 'deactivated'}`,
        });
        loadChannels();
      } else {
        throw new Error('Toggle failed');
      }
    } catch (error) {
      console.error('Error toggling channel status:', error);
      toast({
        title: "Error",
        description: "Failed to toggle channel status",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      url: '',
      description: '',
      subscribers_count: '',
      is_active: true,
      display_order: 0,
      logo_url: ''
    });
    setEditingChannel(null);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    resetForm();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center">
            <Users className="w-5 h-5 mr-2" />
            Channel Management
          </CardTitle>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Channel
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingChannel ? 'Edit Channel' : 'Add New Channel'}
                </DialogTitle>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Channel Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="bg-gray-700 border-gray-600 text-white"
                    placeholder="Enter channel name"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="url">Channel URL *</Label>
                  <Input
                    id="url"
                    value={formData.url}
                    onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                    className="bg-gray-700 border-gray-600 text-white"
                    placeholder="https://t.me/channelname"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="bg-gray-700 border-gray-600 text-white"
                    placeholder="Brief description of the channel"
                    rows={2}
                  />
                </div>
                
                <div>
                  <Label htmlFor="subscribers">Subscribers Count</Label>
                  <Input
                    id="subscribers"
                    value={formData.subscribers_count}
                    onChange={(e) => setFormData(prev => ({ ...prev, subscribers_count: e.target.value }))}
                    className="bg-gray-700 border-gray-600 text-white"
                    placeholder="e.g., 10K+"
                  />
                </div>
                
                <div>
                  <Label htmlFor="logo">Channel Logo</Label>
                  <div className="space-y-2">
                    <Input
                      id="logo"
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="bg-gray-700 border-gray-600 text-white"
                      disabled={uploading}
                    />
                    {uploading && <p className="text-sm text-blue-400">Uploading...</p>}
                    {formData.logo_url && (
                      <div className="flex items-center space-x-2">
                        <img src={formData.logo_url} alt="Logo preview" className="w-8 h-8 rounded" />
                        <span className="text-sm text-green-400">Logo uploaded</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="order">Display Order</Label>
                    <Input
                      id="order"
                      type="number"
                      value={formData.display_order}
                      onChange={(e) => setFormData(prev => ({ ...prev, display_order: parseInt(e.target.value) || 0 }))}
                      className="bg-gray-700 border-gray-600 text-white"
                      min="0"
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2 mt-6">
                    <Switch
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                    />
                    <Label>Active</Label>
                  </div>
                </div>
                
                <div className="flex space-x-2 pt-4">
                  <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700">
                    {editingChannel ? 'Update' : 'Create'} Channel
                  </Button>
                  <Button type="button" variant="outline" onClick={handleDialogClose} className="border-gray-600">
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {channels.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No channels found. Add your first channel!</p>
            </div>
          ) : (
            channels.map((channel) => (
              <div key={channel.id} className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {/* Channel Logo */}
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-600">
                      {channel.logo_url ? (
                        <img src={channel.logo_url} alt={channel.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                          <span className="text-white font-bold">{channel.name.charAt(0)}</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Channel Info */}
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="text-white font-semibold">{channel.name}</h3>
                        <Badge variant={channel.is_active ? "default" : "secondary"}>
                          {channel.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <p className="text-gray-400 text-sm">{channel.description}</p>
                      <div className="flex items-center space-x-4 mt-1">
                        <a href={channel.url} target="_blank" rel="noopener noreferrer" 
                           className="text-blue-400 hover:text-blue-300 text-sm flex items-center">
                          <ExternalLink className="w-3 h-3 mr-1" />
                          Visit Channel
                        </a>
                        {channel.subscribers_count && (
                          <span className="text-gray-500 text-sm">{channel.subscribers_count}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleToggleStatus(channel)}
                      className="border-gray-600 hover:bg-gray-600"
                    >
                      {channel.is_active ? 'Disable' : 'Enable'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(channel)}
                      className="border-gray-600 hover:bg-gray-600"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(channel)}
                      className="border-red-600 text-red-400 hover:bg-red-900/20"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ChannelManagement;
