import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Save, Code, Timer, Monitor } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { dbService } from '@/services/database';

const AdCodeManager = () => {
  const [adSettings, setAdSettings] = useState({
    ad_interval_seconds: '20',
    daily_ad_limit: '100',
    banner_ad_code: '',
    popup_ad_code: '',
    footer_ad_code: '',
    sidebar_ad_code: ''
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadAdSettings();
  }, []);

  const loadAdSettings = async () => {
    try {
      setLoading(true);
      const settings = await dbService.getAdminSettings();
      setAdSettings({
        ad_interval_seconds: settings.ad_interval_seconds || '20',
        daily_ad_limit: settings.daily_ad_limit || '100',
        banner_ad_code: settings.banner_ad_code || '',
        popup_ad_code: settings.popup_ad_code || '',
        footer_ad_code: settings.footer_ad_code || '',
        sidebar_ad_code: settings.sidebar_ad_code || ''
      });
    } catch (error) {
      console.error('Error loading ad settings:', error);
      toast({
        title: "Error",
        description: "Failed to load ad settings",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (key: string, value: string) => {
    try {
      const success = await dbService.updateAdminSetting(key, value);
      if (success) {
        toast({
          title: "Success",
          description: "Ad setting updated successfully",
        });
      } else {
        throw new Error('Update failed');
      }
    } catch (error) {
      console.error('Error updating ad setting:', error);
      toast({
        title: "Error",
        description: "Failed to update ad setting",
        variant: "destructive"
      });
    }
  };

  const handleSaveAll = async () => {
    try {
      const promises = Object.entries(adSettings).map(([key, value]) =>
        dbService.updateAdminSetting(key, value)
      );
      
      await Promise.all(promises);
      
      toast({
        title: "Success",
        description: "All ad settings saved successfully",
      });
    } catch (error) {
      console.error('Error saving ad settings:', error);
      toast({
        title: "Error",
        description: "Failed to save ad settings",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
            <p className="text-gray-400">Loading ad settings...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Ad Timing Control */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Timer className="w-5 h-5 mr-2" />
            Ad Timing Control
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="adInterval" className="text-gray-300 flex items-center space-x-2">
                <Timer className="w-4 h-4" />
                <span>Auto Ad Interval (seconds)</span>
              </Label>
              <div className="flex space-x-2 mt-2">
                <Input
                  id="adInterval"
                  type="number"
                  min="10"
                  max="300"
                  value={adSettings.ad_interval_seconds}
                  onChange={(e) => setAdSettings({...adSettings, ad_interval_seconds: e.target.value})}
                  className="bg-gray-700/50 border-gray-600 text-white"
                />
                <Button 
                  onClick={() => handleSave('ad_interval_seconds', adSettings.ad_interval_seconds)}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Save className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-gray-400 text-sm mt-1">
                How often automatic Monetag ads appear (default: 20 seconds)
              </p>
            </div>

            <div>
              <Label htmlFor="dailyAdLimit" className="text-gray-300 flex items-center space-x-2">
                <Monitor className="w-4 h-4" />
                <span>Daily Ad Limit</span>
              </Label>
              <div className="flex space-x-2 mt-2">
                <Input
                  id="dailyAdLimit"
                  type="number"
                  min="1"
                  max="1000"
                  value={adSettings.daily_ad_limit}
                  onChange={(e) => setAdSettings({...adSettings, daily_ad_limit: e.target.value})}
                  className="bg-gray-700/50 border-gray-600 text-white"
                />
                <Button 
                  onClick={() => handleSave('daily_ad_limit', adSettings.daily_ad_limit)}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Save className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-gray-400 text-sm mt-1">
                Maximum ads users can watch per day (default: 100)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* HTML Ad Codes */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Code className="w-5 h-5 mr-2" />
            HTML Ad Codes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Banner Ad */}
          <div>
            <Label className="text-white">Banner Ad Code</Label>
            <Textarea
              value={adSettings.banner_ad_code}
              onChange={(e) => setAdSettings({
                ...adSettings,
                banner_ad_code: e.target.value
              })}
              className="bg-gray-700 border-gray-600 text-white h-24"
              placeholder="<div>Your banner ad HTML code here</div>"
            />
            <p className="text-gray-400 text-sm mt-1">
              Displays at the top of pages
            </p>
          </div>

          {/* Popup Ad */}
          <div>
            <Label className="text-white">Popup Ad Code (Monetag)</Label>
            <Textarea
              value={adSettings.popup_ad_code}
              onChange={(e) => setAdSettings({
                ...adSettings,
                popup_ad_code: e.target.value
              })}
              className="bg-gray-700 border-gray-600 text-white h-24"
              placeholder="<script>Your Monetag popup ad code</script>"
            />
            <p className="text-gray-400 text-sm mt-1">
              Used in automatic popup ads alternating with Adsgram
            </p>
          </div>

          {/* Footer Ad */}
          <div>
            <Label className="text-white">Footer Ad Code</Label>
            <Textarea
              value={adSettings.footer_ad_code}
              onChange={(e) => setAdSettings({
                ...adSettings,
                footer_ad_code: e.target.value
              })}
              className="bg-gray-700 border-gray-600 text-white h-24"
              placeholder="<div>Your footer ad HTML code here</div>"
            />
            <p className="text-gray-400 text-sm mt-1">
              Displays at the bottom of pages
            </p>
          </div>

          {/* Sidebar Ad */}
          <div>
            <Label className="text-white">Sidebar Ad Code</Label>
            <Textarea
              value={adSettings.sidebar_ad_code}
              onChange={(e) => setAdSettings({
                ...adSettings,
                sidebar_ad_code: e.target.value
              })}
              className="bg-gray-700 border-gray-600 text-white h-24"
              placeholder="<div>Your sidebar ad HTML code here</div>"
            />
            <p className="text-gray-400 text-sm mt-1">
              Displays in sidebar areas (desktop only)
            </p>
          </div>

          <Button
            onClick={handleSaveAll}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            <Save className="w-4 h-4 mr-2" />
            Save All Ad Codes
          </Button>
        </CardContent>
      </Card>

      {/* Preview Section */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Preview & Info</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="text-white font-medium mb-2">Ad Placement Info:</h4>
              <ul className="text-gray-400 space-y-1">
                <li>• Banner: Top of every page</li>
                <li>• Popup: Automatic every {adSettings.ad_interval_seconds}s</li>
                <li>• Footer: Bottom of every page</li>
                <li>• Sidebar: Desktop sidebar areas</li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-medium mb-2">Ad Platforms:</h4>
              <ul className="text-gray-400 space-y-1">
                <li>• Monetag: Custom HTML codes</li>
                <li>• Adsgram: Block ID int-12841</li>
                <li>• Both alternate in popups</li>
                <li>• Users earn $0.001 per ad</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdCodeManager;