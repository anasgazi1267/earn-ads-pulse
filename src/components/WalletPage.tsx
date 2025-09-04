import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Wallet, ArrowUpRight, ArrowDownRight, DollarSign, RefreshCw, CreditCard, Gift, TrendingUp, Coins, ArrowLeft, ArrowRight } from 'lucide-react';
import WithdrawPage from './WithdrawPage';
import DepositPage from './DepositPage';
import { dbService } from '../services/database';
import { useToast } from '@/hooks/use-toast';
import { useAdmin } from '../contexts/AdminContext';

interface WalletPageProps {
  userInfo: any;
  userBalance: number;
  updateUserBalance: (newBalance: number) => void;
  onBack: () => void;
}

const WalletPage: React.FC<WalletPageProps> = ({
  userInfo,
  userBalance,
  updateUserBalance,
  onBack
}) => {
  const [depositBalance, setDepositBalance] = useState(0);
  const [referralCount, setReferralCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [conversionFee, setConversionFee] = useState(0.1);
  const [convertAmount, setConvertAmount] = useState('');
  const { toast } = useToast();
  const { settings, isChannelVerificationEnabled } = useAdmin();

  useEffect(() => {
    loadWalletData();
    loadConversionFee();
  }, [userInfo]);

  const loadWalletData = async () => {
    try {
      if (userInfo?.telegram_id || userInfo?.id) {
        const telegramId = userInfo.telegram_id || userInfo.id;
        const user = await dbService.getUserByTelegramId(telegramId.toString());
        if (user) {
          console.log('💰 Loaded user wallet data:', user);
          setDepositBalance(user.deposit_balance || 0);
          setReferralCount(user.referral_count || 0);
          // Update parent component with fresh balance data
          updateUserBalance(user.balance || 0);
        }
      }
    } catch (error) {
      console.error('Error loading wallet data:', error);
    }
  };

  const loadConversionFee = async () => {
    try {
      const feeString = await dbService.getAdminSetting('conversion_fee_percentage');
      setConversionFee(parseFloat(feeString) || 0.1);
    } catch (error) {
      console.error('Error loading conversion fee:', error);
    }
  };

  const handleConvertBalance = async () => {
    const amount = parseFloat(convertAmount);
    
    if (!amount || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount to convert",
        variant: "destructive"
      });
      return;
    }

    if (amount > userBalance) {
      toast({
        title: "Insufficient Balance",
        description: "You don't have enough earnings balance to convert",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const telegramId = userInfo.telegram_id || userInfo.id;
      const success = await dbService.convertEarningsToDeposit(telegramId.toString(), amount);
      
      if (success) {
        const fee = amount * conversionFee;
        const convertedAmount = amount - fee;
        
        // Reload wallet data to get fresh balances
        await loadWalletData();
        setConvertAmount('');
        
        toast({
          title: "🎉 Conversion Successful!",
          description: `Converted $${amount.toFixed(3)} earnings to deposit balance (fee: $${fee.toFixed(3)})`,
        });
      } else {
        toast({
          title: "❌ Conversion Failed",
          description: "Failed to convert balance. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error converting balance:', error);
      toast({
        title: "❌ Error",
        description: "An error occurred during conversion",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const withdrawalEnabled = isChannelVerificationEnabled 
    ? referralCount >= parseInt(settings.requiredReferrals || '5')
    : true;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white">
      {/* Professional Header */}
      <div className="sticky top-0 z-10 bg-gray-900/95 backdrop-blur-md border-b border-gray-700/50">
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="text-gray-300 hover:text-white hover:bg-gray-800/50 transition-all duration-200"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div className="h-6 w-px bg-gray-600"></div>
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                  <Wallet className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-white">Wallet Dashboard</h1>
                  <p className="text-xs text-gray-400">Manage your earnings & deposits</p>
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadWalletData}
              disabled={loading}
              className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white transition-all duration-200"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Professional Balance Overview */}
      <div className="p-4 space-y-6">
        {/* Main Balance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Earnings Balance */}
          <Card className="relative overflow-hidden bg-gradient-to-br from-emerald-500/10 via-green-600/5 to-green-800/10 border border-emerald-500/20 backdrop-blur-sm hover:shadow-lg hover:shadow-emerald-500/10 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/5 to-transparent"></div>
            <CardContent className="relative p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                    <p className="text-emerald-300 text-sm font-medium">Available Earnings</p>
                  </div>
                  <p className="text-3xl font-bold text-white tracking-tight">${userBalance.toFixed(3)}</p>
                  <p className="text-emerald-400 text-xs flex items-center space-x-1">
                    <TrendingUp className="w-3 h-3" />
                    <span>Ready to convert</span>
                  </p>
                </div>
                <div className="p-4 bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 rounded-2xl">
                  <Coins className="w-7 h-7 text-emerald-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Deposit Balance */}
          <Card className="relative overflow-hidden bg-gradient-to-br from-blue-500/10 via-blue-600/5 to-blue-800/10 border border-blue-500/20 backdrop-blur-sm hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400/5 to-transparent"></div>
            <CardContent className="relative p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                    <p className="text-blue-300 text-sm font-medium">Deposit Balance</p>
                  </div>
                  <p className="text-3xl font-bold text-white tracking-tight">${depositBalance.toFixed(3)}</p>
                  <p className="text-blue-400 text-xs flex items-center space-x-1">
                    <ArrowUpRight className="w-3 h-3" />
                    <span>Withdrawal ready</span>
                  </p>
                </div>
                <div className="p-4 bg-gradient-to-br from-blue-500/20 to-blue-600/10 rounded-2xl">
                  <CreditCard className="w-7 h-7 text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Portfolio Value */}
          <Card className="relative overflow-hidden bg-gradient-to-br from-purple-500/10 via-purple-600/5 to-purple-800/10 border border-purple-500/20 backdrop-blur-sm hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-400/5 to-transparent"></div>
            <CardContent className="relative p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                    <p className="text-purple-300 text-sm font-medium">Total Portfolio</p>
                  </div>
                  <p className="text-3xl font-bold text-white tracking-tight">${(userBalance + depositBalance).toFixed(3)}</p>
                  <p className="text-purple-400 text-xs flex items-center space-x-1">
                    <Gift className="w-3 h-3" />
                    <span>Combined value</span>
                  </p>
                </div>
                <div className="p-4 bg-gradient-to-br from-purple-500/20 to-purple-600/10 rounded-2xl">
                  <Wallet className="w-7 h-7 text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Advanced Balance Conversion System */}
        <Card className="relative overflow-hidden bg-gradient-to-br from-orange-500/10 via-amber-600/5 to-yellow-800/10 border border-orange-500/20 backdrop-blur-sm">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-400/5 to-transparent"></div>
          <CardHeader className="relative">
            <CardTitle className="text-white flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-orange-500 to-amber-600 rounded-lg">
                <ArrowRight className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-lg font-bold">Earnings Balance Converter</span>
                <p className="text-orange-300 text-sm font-normal">Convert your earnings to withdrawable deposit balance</p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="relative space-y-6">
            {/* Conversion Form */}
            <div className="bg-gray-800/40 rounded-xl p-6 border border-gray-700/50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label className="text-gray-300 text-sm font-medium flex items-center space-x-2">
                    <Coins className="w-4 h-4 text-orange-400" />
                    <span>Amount to Convert (USDT)</span>
                  </Label>
                  <div className="relative">
                    <Input
                      type="number"
                      value={convertAmount}
                      onChange={(e) => setConvertAmount(e.target.value)}
                      placeholder="0.000"
                      className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 text-lg font-medium pl-12 h-12 focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500"
                      step="0.001"
                      max={userBalance}
                    />
                    <DollarSign className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Available: ${userBalance.toFixed(3)}</span>
                    <button
                      onClick={() => setConvertAmount(userBalance.toString())}
                      className="text-orange-400 hover:text-orange-300 transition-colors"
                    >
                      Use Max
                    </button>
                  </div>
                </div>
                
                <div className="flex flex-col justify-center">
                  <Button
                    onClick={handleConvertBalance}
                    disabled={loading || !convertAmount || parseFloat(convertAmount) <= 0 || parseFloat(convertAmount) > userBalance}
                    className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-orange-500/25 h-12"
                  >
                    {loading ? (
                      <div className="flex items-center space-x-2">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Converting...</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <ArrowRight className="w-4 h-4" />
                        <span>Convert Now</span>
                      </div>
                    )}
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Conversion Preview */}
            {convertAmount && parseFloat(convertAmount) > 0 && parseFloat(convertAmount) <= userBalance && (
              <div className="bg-gradient-to-r from-gray-800/60 to-gray-700/60 rounded-xl p-6 border border-gray-600/50">
                <h4 className="text-white font-bold text-lg mb-4 flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                  <span>Conversion Preview</span>
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
                    <p className="text-gray-400 text-xs mb-1">Converting Amount</p>
                    <p className="text-white font-bold text-lg">${parseFloat(convertAmount).toFixed(3)}</p>
                  </div>
                  <div className="bg-red-500/10 rounded-lg p-4 border border-red-500/30">
                    <p className="text-red-300 text-xs mb-1">Platform Fee ({(conversionFee * 100).toFixed(1)}%)</p>
                    <p className="text-red-400 font-bold text-lg">-${(parseFloat(convertAmount) * conversionFee).toFixed(3)}</p>
                  </div>
                  <div className="bg-green-500/10 rounded-lg p-4 border border-green-500/30">
                    <p className="text-green-300 text-xs mb-1">You'll Receive</p>
                    <p className="text-green-400 font-bold text-lg">${(parseFloat(convertAmount) * (1 - conversionFee)).toFixed(3)}</p>
                  </div>
                  <div className="bg-blue-500/10 rounded-lg p-4 border border-blue-500/30">
                    <p className="text-blue-300 text-xs mb-1">Remaining Earnings</p>
                    <p className="text-blue-400 font-bold text-lg">${(userBalance - parseFloat(convertAmount)).toFixed(3)}</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Professional Wallet Operations */}
        <Card className="bg-gray-800/50 backdrop-blur-xl border-gray-700/50">
          <CardHeader>
            <CardTitle className="text-white flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                <CreditCard className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-lg font-bold">Wallet Operations</span>
                <p className="text-blue-300 text-sm font-normal">Deposit funds or withdraw your balance</p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="deposit" className="space-y-6">
              <TabsList className="grid w-full grid-cols-2 bg-gray-700/50 border border-gray-600/50">
                <TabsTrigger 
                  value="deposit" 
                  className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-gray-300 transition-all duration-200"
                >
                  <ArrowDownRight className="w-4 h-4 mr-2" />
                  Deposit Funds
                </TabsTrigger>
                <TabsTrigger 
                  value="withdraw"
                  className="data-[state=active]:bg-green-600 data-[state=active]:text-white text-gray-300 transition-all duration-200"
                >
                  <ArrowUpRight className="w-4 h-4 mr-2" />
                  Withdraw Funds
                </TabsTrigger>
              </TabsList>

              <TabsContent value="deposit" className="space-y-6">
                <DepositPage 
                  userInfo={userInfo}
                  onBack={onBack}
                />
              </TabsContent>

              <TabsContent value="withdraw" className="space-y-6">
                <WithdrawPage
                  withdrawalEnabled={withdrawalEnabled}
                  referralCount={referralCount}
                  userBalance={depositBalance}
                  userInfo={userInfo}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default WalletPage;