# Ads by USDT Earn - Telegram Mini App

A professional Telegram Mini App for earning USDT by watching advertisements and spinning a reward wheel.

## Features

### 🔐 Channel Verification System
- Users must join 4 required Telegram channels before accessing the app
- Blocking page prevents access until all channels are joined
- Real-time verification (requires Telegram Bot API integration)

### 📱 Core Pages
1. **Home Page** - Welcome message, balance display, and daily statistics
2. **Ad Viewer** - Watch ads with 15-second countdown timer and "Earn Now" button
3. **Spin Wheel** - 30 daily spins based on ad views with various USDT rewards
4. **Referral System** - Share referral links and earn 10% from friend's earnings
5. **Withdrawal Page** - Request withdrawals to Binance Pay with admin approval

### 🎨 Design Features
- Mobile-first responsive design
- Dark theme with professional UI
- Sticky bottom navigation with icons
- Smooth animations and transitions
- High contrast for accessibility

### ⚙️ Technical Features
- Google Sheets API integration for dynamic content
- Local storage fallback for development
- Telegram Web App integration
- Admin panel for managing withdrawals and settings
- Real-time stats tracking

## Required Telegram Channels
1. https://t.me/AnasEarnHunter
2. https://t.me/ExpossDark
3. https://t.me/TechnicalAnas
4. https://t.me/Anas_Promotion

## Setup Instructions

### 1. Google Sheets Setup
Create a Google Spreadsheet with the following sheets:
- **Users**: Store user data and statistics
- **Ads**: Store advertisement content and links
- **Withdrawals**: Track withdrawal requests and status
- **Settings**: App configuration (rates, limits, etc.)

### 2. Google Sheets API
1. Enable Google Sheets API in Google Cloud Console
2. Create credentials and get API key
3. Update `src/utils/googleSheets.ts` with your API key and spreadsheet ID

### 3. Telegram Bot Setup
1. Create a Telegram Bot via @BotFather
2. Set up webhook for channel membership verification
3. Update channel verification logic in the app

### 4. Environment Configuration
Update the following in `src/utils/googleSheets.ts`:
```typescript
const config = {
  apiKey: 'YOUR_GOOGLE_SHEETS_API_KEY',
  spreadsheetId: 'YOUR_SPREADSHEET_ID',
  // ... other config
};
```

### 5. Deploy to Telegram
1. Deploy the app to Netlify, Vercel, or similar platform
2. Set up your Telegram Mini App in @BotFather
3. Configure the Mini App URL to your deployed app

## Admin Features
- Admin Telegram ID: 7390932497
- Approve/reject withdrawal requests
- Modify earning rates and limits
- View user statistics
- Manage app settings via Google Sheets

## Development
```bash
npm install
npm run dev
```

## Production Deployment
```bash
npm run build
# Deploy dist folder to your hosting platform
```

## File Structure
```
src/
├── components/           # React components
│   ├── HomePage.tsx     # Main dashboard
│   ├── AdViewerPage.tsx # Ad watching interface
│   ├── SpinPage.tsx     # Reward wheel
│   ├── ReferralPage.tsx # Referral system
│   ├── WithdrawPage.tsx # Withdrawal interface
│   └── ...
├── utils/
│   └── googleSheets.ts  # Google Sheets integration
└── pages/
    └── Index.tsx        # Main app component
```

## Features Breakdown

### Ad System
- 30 ads per day limit
- 15-second countdown timer
- Dynamic content from Google Sheets
- Support for image and HTML ads
- Automatic earnings calculation

### Spin Wheel
- 30 spins per day (based on ad views)
- 8 different reward tiers
- Smooth animation with 3-second duration
- Fair randomization system

### Referral System
- Unique referral links per user
- 10% commission from referrals
- Real-time earnings tracking
- Social sharing integration

### Withdrawal System
- Minimum withdrawal: $1.00 USDT
- Binance Pay integration
- Admin approval required
- 24-48 hour processing time
- Complete withdrawal history

## Security Notes
- All sensitive operations require admin approval
- Local storage used for development/fallback
- Production requires proper API security
- Channel membership verification via Telegram Bot API

## Support
For technical support or questions about setup, please refer to the documentation or contact the development team.
