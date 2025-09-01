import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Wallet, ArrowUpRight, ArrowDownRight, DollarSign, RefreshCw, CreditCard, Gift } from 'lucide-react';
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
      if (userInfo?.telegram_id) {
        const user = await dbService.getUserByTelegramId(userInfo.telegram_id);
        if (user) {
          setDepositBalance(user.deposit_balance || 0);
          setReferralCount(user.referral_count || 0);
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
      const success = await dbService.convertEarningsToDeposit(userInfo.telegram_id, amount);
      
      if (success) {
        const fee = amount * conversionFee;
        const convertedAmount = amount - fee;
        
        // Update local state
        updateUserBalance(userBalance - amount);
        setDepositBalance(prev => prev + convertedAmount);
        setConvertAmount('');
        
        toast({
          title: "Conversion Successful",
          description: `Converted ${amount.toFixed(3)} USDT to deposit balance (fee: ${fee.toFixed(3)} USDT)`,
        });
        
        // Reload data to ensure accuracy
        loadWalletData();
      } else {
        toast({
          title: "Conversion Failed",
          description: "Failed to convert earnings to deposit balance",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Conversion error:', error);
      toast({
        title: "Error",
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Button
              onClick={onBack}
              variant="ghost"
              className="text-white hover:bg-gray-800"
            >
              ← Back
            </Button>
            <div className="flex items-center space-x-2">
              <Wallet className="w-6 h-6 text-blue-400" />
              <h1 className="text-2xl font-bold text-white">My Wallet</h1>
            </div>
          </div>
          <Button
            onClick={loadWalletData}
            variant="outline"
            size="sm"
            className="border-gray-600 text-white hover:bg-gray-700"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Balance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-blue-600/20 to-cyan-600/20 border-blue-500/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-white flex items-center space-x-2">
                <Gift className="w-5 h-5 text-yellow-400" />
                <span>Earnings Balance</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <p className="text-3xl font-bold text-white mb-2">
                  ${userBalance.toFixed(3)}
                </p>
                <p className="text-blue-300 text-sm">
                  Earned from ads, tasks & referrals
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-600/20 to-emerald-600/20 border-green-500/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-white flex items-center space-x-2">
                <CreditCard className="w-5 h-5 text-green-400" />
                <span>Deposit Balance</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <p className="text-3xl font-bold text-white mb-2">
                  ${depositBalance.toFixed(3)}
                </p>
                <p className="text-green-300 text-sm">
                  Available for withdrawal
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Balance Conversion */}
        <Card className="bg-gray-800/50 backdrop-blur-xl border-gray-700/50 mb-8">
          <CardHeader>
            <CardTitle className="text-white flex items-center space-x-2">
              <ArrowDownRight className="w-5 h-5 text-purple-400" />
              <span>Convert Earnings to Deposit Balance</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-yellow-600/10 border border-yellow-600/30 rounded-lg p-4">
              <p className="text-yellow-400 text-sm">
                <strong>Note:</strong> Converting earnings to deposit balance incurs a {(conversionFee * 100).toFixed(1)}% fee. 
                Only deposit balance can be withdrawn.
              </p>
            </div>

            <div className="flex space-x-4">
              <div className="flex-1">
                <label className="block text-gray-300 text-sm mb-2">
                  Amount to Convert (USDT)
                </label>
                <input
                  type="number"
                  step="0.001"
                  min="0"
                  max={userBalance}
                  value={convertAmount}
                  onChange={(e) => setConvertAmount(e.target.value)}
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                  placeholder="Enter amount..."
                />
              </div>
              <div className="flex flex-col justify-end">
                <Button
                  onClick={handleConvertBalance}
                  disabled={loading || !convertAmount || parseFloat(convertAmount) <= 0}
                  className="bg-purple-600 hover:bg-purple-700 h-[48px]"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                  ) : (
                    'Convert'
                  )}
                </Button>
              </div>
            </div>

            {convertAmount && parseFloat(convertAmount) > 0 && (
              <div className="bg-gray-700/50 rounded-lg p-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Convert Amount:</span>
                  <span className="text-white">${parseFloat(convertAmount).toFixed(3)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Conversion Fee ({(conversionFee * 100).toFixed(1)}%):</span>
                  <span className="text-red-400">-${(parseFloat(convertAmount) * conversionFee).toFixed(3)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold border-t border-gray-600 pt-2 mt-2">
                  <span className="text-white">You'll Receive:</span>
                  <span className="text-green-400">${(parseFloat(convertAmount) * (1 - conversionFee)).toFixed(3)}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Main Wallet Actions */}
        <Card className="bg-gray-800/50 backdrop-blur-xl border-gray-700/50">
          <CardHeader>
            <CardTitle className="text-white">Wallet Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="deposit" className="space-y-6">
              <TabsList className="grid w-full grid-cols-2 bg-gray-700/50">
                <TabsTrigger 
                  value="deposit"
                  className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                >
                  <ArrowDownRight className="w-4 h-4 mr-2" />
                  Deposit
                </TabsTrigger>
                <TabsTrigger 
                  value="withdraw"
                  className="data-[state=active]:bg-green-600 data-[state=active]:text-white"
                >
                  <ArrowUpRight className="w-4 h-4 mr-2" />
                  Withdraw
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