
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const WithdrawPage: React.FC = () => {
  const [balance, setBalance] = useState(0);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [binancePayId, setBinancePayId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [withdrawalHistory, setWithdrawalHistory] = useState<any[]>([]);
  const { toast } = useToast();

  const minWithdraw = 1.0;

  useEffect(() => {
    loadBalance();
    loadWithdrawalHistory();
  }, []);

  const loadBalance = () => {
    const storedBalance = localStorage.getItem('balance');
    setBalance(parseFloat(storedBalance || '0'));
  };

  const loadWithdrawalHistory = () => {
    // This would load from Google Sheets API
    // Mock data for now
    setWithdrawalHistory([
      {
        id: '1',
        amount: 5.00,
        status: 'completed',
        date: '2023-12-01',
        binanceId: 'test123'
      },
      {
        id: '2',
        amount: 2.50,
        status: 'pending',
        date: '2023-12-15',
        binanceId: 'test456'
      }
    ]);
  };

  const handleWithdraw = async () => {
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

    if (!binancePayId.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter your Binance Pay ID",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // This would submit to Google Sheets API for admin approval
      const withdrawalRequest = {
        id: Date.now().toString(),
        amount: amount,
        binancePayId: binancePayId,
        status: 'pending',
        date: new Date().toISOString().split('T')[0],
        userId: 'user123' // Would be actual user ID
      };

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Update local balance (in real app, this would be handled after admin approval)
      const newBalance = balance - amount;
      localStorage.setItem('balance', newBalance.toString());
      setBalance(newBalance);

      // Add to history
      setWithdrawalHistory(prev => [withdrawalRequest, ...prev]);

      // Clear form
      setWithdrawAmount('');
      setBinancePayId('');

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
      case 'rejected': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="text-center py-4">
        <h1 className="text-2xl font-bold text-white mb-2">Withdraw Funds</h1>
        <div className="flex items-center justify-center space-x-2">
          <DollarSign className="w-6 h-6 text-green-400" />
          <span className="text-2xl font-bold text-white">${balance.toFixed(2)}</span>
          <span className="text-gray-400">Available</span>
        </div>
      </div>

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
            />
          </div>

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
            />
          </div>

          <div className="text-sm text-gray-400 space-y-1">
            <p>• Withdrawals are processed within 24-48 hours</p>
            <p>• Admin approval is required for all withdrawals</p>
            <p>• Make sure your Binance Pay ID is correct</p>
          </div>

          <Button
            onClick={handleWithdraw}
            disabled={isSubmitting || balance < minWithdraw}
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
                  </div>
                  <div className="text-right">
                    <p className={`font-medium capitalize ${getStatusColor(withdrawal.status)}`}>
                      {withdrawal.status}
                    </p>
                    <p className="text-gray-400 text-sm">{withdrawal.binanceId}</p>
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
          <p>• All withdrawals require admin approval</p>
          <p>• Processing time: 24-48 hours after approval</p>
          <p>• Double-check your Binance Pay ID before submitting</p>
          <p>• Rejected withdrawals will be refunded to your balance</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default WithdrawPage;
