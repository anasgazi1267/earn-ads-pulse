
// Google Sheets API integration utility
// This would connect to your Google Sheets API

interface GoogleSheetsConfig {
  apiKey: string;
  spreadsheetId: string;
  ranges: {
    users: string;
    ads: string;
    withdrawals: string;
    settings: string;
  };
}

// Configuration - these would come from environment variables in production
const config: GoogleSheetsConfig = {
  apiKey: 'YOUR_GOOGLE_SHEETS_API_KEY', // Replace with actual API key
  spreadsheetId: 'YOUR_SPREADSHEET_ID', // Replace with actual spreadsheet ID
  ranges: {
    users: 'Users!A:Z',
    ads: 'Ads!A:Z',
    withdrawals: 'Withdrawals!A:Z',
    settings: 'Settings!A:Z'
  }
};

class GoogleSheetsService {
  private baseUrl = 'https://sheets.googleapis.com/v4/spreadsheets';

  async getSheetData(range: string) {
    try {
      const url = `${this.baseUrl}/${config.spreadsheetId}/values/${range}?key=${config.apiKey}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data.values || [];
    } catch (error) {
      console.error('Error fetching sheet data:', error);
      return [];
    }
  }

  async appendToSheet(range: string, values: any[][]) {
    try {
      const url = `${this.baseUrl}/${config.spreadsheetId}/values/${range}:append?valueInputOption=RAW&key=${config.apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: values
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error appending to sheet:', error);
      throw error;
    }
  }

  // Get user data
  async getUserData(userId: string) {
    const users = await this.getSheetData(config.ranges.users);
    return users.find((user: any) => user[0] === userId);
  }

  // Get ads data
  async getAds() {
    return await this.getSheetData(config.ranges.ads);
  }

  // Submit withdrawal request
  async submitWithdrawal(userId: string, amount: number, binancePayId: string) {
    const timestamp = new Date().toISOString();
    const withdrawalData = [
      [userId, amount, binancePayId, 'pending', timestamp]
    ];
    
    return await this.appendToSheet(config.ranges.withdrawals, withdrawalData);
  }

  // Get app settings
  async getSettings() {
    const settings = await this.getSheetData(config.ranges.settings);
    const settingsObj: any = {};
    
    settings.forEach((setting: any) => {
      if (setting[0] && setting[1]) {
        settingsObj[setting[0]] = setting[1];
      }
    });
    
    return settingsObj;
  }

  // Update user stats
  async updateUserStats(userId: string, stats: any) {
    // This would update user data in the sheet
    console.log('Updating user stats:', userId, stats);
    // Implementation would depend on your sheet structure
  }

  // Check channel membership (this would typically be done via Telegram Bot API)
  async checkChannelMembership(userId: string, channelUsernames: string[]) {
    // This would call your Telegram bot to check channel membership
    // For now, returning mock data
    return {
      hasJoined: true, // In production, this would be actual verification
      channels: channelUsernames.map(channel => ({ channel, joined: true }))
    };
  }
}

export const googleSheetsService = new GoogleSheetsService();

// Helper functions for local storage fallback during development
export const localStorageService = {
  getUserStats: (userId: string) => {
    const stats = localStorage.getItem(`user_stats_${userId}`);
    return stats ? JSON.parse(stats) : {
      balance: 0,
      adsWatched: 0,
      spinsUsed: 0,
      referrals: 0,
      totalEarnings: 0
    };
  },

  updateUserStats: (userId: string, stats: any) => {
    localStorage.setItem(`user_stats_${userId}`, JSON.stringify(stats));
  },

  getWithdrawals: (userId: string) => {
    const withdrawals = localStorage.getItem(`withdrawals_${userId}`);
    return withdrawals ? JSON.parse(withdrawals) : [];
  },

  addWithdrawal: (userId: string, withdrawal: any) => {
    const withdrawals = localStorageService.getWithdrawals(userId);
    withdrawals.unshift(withdrawal);
    localStorage.setItem(`withdrawals_${userId}`, JSON.stringify(withdrawals));
  }
};
