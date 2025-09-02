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
      const success = await dbService.convertEarningsToDeposit(userInfo.telegram_id.toString(), amount);
      
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button
              onClick={onBack}
              variant="ghost"
              className="hover:bg-muted/50"
            >
              ← Back
            </Button>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary/10 rounded-xl">
                <Wallet className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">My Wallet</h1>
                <p className="text-muted-foreground">Manage your earnings and deposits</p>
              </div>
            </div>
          </div>
          <Button
            onClick={loadWalletData}
            variant="outline"
            size="sm"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Balance Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="relative overflow-hidden">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center space-x-3">
                <div className="p-2 bg-yellow-500/10 rounded-lg">
                  <Gift className="w-5 h-5 text-yellow-500" />
                </div>
                <div>
                  <span className="text-lg">Earnings Balance</span>
                  <p className="text-sm text-muted-foreground">From ads, tasks & referrals</p>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-4xl font-bold text-yellow-500">
                  ${userBalance.toFixed(3)}
                </p>
                <div className="text-sm text-muted-foreground">
                  Can be converted to deposit balance
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center space-x-3">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <CreditCard className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <span className="text-lg">Deposit Balance</span>
                  <p className="text-sm text-muted-foreground">Available for withdrawal</p>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-4xl font-bold text-green-500">
                  ${depositBalance.toFixed(3)}
                </p>
                <div className="text-sm text-muted-foreground">
                  Ready to withdraw
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center space-x-3">
                <div className="p-2 bg-purple-500/10 rounded-lg">
                  <DollarSign className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                  <span className="text-lg">Total Value</span>
                  <p className="text-sm text-muted-foreground">Combined balance</p>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-4xl font-bold text-purple-500">
                  ${(userBalance + depositBalance).toFixed(3)}
                </p>
                <div className="text-sm text-muted-foreground">
                  Earnings + Deposit
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Balance Conversion Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <ArrowDownRight className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <span className="text-xl">Convert Earnings to Deposit</span>
                <p className="text-sm text-muted-foreground">Convert your earnings to withdrawable balance</p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <div className="p-1 bg-amber-500/10 rounded">
                  <ArrowDownRight className="w-4 h-4 text-amber-600" />
                </div>
                <div className="text-sm">
                  <p className="font-medium text-amber-800 dark:text-amber-200 mb-1">
                    Conversion Notice
                  </p>
                  <p className="text-amber-700 dark:text-amber-300">
                    Converting earnings incurs a {(conversionFee * 100).toFixed(1)}% fee. 
                    Only deposit balance can be withdrawn to external wallets.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">
                  Amount to Convert (USDT)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    max={userBalance}
                    value={convertAmount}
                    onChange={(e) => setConvertAmount(e.target.value)}
                    className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Enter amount to convert..."
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setConvertAmount(userBalance.toString())}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-xs"
                  >
                    Max
                  </Button>
                </div>
              </div>
              <div className="flex flex-col justify-end">
                <Button
                  onClick={handleConvertBalance}
                  disabled={loading || !convertAmount || parseFloat(convertAmount) <= 0 || parseFloat(convertAmount) > userBalance}
                  className="w-full h-[52px]"
                  size="lg"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                  ) : (
                    <>
                      <ArrowDownRight className="w-4 h-4 mr-2" />
                      Convert Now
                    </>
                  )}
                </Button>
              </div>
            </div>

            {convertAmount && parseFloat(convertAmount) > 0 && (
              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <h4 className="font-medium">Conversion Summary</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Convert Amount:</span>
                    <span className="font-medium">${parseFloat(convertAmount).toFixed(3)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Conversion Fee ({(conversionFee * 100).toFixed(1)}%):</span>
                    <span className="font-medium text-red-500">-${(parseFloat(convertAmount) * conversionFee).toFixed(3)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <span className="font-medium">You'll Receive:</span>
                    <span className="font-bold text-green-500">${(parseFloat(convertAmount) * (1 - conversionFee)).toFixed(3)}</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Main Wallet Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <CreditCard className="w-5 h-5 text-primary" />
              </div>
              <div>
                <span className="text-xl">Wallet Operations</span>
                <p className="text-sm text-muted-foreground">Deposit funds or withdraw your earnings</p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="deposit" className="space-y-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="deposit">
                  <ArrowDownRight className="w-4 h-4 mr-2" />
                  Deposit Funds
                </TabsTrigger>
                <TabsTrigger value="withdraw">
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