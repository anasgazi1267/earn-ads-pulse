import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Save, Trash2, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { dbService } from '@/services/database';

interface HtmlAd {
  id: string;
  name: string;
  html_code: string;
  position: 'header' | 'footer' | 'sidebar' | 'floating' | 'banner';
  is_active: boolean;
  display_order: number;
}

const HtmlAdManager: React.FC = () => {
  const [ads, setAds] = useState<HtmlAd[]>([]);
  const [newAd, setNewAd] = useState({
    name: '',
    html_code: '',
    position: 'banner' as HtmlAd['position'],
    display_order: 1
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadHtmlAds();
  }, []);

  const loadHtmlAds = async () => {
    try {
      const htmlAds = await dbService.getAdminSetting('html_ads');
      if (htmlAds) {
        setAds(JSON.parse(htmlAds));
      }
    } catch (error) {
      console.error('Error loading HTML ads:', error);
    }
  };

  const saveHtmlAds = async (updatedAds: HtmlAd[]) => {
    try {
      await dbService.updateAdminSetting('html_ads', JSON.stringify(updatedAds));
      setAds(updatedAds);
      toast({
        title: "HTML ads updated",
        description: "Changes saved successfully",
      });
    } catch (error) {
      console.error('Error saving HTML ads:', error);
      toast({
        title: "Error",
        description: "Failed to save changes",
        variant: "destructive"
      });
    }
  };

  const addHtmlAd = async () => {
    if (!newAd.name || !newAd.html_code) {
      toast({
        title: "Missing information",
        description: "Please fill in name and HTML code",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const adToAdd: HtmlAd = {
        id: Date.now().toString(),
        name: newAd.name,
        html_code: newAd.html_code,
        position: newAd.position,
        is_active: true,
        display_order: newAd.display_order
      };

      const updatedAds = [...ads, adToAdd].sort((a, b) => a.display_order - b.display_order);
      await saveHtmlAds(updatedAds);

      setNewAd({
        name: '',
        html_code: '',
        position: 'banner',
        display_order: 1
      });
    } catch (error) {
      console.error('Error adding HTML ad:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleAdStatus = async (adId: string) => {
    const updatedAds = ads.map(ad =>
      ad.id === adId ? { ...ad, is_active: !ad.is_active } : ad
    );
    await saveHtmlAds(updatedAds);
  };

  const deleteHtmlAd = async (adId: string) => {
    const updatedAds = ads.filter(ad => ad.id !== adId);
    await saveHtmlAds(updatedAds);
  };

  const updateAdOrder = async (adId: string, newOrder: number) => {
    const updatedAds = ads.map(ad =>
      ad.id === adId ? { ...ad, display_order: newOrder } : ad
    ).sort((a, b) => a.display_order - b.display_order);
    await saveHtmlAds(updatedAds);
  };

  const positionColors = {
    header: 'bg-blue-500',
    footer: 'bg-green-500',
    sidebar: 'bg-purple-500',
    floating: 'bg-orange-500',
    banner: 'bg-red-500'
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">HTML Ad Manager</h2>
        <Badge variant="secondary" className="bg-blue-600/20 text-blue-400">
          {ads.filter(ad => ad.is_active).length} Active Ads
        </Badge>
      </div>

      {/* Add New HTML Ad */}
      <Card className="bg-gray-800/50 backdrop-blur-xl border-gray-700/50">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Plus className="w-5 h-5 mr-2" />
            Add New HTML Ad
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-gray-300">Ad Name</Label>
              <Input
                placeholder="Enter ad name"
                value={newAd.name}
                onChange={(e) => setNewAd({ ...newAd, name: e.target.value })}
                className="bg-gray-700/50 border-gray-600 text-white"
              />
            </div>
            <div>
              <Label className="text-gray-300">Position</Label>
              <select
                value={newAd.position}
                onChange={(e) => setNewAd({ ...newAd, position: e.target.value as HtmlAd['position'] })}
                className="w-full p-2 bg-gray-700/50 border border-gray-600 rounded-md text-white"
              >
                <option value="banner">Banner</option>
                <option value="header">Header</option>
                <option value="footer">Footer</option>
                <option value="sidebar">Sidebar</option>
                <option value="floating">Floating</option>
              </select>
            </div>
          </div>

          <div>
            <Label className="text-gray-300">Display Order</Label>
            <Input
              type="number"
              placeholder="1"
              value={newAd.display_order}
              onChange={(e) => setNewAd({ ...newAd, display_order: parseInt(e.target.value) || 1 })}
              className="bg-gray-700/50 border-gray-600 text-white"
            />
          </div>

          <div>
            <Label className="text-gray-300">HTML Code</Label>
            <Textarea
              placeholder="Paste your HTML ad code here..."
              value={newAd.html_code}
              onChange={(e) => setNewAd({ ...newAd, html_code: e.target.value })}
              className="bg-gray-700/50 border-gray-600 text-white min-h-[120px]"
            />
          </div>

          <Button
            onClick={addHtmlAd}
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600"
          >
            {loading ? "Adding..." : "Add HTML Ad"}
          </Button>
        </CardContent>
      </Card>

      {/* Existing HTML Ads */}
      <div className="space-y-4">
        {ads.length === 0 ? (
          <Card className="bg-gray-800/50 backdrop-blur-xl border-gray-700/50">
            <CardContent className="p-8 text-center">
              <p className="text-gray-400">No HTML ads configured yet</p>
            </CardContent>
          </Card>
        ) : (
          ads.map((ad) => (
            <Card key={ad.id} className="bg-gray-800/50 backdrop-blur-xl border-gray-700/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <h3 className="text-white font-semibold">{ad.name}</h3>
                    <Badge className={`${positionColors[ad.position]} text-white`}>
                      {ad.position.toUpperCase()}
                    </Badge>
                    <Badge variant={ad.is_active ? "default" : "secondary"}>
                      Order: {ad.display_order}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleAdStatus(ad.id)}
                      className="border-gray-600 text-gray-300"
                    >
                      {ad.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteHtmlAd(ad.id)}
                      className="border-red-600 text-red-400 hover:bg-red-600/20"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <Label className="text-gray-300 text-sm">HTML Code Preview:</Label>
                    <div className="bg-gray-900/50 p-3 rounded border border-gray-600 text-xs">
                      <code className="text-gray-300 break-all">
                        {ad.html_code.substring(0, 200)}
                        {ad.html_code.length > 200 && '...'}
                      </code>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-300 text-sm">Display Order</Label>
                      <Input
                        type="number"
                        value={ad.display_order}
                        onChange={(e) => updateAdOrder(ad.id, parseInt(e.target.value) || 1)}
                        className="bg-gray-700/50 border-gray-600 text-white"
                      />
                    </div>
                    <div className="flex items-end">
                      <div className="text-sm">
                        <span className="text-gray-400">Status: </span>
                        <span className={ad.is_active ? "text-green-400" : "text-red-400"}>
                          {ad.is_active ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default HtmlAdManager;
