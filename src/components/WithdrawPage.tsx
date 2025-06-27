
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DollarSign, Users, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface WithdrawPageProps {
  withdrawalEnabled?: boolean;
  referralCount?: number;
}

const WithdrawPage: React.FC<WithdrawPageProps> = ({ 
  withdrawalEnabled = false, 
  referralCount = 0 
}) => {
  const [balance, setBalance] = useState(0);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [binancePayId, setBinancePayId] = useState('');
  const [usdtAddress, setUsdtAddress] = useState('');
  const [withdrawalMethod, setWithdrawalMethod] = useState('binance');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [withdrawalHistory, setWithdrawalHistory] = useState<any[]>([]);
  const { toast } = useToast();

  const minWithdraw = 1.0;
  const requiredReferrals = 5;

  useEffect(() => {
    loadBalance();
    loadWithdrawalHistory();
  }, []);

  const loadBalance = () => {
    const storedBalance = localStorage.getItem('balance');
    setBalance(parseFloat(storedBalance || '0'));
  };

  const loadWithdrawalHistory = () => {
    const storedHistory = localStorage.getItem('withdrawalHistory');
    if (storedHistory) {
      setWithdrawalHistory(JSON.parse(storedHistory));
    } else {
      // Mock data for demonstration
      setWithdrawalHistory([
        {
          id: '1',
          amount: 5.00,
          status: 'completed',
          date: '2023-12-01',
          method: 'binance',
          address: 'test123'
        },
        {
          id: '2',
          amount: 2.50,
          status: 'pending',
          date: '2023-12-15',
          method: 'usdt',
          address: 'TXabc123...'
        }
      ]);
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

    if (amount > balance) {
      toast({
        title: "Insufficient Balance",
        description: "You don't have enough balance for this withdrawal",
        variant: "destructive"
      });
      return;
    }

    const address = withdrawalMethod === 'binance' ? binancePayId : usdtAddress;
    if (!address.trim()) {
      toast({
        title: "Missing Information",
        description: `Please enter your ${withdrawalMethod === 'binance' ? 'Binance Pay ID' : 'USDT TRC20 Address'}`,
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const withdrawalRequest = {
        id: Date.now().toString(),
        amount: amount,
        method: withdrawalMethod,
        address: address,
        status: 'pending',
        date: new Date().toISOString().split('T')[0],
        userId: 'user123'
      };

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Update local balance
      const newBalance = balance - amount;
      localStorage.setItem('balance', newBalance.toString());
      setBalance(newBalance);

      // Add to history
      const updatedHistory = [withdrawalRequest, ...withdrawalHistory];
      setWithdrawalHistory(updatedHistory);
      localStorage.setItem('withdrawalHistory', JSON.stringify(updatedHistory));

      // Clear form
      setWithdrawAmount('');
      setBinancePayId('');
      setUsdtAddress('');

      toast({
        title: "Withdrawal Requested",
        description: "Your withdrawal request has been submitted for approval",
      });

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
          <span className="text-2xl font-bold text-green-400">${balance.toFixed(2)}</span>
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
              max={balance}
              step="0.01"
              disabled={!withdrawalEnabled}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-white">Withdrawal Method</Label>
            <div className="flex space-x-2">
              <Button
                type="button"
                variant={withdrawalMethod === 'binance' ? 'default' : 'outline'}
                onClick={() => setWithdrawalMethod('binance')}
                className="flex-1"
                disabled={!withdrawalEnabled}
              >
                Binance Pay
              </Button>
              <Button
                type="button"
                variant={withdrawalMethod === 'usdt' ? 'default' : 'outline'}
                onClick={() => setWithdrawalMethod('usdt')}
                className="flex-1"
                disabled={!withdrawalEnabled}
              >
                USDT TRC20
              </Button>
            </div>
          </div>

          {withdrawalMethod === 'binance' ? (
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
          ) : (
            <div className="space-y-2">
              <Label htmlFor="usdtAddress" className="text-white">
                USDT TRC20 Address
              </Label>
              <Input
                id="usdtAddress"
                type="text"
                placeholder="Enter your USDT TRC20 wallet address"
                value={usdtAddress}
                onChange={(e) => setUsdtAddress(e.target.value)}
                className="bg-gray-700 border-gray-600 text-white"
                disabled={!withdrawalEnabled}
              />
            </div>
          )}

          <div className="text-sm text-gray-400 space-y-1">
            <p>• Withdrawals are processed within 24-48 hours</p>
            <p>• Admin approval is required for all withdrawals</p>
            <p>• {requiredReferrals} completed referrals required to unlock withdrawals</p>
          </div>

          <Button
            onClick={handleWithdraw}
            disabled={isSubmitting || balance < minWithdraw || !withdrawalEnabled}
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
                    <p className="text-gray-400 text-xs">{withdrawal.method === 'binance' ? 'Binance Pay' : 'USDT TRC20'}</p>
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
          <p>• Supported methods: Binance Pay & USDT TRC20</p>
          <p>• Double-check your wallet address before submitting</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default WithdrawPage;
