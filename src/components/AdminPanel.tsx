
// Admin Panel Component (for reference - not part of main UI)
// This would be accessible only to admin Telegram ID: 7390932497

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { googleSheetsService } from '../utils/googleSheets';

const AdminPanel: React.FC = () => {
  const [withdrawalRequests, setWithdrawalRequests] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({});
  const [userStats, setUserStats] = useState<any[]>([]);

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    try {
      // Load withdrawal requests
      const withdrawals = await googleSheetsService.getSheetData('Withdrawals!A:Z');
      setWithdrawalRequests(withdrawals.filter((w: any) => w[3] === 'pending'));

      // Load settings
      const appSettings = await googleSheetsService.getSettings();
      setSettings(appSettings);

      // Load user stats
      const users = await googleSheetsService.getSheetData('Users!A:Z');
      setUserStats(users);
    } catch (error) {
      console.error('Error loading admin data:', error);
    }
  };

  const handleWithdrawalApproval = async (withdrawalId: string, action: 'approve' | 'reject') => {
    try {
      // Update withdrawal status in Google Sheets
      console.log(`${action} withdrawal ${withdrawalId}`);
      
      // Refresh data
      loadAdminData();
    } catch (error) {
      console.error('Error updating withdrawal:', error);
    }
  };

  const updateSetting = async (key: string, value: string) => {
    try {
      // Update setting in Google Sheets
      console.log(`Update setting ${key}: ${value}`);
      
      setSettings((prev: any) => ({ ...prev, [key]: value }));
    } catch (error) {
      console.error('Error updating setting:', error);
    }
  };

  return (
    <div className="p-4 space-y-6 bg-gray-900 min-h-screen text-white">
      <h1 className="text-2xl font-bold">Admin Panel</h1>
      
      {/* Withdrawal Requests */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Pending Withdrawals</CardTitle>
        </CardHeader>
        <CardContent>
          {withdrawalRequests.map((request: any, index: number) => (
            <div key={index} className="flex justify-between items-center p-3 bg-gray-700 rounded mb-2">
              <div>
                <p className="text-white">User: {request[0]}</p>
                <p className="text-gray-400">Amount: ${request[1]}</p>
                <p className="text-gray-400">Binance ID: {request[2]}</p>
              </div>
              <div className="space-x-2">
                <Button 
                  size="sm" 
                  className="bg-green-600"
                  onClick={() => handleWithdrawalApproval(request[0], 'approve')}
                >
                  Approve
                </Button>
                <Button 
                  size="sm" 
                  variant="destructive"
                  onClick={() => handleWithdrawalApproval(request[0], 'reject')}
                >
                  Reject
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Settings */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">App Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-white">Ad Reward Rate</label>
            <Input
              value={settings.adRewardRate || '0.05'}
              onChange={(e) => updateSetting('adRewardRate', e.target.value)}
              className="bg-gray-700 border-gray-600 text-white"
            />
          </div>
          
          <div>
            <label className="text-white">Referral Rate (%)</label>
            <Input
              value={settings.referralRate || '10'}
              onChange={(e) => updateSetting('referralRate', e.target.value)}
              className="bg-gray-700 border-gray-600 text-white"
            />
          </div>
          
          <div>
            <label className="text-white">Min Withdrawal</label>
            <Input
              value={settings.minWithdrawal || '1.0'}
              onChange={(e) => updateSetting('minWithdrawal', e.target.value)}
              className="bg-gray-700 border-gray-600 text-white"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminPanel;
