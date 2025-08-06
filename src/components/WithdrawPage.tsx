import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DollarSign, Users, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAdmin } from '@/contexts/AdminContext';
import { dbService } from '@/services/database';

interface WithdrawPageProps {
  withdrawalEnabled: boolean;
  referralCount: number;
  userBalance: number;
  userInfo: any;
}

const WithdrawPage: React.FC<WithdrawPageProps> = ({ 
  withdrawalEnabled, 
  referralCount,
  userBalance,
  userInfo
}) => {
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [binancePayId, setBinancePayId] = useState('');
  const [withdrawalMethod, setWithdrawalMethod] = useState('binance');
  const [bkashNumber, setBkashNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [withdrawalHistory, setWithdrawalHistory] = useState<any[]>([]);
  const { toast } = useToast();
  const { settings } = useAdmin();

  const minWithdraw = parseFloat(settings.minWithdrawal);
  const requiredReferrals = parseInt(settings.requiredReferrals);

  useEffect(() => {
    loadWithdrawalHistory();
  }, [userInfo]);

  const loadWithdrawalHistory = async () => {
    if (userInfo?.id) {
      try {
        const history = await dbService.getWithdrawalRequests();
        const userHistory = history.filter(w => w.telegram_id === userInfo.id.toString());
        setWithdrawalHistory(userHistory);
      } catch (error) {
        console.error('Error loading withdrawal history:', error);
      }
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawalEnabled) {
      toast({
        title: "Withdrawal Disabled",
        description: `You need ${requiredReferrals} successful referrals to enable withdrawals. Current: ${referralCount}`,
        variant: "destructive"
      });
      return;
    }

    const amount = parseFloat(withdrawAmount);
    
    if (!amount || amount < minWithdraw) {
      toast({
        title: "Invalid Amount",
        description: `Minimum withdrawal is $${minWithdraw}`,
        variant: "destructive"
      });
      return;
    }

    if (amount > userBalance) {
      toast({
        title: "Insufficient Balance",
        description: "You don't have enough balance for this withdrawal",
        variant: "destructive"
      });
      return;
    }

    const address = withdrawalMethod === 'binance' ? binancePayId : bkashNumber;
    if (!address.trim()) {
      toast({
        title: "Missing Information",
        description: `Please enter your ${withdrawalMethod === 'binance' ? 'Binance Pay ID' : 'Bkash Number'}`,
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

      try {
        // Deduct balance first
        const newBalance = userBalance - amount;
        const balanceUpdated = await dbService.updateUserBalance(userInfo.id.toString(), newBalance);
        
        if (!balanceUpdated) {
          toast({
            title: "Error",
            description: "Failed to update balance",
            variant: "destructive"
          });
          return;
        }

        const success = await dbService.createWithdrawalRequest({
          telegram_id: userInfo.id.toString(),
          username: userInfo.username || `${userInfo.first_name} ${userInfo.last_name}`,
          amount: amount,
          withdrawal_method: withdrawalMethod,
          wallet_address: address,
          status: 'pending'
        });

      if (success) {
        // Clear form
        setWithdrawAmount('');
        setBinancePayId('');
        setBkashNumber('');

        // Reload history
        loadWithdrawalHistory();

        toast({
          title: "Withdrawal Requested",
          description: "Your withdrawal request has been submitted for approval",
        });
      }
    } catch (error) {
      console.error('Withdrawal error:', error);
      toast({
        title: "Error",
        description: "Failed to submit withdrawal request",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-400';
      case 'pending': return 'text-yellow-400';
      case 'failed': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return '✅';
      case 'pending': return '⏳';
      case 'failed': return '❌';
      default: return '⏳';
    }
  };

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="text-center py-4">
        <h1 className="text-2xl font-bold text-white mb-2">Withdraw Funds</h1>
        <div className="flex items-center justify-center space-x-2">
          <DollarSign className="w-6 h-6 text-green-400" />
          <span className="text-2xl font-bold text-green-400">${userBalance.toFixed(3)}</span>
          <span className="text-gray-400">Available</span>
        </div>
      </div>

      {/* Referral Requirement Notice */}
      {!withdrawalEnabled && (
        <Card className="bg-red-900/20 border-red-500/50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-6 h-6 text-red-400" />
              <div>
                <h3 className="text-red-400 font-semibold">Withdrawal Locked</h3>
                <p className="text-gray-300 text-sm">
                  Complete {requiredReferrals} referrals to unlock withdrawals. 
                  Current: {referralCount}/{requiredReferrals}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Withdrawal Form */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Request Withdrawal</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount" className="text-white">
              Amount (USDT) - Min: ${minWithdraw}
            </Label>
            <Input
              id="amount"
              type="number"
              placeholder="0.00"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              className="bg-gray-700 border-gray-600 text-white"
              min={minWithdraw}
              max={userBalance}
              step="0.01"
              disabled={!withdrawalEnabled}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-white">Withdrawal Method</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={withdrawalMethod === 'binance' ? 'default' : 'outline'}
                onClick={() => setWithdrawalMethod('binance')}
                className="flex-col h-auto p-3"
                disabled={!withdrawalEnabled}
              >
                {withdrawalMethod === 'binance' && <span className="text-green-400 text-lg mb-1">✓</span>}
                <span className="text-sm">Binance Pay</span>
              </Button>
              <Button
                type="button"
                variant={withdrawalMethod === 'bkash' ? 'default' : 'outline'}
                onClick={() => setWithdrawalMethod('bkash')}
                className="flex-col h-auto p-3"
                disabled={!withdrawalEnabled}
              >
                {withdrawalMethod === 'bkash' && <span className="text-green-400 text-lg mb-1">✓</span>}
                <span className="text-sm">Bkash</span>
              </Button>
            </div>
          </div>

          {withdrawalMethod === 'binance' && (
            <div className="space-y-2">
              <Label htmlFor="binanceId" className="text-white">
                Binance Pay ID
              </Label>
              <Input
                id="binanceId"
                type="text"
                placeholder="Enter your Binance Pay ID"
                value={binancePayId}
                onChange={(e) => setBinancePayId(e.target.value)}
                className="bg-gray-700 border-gray-600 text-white"
                disabled={!withdrawalEnabled}
              />
            </div>
          )}
          

          {withdrawalMethod === 'bkash' && (
            <div className="space-y-2">
              <Label htmlFor="bkashNumber" className="text-white">
                Bkash Number
              </Label>
              <Input
                id="bkashNumber"
                type="text"
                placeholder="Enter your Bkash mobile number"
                value={bkashNumber}
                onChange={(e) => setBkashNumber(e.target.value)}
                className="bg-gray-700 border-gray-600 text-white"
                disabled={!withdrawalEnabled}
              />
              <div className="text-sm text-yellow-400 bg-yellow-400/10 border border-yellow-400/30 rounded-lg p-2">
                <p>💱 Exchange Rate: $1 = 130 BDT</p>
                <p>💰 You'll receive: {(parseFloat(withdrawAmount) * 130).toFixed(0)} BDT</p>
              </div>
            </div>
          )}

          <div className="text-sm text-gray-400 space-y-1">
            <p>• Withdrawals are processed within 24-48 hours</p>
            <p>• Admin approval is required for all withdrawals</p>
            <p>• {requiredReferrals} completed referrals required to unlock withdrawals</p>
          </div>

          <Button
            onClick={handleWithdraw}
            disabled={isSubmitting || userBalance < minWithdraw || !withdrawalEnabled}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600"
          >
            {isSubmitting ? "Submitting..." : "Request Withdrawal"}
          </Button>
        </CardContent>
      </Card>

      {/* Withdrawal History */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Withdrawal History</CardTitle>
        </CardHeader>
        <CardContent>
          {withdrawalHistory.length > 0 ? (
            <div className="space-y-3">
              {withdrawalHistory.map((withdrawal) => (
                <div key={withdrawal.id} className="flex justify-between items-center p-3 bg-gray-700 rounded-lg">
                  <div>
                    <p className="text-white font-medium">${withdrawal.amount.toFixed(2)}</p>
                    <p className="text-gray-400 text-sm">{withdrawal.date}</p>
                   <p className="text-gray-400 text-xs">
                     {withdrawal.method === 'binance' ? 'Binance Pay' : 
                      withdrawal.method === 'usdt' ? 'USDT TRC20' : 
                      withdrawal.method === 'bkash' ? `Bkash (${(withdrawal.amount * 130).toFixed(0)} BDT)` : withdrawal.method}
                   </p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center space-x-2">
                      <span>{getStatusIcon(withdrawal.status)}</span>
                      <p className={`font-medium capitalize ${getStatusColor(withdrawal.status)}`}>
                        {withdrawal.status}
                      </p>
                    </div>
                    <p className="text-gray-400 text-xs">{withdrawal.address}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-4">
              No withdrawal history yet
            </p>
          )}
        </CardContent>
      </Card>

      {/* Important Notes */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white text-lg">Important Notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-gray-400">
          <p>• Minimum withdrawal amount: ${minWithdraw} USDT</p>
          <p>• {requiredReferrals} completed referrals required to unlock withdrawals</p>
          <p>• All withdrawals require admin approval</p>
          <p>• Processing time: 24-48 hours after approval</p>
          <p>• Supported methods: Binance Pay & Bkash</p>
          <p>• Bkash rate: $1 = 130 BDT</p>
          <p>• Double-check your wallet address before submitting</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default WithdrawPage;
